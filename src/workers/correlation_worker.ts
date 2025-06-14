import { EntityIndex } from '../models/entity_index';
import { Neo4jEntityStore } from '../models/neo4j_entity_store';

export interface GraphSet {
  scenario_hash: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    created_at: string;
    graph_density: number;
    conflict_rate: number;
  };
}

export interface GraphNode {
  id: string;
  type: 'Individual' | 'Vendor' | 'NGO' | 'Agency' | 'PAC' | 'Legislator';
  properties: Record<string, any>;
  source_derivation: string;
}

export interface GraphEdge {
  from_id: string;
  to_id: string;
  relationship: string;
  properties: {
    amount_usd?: number;
    start_date?: string;
    end_date?: string;
    statute_ref?: string;
    source: string;
    confidence: number;
    loop_id?: string;
  };
}

interface RawDataSet {
  scenario_hash: string;
  facts: RawFact[];
}

interface RawFact {
  entity_id: string;
  fact_type: 'contract' | 'donation' | 'officer_of' | 'lobbied' | 'funded_by';
  payload: any;
  source_url?: string;
  confidence: number;
}

export class CorrelationWorker {
  private entityIndex: EntityIndex;
  private neo4jStore: Neo4jEntityStore;

  constructor(entityIndex: EntityIndex, neo4jStore: Neo4jEntityStore) {
    this.entityIndex = entityIndex;
    this.neo4jStore = neo4jStore;
  }

  async processRawData(rawData: RawDataSet): Promise<GraphSet> {
    console.log('Starting correlation for scenario:', rawData.scenario_hash);

    try {
      // Stage 4.1: Graph Merge
      const mergedGraph = await this.mergeGraph(rawData);
      
      // Stage 4.2: Circular-Flow Detector
      const annotatedGraph = await this.detectCircularFlows(mergedGraph);
      
      // Stage 4.3: Graph Quality Gate
      const validatedGraph = await this.validateGraph(annotatedGraph);
      
      console.log('CorrelationCompleted:', {
        scenario_hash: rawData.scenario_hash,
        nodes: validatedGraph.nodes.length,
        edges: validatedGraph.edges.length
      });

      return validatedGraph;

    } catch (error) {
      console.error('GraphConflict:', error);
      throw error;
    }
  }

  private async mergeGraph(rawData: RawDataSet): Promise<GraphSet> {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const nodeMap = new Map<string, GraphNode>();

    // Process each raw fact
    for (const fact of rawData.facts) {
      try {
        // Harmonize entity ID
        const harmonizedId = await this.harmonizeId(fact.entity_id);
        
        // Create or update node
        if (!nodeMap.has(harmonizedId)) {
          const node = await this.createNode(harmonizedId, fact);
          nodes.push(node);
          nodeMap.set(harmonizedId, node);
        }

        // Create edges based on fact type
        const newEdges = await this.createEdgesFromFact(fact, harmonizedId);
        edges.push(...newEdges);

      } catch (error) {
        console.error('Failed to process fact:', fact, error);
        // Continue processing other facts
      }
    }

    // Check for orphan nodes and infer links if needed
    const orphanNodes = this.detectOrphanNodes(nodes, edges);
    if (orphanNodes.length > 0) {
      console.log('Orphan nodes detected, calling InferLinks:', orphanNodes.length);
      const inferredEdges = await this.inferLinks(orphanNodes, nodes);
      edges.push(...inferredEdges);
    }

    // Upsert to Neo4j
    await this.upsertToNeo4j(nodes, edges, rawData.scenario_hash);

    return {
      scenario_hash: rawData.scenario_hash,
      nodes,
      edges,
      metadata: {
        created_at: new Date().toISOString(),
        graph_density: this.calculateGraphDensity(nodes, edges),
        conflict_rate: 0 // TODO: Calculate actual conflict rate
      }
    };
  }

  private async detectCircularFlows(graphSet: GraphSet): Promise<GraphSet> {
    try {
      // Use Cypher to detect cycles
      const cycles = await this.runCycleDetection(graphSet);
      
      // Annotate edges with loop IDs
      for (const cycle of cycles) {
        for (const edgeId of cycle.edge_ids) {
          const edge = graphSet.edges.find(e => 
            `${e.from_id}-${e.relationship}-${e.to_id}` === edgeId
          );
          if (edge) {
            edge.properties.loop_id = cycle.loop_id;
          }
        }
      }

      console.log('loop_detection_success:', cycles.length);
      return graphSet;

    } catch (error) {
      console.error('Cycle detection failed, falling back to DFS:', error);
      
      // Fallback to DFS algorithm
      const cycles = this.dfsCircularDetection(graphSet);
      
      // Annotate edges with loop IDs from DFS
      for (const cycle of cycles) {
        for (const edgeId of cycle.edge_ids) {
          const edge = graphSet.edges.find(e => 
            `${e.from_id}-${e.relationship}-${e.to_id}` === edgeId
          );
          if (edge) {
            edge.properties.loop_id = cycle.loop_id;
          }
        }
      }

      console.log('fallback_to_DFS:', cycles.length);
      return graphSet;
    }
  }

