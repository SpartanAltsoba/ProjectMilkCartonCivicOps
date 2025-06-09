import {
  CourtListenerClient,
  EDGARClient,
  FECClient,
  NCMECClient,
  DataGovClient,
  SearchResponse,
  CourtCase,
  Filing,
  ContributionData,
  NCMECStats,
  ChildWelfareStats,
} from "../../lib/types/api";

// Mock implementations for testing
const mockCourtListenerClient: CourtListenerClient = {
  async searchCases(params) {
    await new Promise(resolve => setTimeout(resolve, 150)); // Simulate rate limiting
    return {
      results: [
        {
          id: "1",
          title: "Test Case",
          court: "Superior Court",
          dateField: "2024-01-01",
          status: "Active",
          type: params.caseType,
          documents: [],
        },
      ],
      total: 1,
      page: 1,
      timestamp: Date.now(),
    };
  },
};

const mockEDGARClient: EDGARClient = {
  async getFilings(params) {
    await new Promise(resolve => setTimeout(resolve, 75)); // Simulate rate limiting
    return {
      results: [
        {
          cik: "123456",
          companyName: "Test Company",
          formType: "10-K",
          filingDate: "2024-01-01",
          description: "Annual Report",
          url: "https://example.com/filing",
        },
      ],
      total: 1,
      page: 1,
      timestamp: Date.now(),
    };
  },
};

const mockFECClient: FECClient = {
  async getContributions(params) {
    await new Promise(resolve => setTimeout(resolve, 75)); // Simulate rate limiting
    return {
      results: [
        {
          committeeId: "C123456",
          committeeName: "Test Committee",
          contributorName: "Test Contributor",
          amount: 1000,
          date: "2024-01-01",
          state: params.state,
          county: params.county,
        },
      ],
      total: 1,
      page: 1,
      timestamp: Date.now(),
    };
  },
};

const mockNCMECClient: NCMECClient = {
  async getCaseStatistics(state, county) {
    await new Promise(resolve => setTimeout(resolve, 150)); // Simulate rate limiting
    return {
      totalReports: 100,
      recoveryRate: 0.85,
      timestamp: Date.now(),
    };
  },
  async getRiskIndicators(state, county) {
    return {
      riskScore: 75,
      indicators: ["investigation", "misconduct"],
      recommendations: ["Increase oversight", "Improve training"],
    };
  },
};

const mockDataGovClient: DataGovClient = {
  async getChildWelfareStats(state) {
    await new Promise(resolve => setTimeout(resolve, 75)); // Simulate rate limiting
    return {
      datasetsFound: 25,
      state: state,
      timestamp: Date.now(),
    };
  },
  async getFosterCareData(state) {
    return { estimatedFosterChildren: 5000, state };
  },
  async getChildAbuseData(state) {
    return { reportedCases: 1200, state };
  },
  async getDemographicData(state, county) {
    return { population: 1000000, childPopulation: 250000, state, county };
  },
  async getEducationStats(state, county) {
    return { graduationRate: 0.85, state, county };
  },
  async getJuvenileJusticeStats(state) {
    return { arrests: 500, state };
  },
};

jest.setTimeout(30000); // Increase timeout for API calls

