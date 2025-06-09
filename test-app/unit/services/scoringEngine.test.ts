import { scoringEngine } from "../lib/scoringEngine";
import { prisma } from "../lib/prisma";
import { performGoogleSearch } from "../lib/googleSearch";

// Mock external dependencies
jest.mock("../lib/prisma", () => ({
  prisma: {
    apiDataCache: {
      findFirst: jest.fn(),
      upsert: jest.fn(),
    },
    scoringDimension: {
      findMany: jest.fn(),
    },
    scoringCriteria: {
      findMany: jest.fn(),
    },
    scoringSnapshot: {
      create: jest.fn(),
    },
  } as any,
}));

jest.mock("../lib/googleSearch", () => ({
  performGoogleSearch: jest.fn(),
}));

describe("ScoringEngine", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("calculateRiskScores", () => {
    it("should calculate risk scores correctly", async () => {
      // Mock scoring dimensions
      ((prisma as any).scoringDimension.findMany as jest.Mock).mockResolvedValue([
        {
          id: 1,
          name: "Child Welfare",
          weight: 1,
          enabled: true,
        },
      ]);

      // Mock scoring criteria
      ((prisma as any).scoringCriteria.findMany as jest.Mock).mockResolvedValue([
        {
          id: 1,
          dimensionId: 1,
          name: "Child Welfare Issues",
          dataSource: "google_search",
          weight: 1,
          thresholdType: "range",
          thresholdValue: { min: 0, max: 100, target: 0 },
          enabled: true,
        },
      ]);

      // Mock Google search results
      (performGoogleSearch as jest.Mock).mockResolvedValue([
        {
          title: "Critical Investigation into Child Welfare System",
          snippet: "Federal investigation reveals serious problems...",
          link: "https://example.com/article1",
        },
        {
          title: "Child Welfare System Under Scrutiny",
          snippet: "Multiple cases of misconduct reported...",
          link: "https://example.com/article2",
        },
      ]);

      const scores = await scoringEngine.calculateRiskScores("California", "Los Angeles");

      // Verify scores were calculated
      expect(scores).toHaveLength(1);
      expect(scores[0]).toMatchObject({
        dimensionId: 1,
        criteriaId: 1,
        scoreValue: expect.any(Number),
        confidenceScore: expect.any(Number),
        dataSources: ["google_search"],
      });

      // Verify risk score is high due to critical keywords
      expect(scores[0].scoreValue).toBeGreaterThan(50);
    });

    it("should handle API errors gracefully", async () => {
      // Mock scoring dimensions for error test
      ((prisma as any).scoringDimension.findMany as jest.Mock).mockResolvedValue([
        {
          id: 1,
          name: "Child Welfare",
          weight: 1,
          enabled: true,
        },
      ]);

      // Mock scoring criteria for error test
      ((prisma as any).scoringCriteria.findMany as jest.Mock).mockResolvedValue([
        {
          id: 1,
          dimensionId: 1,
          name: "Child Welfare Issues",
          dataSource: "google_search",
          weight: 1,
          thresholdType: "range",
          thresholdValue: { min: 0, max: 100, target: 0 },
          enabled: true,
        },
      ]);

      // Mock Google search error
      (performGoogleSearch as jest.Mock).mockRejectedValue(new Error("API Error"));

      const scores = await scoringEngine.calculateRiskScores("California", "Los Angeles");

      // Verify error handling
      expect(scores).toHaveLength(1);
      expect(scores[0]).toMatchObject({
        dimensionId: 1,
        criteriaId: 1,
        scoreValue: 0,
        confidenceScore: 75, // Fallback data gets 75 confidence
        dataSources: ["google_search"],
      });
    });
  });

  describe("caching", () => {
    it("should use cached data when available", async () => {
      const cachedData = {
        dataValue: {
          riskScore: 75,
          indicators: ["investigation", "misconduct"],
        },
      };

      // Mock cache hit
      ((prisma as any).apiDataCache.findFirst as jest.Mock).mockResolvedValue(cachedData);

      // Mock scoring dimensions and criteria for caching test
      ((prisma as any).scoringDimension.findMany as jest.Mock).mockResolvedValue([
        {
          id: 1,
          name: "Child Welfare",
          weight: 1,
          enabled: true,
        },
      ]);

      ((prisma as any).scoringCriteria.findMany as jest.Mock).mockResolvedValue([
        {
          id: 1,
          dimensionId: 1,
          name: "Child Welfare Issues",
          dataSource: "google_search",
          weight: 1,
          thresholdType: "range",
          thresholdValue: { min: 0, max: 100, target: 0 },
          enabled: true,
        },
      ]);

      const scores = await scoringEngine.calculateRiskScores("California", "Los Angeles");

      // Verify cached data was used
      expect(performGoogleSearch).not.toHaveBeenCalled();
      expect(scores[0].scoreValue).toBe(75);
    });
  });

  describe("risk analysis", () => {
    it("should identify high-risk indicators correctly", async () => {
      // Mock scoring dimensions for risk analysis test
      ((prisma as any).scoringDimension.findMany as jest.Mock).mockResolvedValue([
        {
          id: 1,
          name: "Child Welfare",
          weight: 1,
          enabled: true,
        },
      ]);

      // Mock scoring criteria for risk analysis test
      ((prisma as any).scoringCriteria.findMany as jest.Mock).mockResolvedValue([
        {
          id: 1,
          dimensionId: 1,
          name: "Child Welfare Issues",
          dataSource: "google_search",
          weight: 1,
          thresholdType: "range",
          thresholdValue: { min: 0, max: 100, target: 0 },
          enabled: true,
        },
      ]);

      // Mock search results with high-risk keywords
      (performGoogleSearch as jest.Mock).mockResolvedValue([
        {
          title: "Child Death Under CPS Supervision",
          snippet: "Federal investigation launched after fatality...",
          link: "https://example.com/article1",
        },
        {
          title: "CPS Workers Arrested",
          snippet: "Criminal charges filed in child welfare case...",
          link: "https://example.com/article2",
        },
      ]);

      const scores = await scoringEngine.calculateRiskScores("California", "Los Angeles");

      // Verify high risk score due to critical keywords
      expect(scores[0].scoreValue).toBeGreaterThan(70);
      expect(scores[0].rawValue).toMatchObject({
        riskScore: expect.any(Number),
        indicators: expect.arrayContaining(["investigation", "misconduct"]),
      });
    });
  });
});