  private async validateGraph(graphSet: GraphSet): Promise<GraphSet> {
    // Ensure critical relations exist
    const hasContracts = graphSet.edges.some(e => e.relationship === 'CONTRACTS');
    const hasFundedBy = graphSet.edges.some(e => e.relationship === 'FUNDED_BY');

    if (!hasContracts || !hasFundedBy) {
      console.error('rollback_bad_txn: Missing critical relations');
      throw new Error('Graph validation failed: Missing critical relations');
    }

    console.log('Graph validation passed');
    return graphSet;
  }

  private async harmonizeId(entityId: string): Promise<string> {
    // Use EntityIndex to get canonical entity key
    const entities = await this.entityIndex.searchByAltId('raw', entityId);
    
    if (entities.length > 0) {
      return entities[0].entity_key;
    }

    // If not found, create new entity entry
    // This is a simplified approach - in practice would need more sophisticated ID resolution
    return entityId;
  }

  private async createNode(entityId: string, fact: RawFact): Promise<GraphNode> {
    // Determine node type based on fact context
    const nodeType = this.inferNodeType(fact);
    
    return {
      id: entityId,
      type: nodeType,
      properties: {
        ...fact.payload,
        confidence: fact.confidence
      },
      source_derivation: fact.source_url || 'unknown'
    };
  }

  private async createEdgesFromFact(fact: RawFact, fromId: string): Promise<GraphEdge[]> {
    const edges: GraphEdge[] = [];
    
    // Create edges based on fact type
    switch (fact.fact_type) {
      case 'contract':
        if (fact.payload.agency_id) {
          edges.push({
            from_id: fromId,
            to_id: fact.payload.agency_id,
            relationship: 'CONTRACTS',
            properties: {
              amount_usd: fact.payload.amount,
              start_date: fact.payload.start_date,
              end_date: fact.payload.end_date,
              source: fact.source_url || 'unknown',
              confidence: fact.confidence
            }
          });
        }
        break;
        
      case 'donation':
        if (fact.payload.recipient_id) {
          edges.push({
            from_id: fromId,
            to_id: fact.payload.recipient_id,
            relationship: 'DONOR',
            properties: {
              amount_usd: fact.payload.amount,
              source: fact.source_url || 'unknown',
              confidence: fact.confidence
            }
          });
        }
        break;
        
      // Add other fact types as needed
    }

    return edges;
  }

  private detectOrphanNodes(nodes: GraphNode[], edges: GraphEdge[]): GraphNode[] {
    const connectedNodeIds = new Set<string>();
    
    edges.forEach(edge => {
      connectedNodeIds.add(edge.from_id);
      connectedNodeIds.add(edge.to_id);
    });

    return nodes.filter(node => !connectedNodeIds.has(node.id));
  }

  private async inferLinks(orphanNodes: GraphNode[], allNodes: GraphNode[]): Promise<GraphEdge[]> {
    // Simplified link inference - in practice would use ML/heuristics
    const inferredEdges: GraphEdge[] = [];
    
    // TODO: Implement sophisticated link inference logic
    
    return inferredEdges;
  }

  private async upsertToNeo4j(nodes: GraphNode[], edges: GraphEdge[], scenarioHash: string): Promise<void> {
    // Use Neo4jEntityStore to persist graph data
    // TODO: Implement actual Neo4j upsert logic
    console.log('Upserting to Neo4j:', { nodes: nodes.length, edges: edges.length });
  }

  private calculateGraphDensity(nodes: GraphNode[], edges: GraphEdge[]): number {
    if (nodes.length < 2) return 0;
    const maxPossibleEdges = nodes.length * (nodes.length - 1);
    return edges.length / maxPossibleEdges;
  }

  private async runCycleDetection(graphSet: GraphSet): Promise<Array<{loop_id: string, edge_ids: string[]}>> {
    // TODO: Implement Cypher-based cycle detection
    return [];
  }

  private dfsCircularDetection(graphSet: GraphSet): Array<{loop_id: string, edge_ids: string[]}> {
    // TODO: Implement DFS-based cycle detection
    return [];
  }

  private inferNodeType(fact: RawFact): GraphNode['type'] {
    // Simple heuristic to infer node type from fact
    switch (fact.fact_type) {
      case 'contract':
        return 'Vendor';
      case 'donation':
        return 'Individual';
      default:
        return 'Individual';
    }
  }
}
