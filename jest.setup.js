// Increase timeout for all tests since we're doing real Neo4j operations
jest.setTimeout(30000);

// Set up environment variables for testing
process.env.NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
process.env.NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
process.env.NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'password';

// Global teardown
afterAll(async () => {
  // Add any global cleanup here if needed
});
