import { scoringEngine } from '../../functions/agents/scoring/scoringUtils';
import { logger } from '../../src/lib/logger';

describe('Scoring Engine Tests', () => {
  beforeAll(() => {
    // Set up environment variables for testing
    process.env.GOOGLE_SEARCH_API_KEY = 'test-key';
    process.env.GOOGLE_CSE_ID = 'test-cse';
  });

  beforeEach(() => {
    jest.spyOn(logger, 'info').mockImplementation(() => {});
    jest.spyOn(logger, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should calculate risk scores for a given location', async () => {
    const state = 'WA';
    const county = 'King';

    const scores = await scoringEngine.calculateRiskScores(state, county);

    expect(Array.isArray(scores)).toBe(true);
    expect(scores.length).toBeGreaterThan(0);

    scores.forEach(score => {
      expect(score).toHaveProperty('dimensionId');
      expect(score).toHaveProperty('criteriaId');
      expect(score).toHaveProperty('scoreValue');
      expect(score).toHaveProperty('confidenceScore');
      expect(score).toHaveProperty('rawValue');
      expect(score).toHaveProperty('dataSources');
      
      expect(typeof score.scoreValue).toBe('number');
      expect(score.scoreValue).toBeGreaterThanOrEqual(0);
      expect(score.scoreValue).toBeLessThanOrEqual(100);
      
      expect(typeof score.confidenceScore).toBe('number');
      expect(score.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(score.confidenceScore).toBeLessThanOrEqual(100);
      
      expect(Array.isArray(score.dataSources)).toBe(true);
    });
  });

  it('should handle invalid locations gracefully', async () => {
    const state = 'XX'; // Invalid state
    const scores = await scoringEngine.calculateRiskScores(state);

    expect(Array.isArray(scores)).toBe(true);
    expect(scores.length).toBe(0);
  });

  it('should cache search results', async () => {
    const state = 'CA';
    const county = 'Los Angeles';

    // First call should perform the search
    const scores1 = await scoringEngine.calculateRiskScores(state, county);
    expect(Array.isArray(scores1)).toBe(true);

    // Second call should use cached results
    const scores2 = await scoringEngine.calculateRiskScores(state, county);
    expect(scores2).toEqual(scores1);
  });
});
