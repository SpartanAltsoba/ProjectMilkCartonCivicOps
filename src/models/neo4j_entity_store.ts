import neo4j, { Driver, Session, ManagedTransaction } from 'neo4j-driver';
import { GraphNode, GraphEdge } from '../workers/correlation_worker';

export class Neo4jEntityStore {
  private driver: Driver;
  private retryAttempts = 3;

  constructor(
    uri: string,
    username: string,
    password: string,
    database: string = 'neo4j'
  ) {
    this.driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  }

  async init(): Promise<void> {
    try {
      // Verify connection and create constraints
      const session = this.driver.session();
      await this.createConstraints(session);
      await session.close();
    } catch (error) {
      console.error('Failed to initialize Neo4j store:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.driver.close();
  }

  async upsertGraph(
    nodes: GraphNode[],
    edges: GraphEdge[],
    scenarioHash: string
  ): Promise<void> {
    const session = this.driver.session();
    
    try {
      await session.executeWrite(async (tx) => {
        // Create scenario tag
        await tx.run(
          `CREATE (s:Scenario {hash: $hash, created_at: datetime()})`,
          { hash: scenarioHash }
        );

        // Upsert nodes with retry logic
        for (const node of nodes) {
          let attempts = 0;
          while (attempts < this.retryAttempts) {
            try {
              await this.upsertNode(tx, node, scenarioHash);
              break;
            } catch (error) {
              attempts++;
              if (attempts === this.retryAttempts) {
                throw error;
              }
              await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
            }
          }
        }

        // Upsert edges with retry logic
        for (const edge of edges) {
          let attempts = 0;
          while (attempts < this.retryAttempts) {
            try {
              await this.upsertEdge(tx, edge, scenarioHash);
              break;
            } catch (error) {
              attempts++;
              if (attempts === this.retryAttempts) {
                throw error;
              }
              await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
            }
          }
        }
      });

    } catch (error) {
      console.error('Failed to upsert graph:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  private async createConstraints(session: Session): Promise<void> {
    await session.executeWrite(async (tx) => {
      // Create constraints for each node type
      const nodeTypes = [
        'Individual',
        'Vendor',
        'NGO',
        'Agency',
        'PAC',
        'Legislator'
      ];

      for (const type of nodeTypes) {
        await tx.run(`
          CREATE CONSTRAINT IF NOT EXISTS FOR (n:${type})
          REQUIRE n.id IS UNIQUE
        `);
      }

      // Create constraint for scenario hash
      await tx.run(`
        CREATE CONSTRAINT IF NOT EXISTS FOR (s:Scenario)
        REQUIRE s.hash IS UNIQUE
      `);
    });
  }

  private async upsertNode(
    tx: ManagedTransaction,
    node: GraphNode,
    scenarioHash: string
  ): Promise<void> {
    const query = `
      MERGE (n:${node.type} {id: $id})
      SET n += $properties
      WITH n
      MATCH (s:Scenario {hash: $scenarioHash})
      MERGE (n)-[:PART_OF]->(s)
    `;

    await tx.run(query, {
      id: node.id,
      properties: {
        ...node.properties,
        source_derivation: node.source_derivation,
        last_updated: new Date().toISOString()
      },
      scenarioHash
    });
  }

  private async upsertEdge(
    tx: ManagedTransaction,
    edge: GraphEdge,
    scenarioHash: string
  ): Promise<void> {
    const query = `
      MATCH (from {id: $fromId})
      MATCH (to {id: $toId})
      MATCH (s:Scenario {hash: $scenarioHash})
      MERGE (from)-[r:${edge.relationship}]->(to)
      SET r += $properties
      WITH from, r, to
      MERGE (r)-[:PART_OF]->(s)
    `;

    await tx.run(query, {
      fromId: edge.from_id,
      toId: edge.to_id,
      properties: {
        ...edge.properties,
        last_updated: new Date().toISOString()
      },
      scenarioHash
    });
  }

  async findCycles(scenarioHash: string): Promise<Array<{loop_id: string, edge_ids: string[]}>> {
    const session = this.driver.session();
    
    try {
      const result = await session.executeRead(async (tx) => {
        // Find cycles using Cypher path finding
        const query = `
          MATCH path = (start)-[*3..10]->(start)
          WHERE ALL(r IN relationships(path) WHERE EXISTS((r)-[:PART_OF]->(:Scenario {hash: $hash})))
          WITH path, 
               [r IN relationships(path) | type(r) + '_' + id(r)] AS edge_ids,
               rand() AS random
          RETURN
            apoc.text.random(32) AS loop_id,
            edge_ids
          ORDER BY random
          LIMIT 1000
        `;

        const response = await tx.run(query, { hash: scenarioHash });
        
        return response.records.map(record => ({
          loop_id: record.get('loop_id'),
          edge_ids: record.get('edge_ids')
        }));
      });

      return result;

    } catch (error) {
      console.error('Failed to find cycles:', error);
      return [];
    } finally {
      await session.close();
    }
  }

  async getSubgraph(scenarioHash: string): Promise<{nodes: GraphNode[], edges: GraphEdge[]}> {
    const session = this.driver.session();
    
    try {
      return await session.executeRead(async (tx) => {
        // Get all nodes and edges for scenario
        const query = `
          MATCH (n)-[r]->(m)
          WHERE EXISTS((n)-[:PART_OF]->(:Scenario {hash: $hash}))
          AND EXISTS((m)-[:PART_OF]->(:Scenario {hash: $hash}))
          RETURN 
            collect(distinct {
              id: n.id,
              type: labels(n)[0],
              properties: properties(n),
              source_derivation: n.source_derivation
            }) as nodes,
            collect({
              from_id: n.id,
              to_id: m.id,
              relationship: type(r),
              properties: properties(r)
            }) as edges
        `;

        const result = await tx.run(query, { hash: scenarioHash });
        const record = result.records[0];

        return {
          nodes: record.get('nodes'),
          edges: record.get('edges')
        };
      });

    } catch (error) {
      console.error('Failed to get subgraph:', error);
      return { nodes: [], edges: [] };
    } finally {
      await session.close();
    }
  }

  async deleteScenario(scenarioHash: string): Promise<void> {
    const session = this.driver.session();
    
    try {
      await session.executeWrite(async (tx) => {
        // Delete scenario and all its relationships
        const query = `
          MATCH (s:Scenario {hash: $hash})
          OPTIONAL MATCH (n)-[r:PART_OF]->(s)
          DELETE r, s
        `;

        await tx.run(query, { hash: scenarioHash });
      });

    } catch (error) {
      console.error('Failed to delete scenario:', error);
      throw error;
    } finally {
      await session.close();
    }
  }
}