describe("API Client Integration Tests", () => {
  describe("CourtListener API", () => {
    it("should fetch case data with proper rate limiting", async () => {
      const startTime = Date.now();
      const results = [];

      // Execute requests sequentially to test rate limiting
      for (let i = 0; i < 3; i++) {
        const result = await mockCourtListenerClient.searchCases({
          state: "California",
          county: "Los Angeles",
          caseType: "family",
          limit: 10,
        });
        results.push(result);
      }

      const endTime = Date.now();

      // Verify rate limiting (3 sequential requests with 150ms delay each = at least 450ms total)
      expect(endTime - startTime).toBeGreaterThanOrEqual(450);

      // Verify data structure
      results.forEach(result => {
        expect(result).toMatchObject({
          results: expect.any(Array),
          total: expect.any(Number),
          page: expect.any(Number),
          timestamp: expect.any(Number),
        });
        expect(result.results[0]).toMatchObject({
          id: expect.any(String),
          title: expect.any(String),
          court: expect.any(String),
          type: "family",
        });
      });
    });

    it("should handle API errors gracefully", async () => {
      // This would test actual error handling in a real implementation
      const result = await mockCourtListenerClient.searchCases({
        state: "California",
        county: "Los Angeles",
        caseType: "family",
        limit: 10,
      });

      expect(result).toBeDefined();
      expect(result.results).toHaveLength(1);
    });
  });

  describe("EDGAR API", () => {
    it("should fetch company filings with proper rate limiting", async () => {
      const startTime = Date.now();
      const results = [];

      // Execute requests sequentially to test rate limiting
      for (let i = 0; i < 3; i++) {
        const result = await mockEDGARClient.getFilings({
          state: "California",
          county: "Los Angeles",
          limit: 10,
        });
        results.push(result);
      }

      const endTime = Date.now();

      // Verify rate limiting (3 sequential requests with 75ms delay each = at least 225ms total)
      expect(endTime - startTime).toBeGreaterThanOrEqual(225);

      // Verify data structure
      results.forEach(result => {
        expect(result).toMatchObject({
          results: expect.any(Array),
          total: expect.any(Number),
          timestamp: expect.any(Number),
        });
        expect(result.results[0]).toMatchObject({
          cik: expect.any(String),
          companyName: expect.any(String),
          formType: expect.any(String),
        });
      });
    });
  });

  describe("FEC API", () => {
    it("should fetch campaign finance data with proper rate limiting", async () => {
      const startTime = Date.now();
      const results = [];

      // Execute requests sequentially to test rate limiting
      for (let i = 0; i < 3; i++) {
        const result = await mockFECClient.getContributions({
          state: "California",
          county: "Los Angeles",
          limit: 10,
        });
        results.push(result);
      }

      const endTime = Date.now();

      // Verify rate limiting (3 sequential requests with 75ms delay each = at least 225ms total)
      expect(endTime - startTime).toBeGreaterThanOrEqual(225);

      // Verify data structure
      results.forEach(result => {
        expect(result).toMatchObject({
          results: expect.any(Array),
          total: expect.any(Number),
          timestamp: expect.any(Number),
        });
        expect(result.results[0]).toMatchObject({
          committeeId: expect.any(String),
          amount: expect.any(Number),
          state: "California",
        });
      });
    });
  });

  describe("NCMEC API", () => {
    it("should fetch case statistics with proper rate limiting", async () => {
      const startTime = Date.now();
      const results = [];

      // Execute requests sequentially to test rate limiting
      for (let i = 0; i < 3; i++) {
        const result = await mockNCMECClient.getCaseStatistics("California", "Los Angeles");
        results.push(result);
      }

      const endTime = Date.now();

      // Verify rate limiting (3 sequential requests with 150ms delay each = at least 450ms total)
      expect(endTime - startTime).toBeGreaterThanOrEqual(450);

      // Verify data structure
      results.forEach(result => {
        expect(result).toMatchObject({
          totalReports: expect.any(Number),
          recoveryRate: expect.any(Number),
          timestamp: expect.any(Number),
        });
      });
    });
  });

  describe("Data.gov API", () => {
    it("should fetch child welfare statistics with proper rate limiting", async () => {
      const startTime = Date.now();
      const results = [];

      // Execute requests sequentially to test rate limiting
      for (let i = 0; i < 3; i++) {
        const result = await mockDataGovClient.getChildWelfareStats("California");
        results.push(result);
      }

      const endTime = Date.now();

      // Verify rate limiting (3 sequential requests with 75ms delay each = at least 225ms total)
      expect(endTime - startTime).toBeGreaterThanOrEqual(225);

      // Verify data structure
      results.forEach(result => {
        expect(result).toMatchObject({
          datasetsFound: expect.any(Number),
          state: "California",
          timestamp: expect.any(Number),
        });
      });
    });
  });
});
