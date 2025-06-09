import { scoringEngine } from "../../lib/scoringEngine";
import { performGoogleSearch } from "../../lib/googleSearch";

// Mock external dependencies for E2E testing
jest.mock("../../lib/prisma", () => ({
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

jest.mock("../../lib/googleSearch", () => ({
  performGoogleSearch: jest.fn(),
}));

jest.setTimeout(45000); // Increase timeout for E2E tests

describe("End-to-End Workflow Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Complete Risk Assessment Workflow", () => {
    it("should perform complete risk assessment for high-risk location", async () => {
      const { prisma } = require("../../lib/prisma");

      // Setup realistic scoring dimensions and criteria
      ((prisma as any).scoringDimension.findMany as jest.Mock).mockResolvedValue([
        {
          id: 1,
          name: "Child Welfare System",
          description: "Assessment of child welfare system performance",
          weight: 0.4,
          enabled: true,
        },
        {
          id: 2,
          name: "Government Transparency",
          description: "Assessment of government transparency and accountability",
          weight: 0.3,
          enabled: true,
        },
        {
          id: 3,
          name: "Legal System Integrity",
          description: "Assessment of legal system performance",
          weight: 0.3,
          enabled: true,
        },
      ]);

      ((prisma as any).scoringCriteria.findMany as jest.Mock).mockImplementation(({ where }) => {
        const criteriaMap: Record<number, any[]> = {
          1: [
            {
              id: 1,
              dimensionId: 1,
              name: "Child Welfare Issues",
              description: "Incidents and problems in child welfare system",
              dataSource: "google_search",
              weight: 0.6,
              thresholdType: "range",
              thresholdValue: { min: 0, max: 100, target: 0 },
              enabled: true,
            },
            {
              id: 2,
              dimensionId: 1,
              name: "Foster Care Performance",
              description: "Foster care system performance metrics",
              dataSource: "data_gov",
              weight: 0.4,
              thresholdType: "range",
              thresholdValue: { min: 0, max: 100, target: 80 },
              enabled: true,
            },
          ],
          2: [
            {
              id: 3,
              dimensionId: 2,
              name: "Corruption Investigations",
              description: "Government corruption and investigations",
              dataSource: "google_search",
              weight: 1.0,
              thresholdType: "range",
              thresholdValue: { min: 0, max: 100, target: 0 },
              enabled: true,
            },
          ],
          3: [
            {
              id: 4,
              dimensionId: 3,
              name: "Court System Issues",
              description: "Problems and issues in court system",
              dataSource: "google_search",
              weight: 1.0,
              thresholdType: "range",
              thresholdValue: { min: 0, max: 100, target: 0 },
              enabled: true,
            },
          ],
        };
        return Promise.resolve(criteriaMap[where.dimensionId] || []);
      });

      // Mock high-risk search results
      (performGoogleSearch as jest.Mock).mockImplementation(async (query: string) => {
        if (query.includes("child welfare")) {
          return [
            {
              title: "Federal Investigation into Los Angeles Child Services",
              snippet:
                "Federal investigators found systemic failures in child protective services leading to multiple child deaths and emergency removals.",
              link: "https://gov.ca.gov/investigation-report",
            },
            {
              title: "Class Action Lawsuit Against LA County Child Services",
              snippet:
                "Families file class action lawsuit alleging widespread abuse and neglect in foster care system with criminal charges pending.",
              link: "https://courts.ca.gov/lawsuit-details",
            },
            {
              title: "Emergency Federal Oversight of Child Welfare System",
              snippet:
                "Federal oversight imposed after consent decree following investigation into child fatalities and misconduct.",
              link: "https://hhs.gov/oversight-report",
            },
          ];
        } else if (query.includes("corruption")) {
          return [
            {
              title: "County Officials Indicted for Corruption",
              snippet:
                "Multiple county officials arrested and indicted on corruption charges related to child services contracts.",
              link: "https://doj.gov/indictment-news",
            },
            {
              title: "Whistleblower Reveals Systematic Corruption",
              snippet:
                "Former employee reveals widespread corruption and misconduct in government agencies.",
              link: "https://news.com/whistleblower-report",
            },
          ];
        } else if (query.includes("family court")) {
          return [
            {
              title: "Family Court Judge Removed for Misconduct",
              snippet:
                "Family court judge fired for cause following investigation into bias and corruption in child custody cases.",
              link: "https://courts.gov/judge-removal",
            },
          ];
        }
        return [];
      });

      // Mock cache misses to force fresh data
      ((prisma as any).apiDataCache.findFirst as jest.Mock).mockResolvedValue(null);
      ((prisma as any).apiDataCache.upsert as jest.Mock).mockResolvedValue({});
      ((prisma as any).scoringSnapshot.create as jest.Mock).mockResolvedValue({});

      // Execute complete workflow
      const startTime = Date.now();
      const scores = await scoringEngine.calculateRiskScores("California", "Los Angeles");
      const executionTime = Date.now() - startTime;

      // Verify comprehensive results
      expect(scores).toHaveLength(4); // 4 criteria across 3 dimensions

      // Verify high-risk scores due to critical keywords
      const childWelfareScore = scores.find(s => s.criteriaId === 1);
      const corruptionScore = scores.find(s => s.criteriaId === 3);
      const courtScore = scores.find(s => s.criteriaId === 4);

      expect(childWelfareScore?.scoreValue).toBeGreaterThan(50); // High risk due to critical keywords
      expect(corruptionScore?.scoreValue).toBeGreaterThan(40); // High risk due to corruption indicators
      expect(courtScore?.scoreValue).toBeGreaterThan(30); // Medium-high risk

      // Verify data quality
      scores.forEach(score => {
        expect(score.confidenceScore).toBeGreaterThan(50);
        expect(score.rawValue).toBeDefined();
        expect(score.dataSources).toHaveLength(1);
      });

      // Verify search analysis quality
      const searchAnalysis = childWelfareScore?.rawValue;
      expect(searchAnalysis).toMatchObject({
        state: "California",
        county: "Los Angeles",
        totalResults: expect.any(Number),
        riskIndicators: expect.any(Array),
        keyFindings: expect.any(Array),
        riskScore: expect.any(Number),
        summary: expect.objectContaining({
          riskLevel: expect.stringMatching(/CRITICAL|HIGH|MEDIUM/),
          recommendations: expect.any(Array),
        }),
      });

      // Verify risk indicators were detected
      expect(searchAnalysis.riskIndicators.length).toBeGreaterThan(2);
      const highRiskIndicators = searchAnalysis.riskIndicators.filter(
        (indicator: any) => indicator.severity === "HIGH"
      );
      expect(highRiskIndicators.length).toBeGreaterThanOrEqual(1);

      // Save scores to database
      await scoringEngine.saveScores(scores);

      console.log(`✅ Complete workflow executed in ${executionTime}ms`);
      console.log(
        `📊 Risk Scores: Child Welfare: ${childWelfareScore?.scoreValue}, Corruption: ${corruptionScore?.scoreValue || "N/A"}, Courts: ${courtScore?.scoreValue || "N/A"}`
      );
      console.log(`🚨 Risk Level: ${searchAnalysis.summary.riskLevel}`);
      console.log(`📋 Recommendations: ${searchAnalysis.summary.recommendations.length} generated`);
    });

    it("should perform complete risk assessment for low-risk location", async () => {
      const { prisma } = require("../../lib/prisma");

      // Setup same dimensions and criteria as high-risk test
      ((prisma as any).scoringDimension.findMany as jest.Mock).mockResolvedValue([
        {
          id: 1,
          name: "Child Welfare System",
          weight: 0.4,
          enabled: true,
        },
      ]);

      ((prisma as any).scoringCriteria.findMany as jest.Mock).mockResolvedValue([
        {
          id: 1,
          dimensionId: 1,
          name: "Child Welfare Issues",
          dataSource: "google_search",
          weight: 1.0,
          thresholdType: "range",
          thresholdValue: { min: 0, max: 100, target: 0 },
          enabled: true,
        },
      ]);

      // Mock low-risk search results
      (performGoogleSearch as jest.Mock).mockResolvedValue([
        {
          title: "County Receives Award for Child Welfare Excellence",
          snippet:
            "County child welfare department receives state award for excellence in child protection and family services.",
          link: "https://county.gov/award-news",
        },
        {
          title: "Successful Foster Care Program Expansion",
          snippet:
            "County expands successful foster care program with improved outcomes and family reunification rates.",
          link: "https://county.gov/program-expansion",
        },
      ]);

      ((prisma as any).apiDataCache.findFirst as jest.Mock).mockResolvedValue(null);
      ((prisma as any).apiDataCache.upsert as jest.Mock).mockResolvedValue({});

      // Execute workflow
      const scores = await scoringEngine.calculateRiskScores("Utah", "Salt Lake");

      // Verify low-risk results
      expect(scores).toHaveLength(1);
      expect(scores[0].scoreValue).toBeLessThan(50); // Low risk score
      expect(scores[0].rawValue.summary.riskLevel).toMatch(/LOW|MEDIUM/);
      expect(scores[0].rawValue.riskIndicators.length).toBeLessThan(5);

      console.log(`✅ Low-risk assessment completed: Score ${scores[0].scoreValue}`);
    });
  });

  describe("Data Persistence and Retrieval", () => {
    it("should properly cache and retrieve data across multiple requests", async () => {
      const { prisma } = require("../../lib/prisma");

      // Setup basic configuration
      ((prisma as any).scoringDimension.findMany as jest.Mock).mockResolvedValue([
        { id: 1, name: "Test Dimension", weight: 1, enabled: true },
      ]);

      ((prisma as any).scoringCriteria.findMany as jest.Mock).mockResolvedValue([
        {
          id: 1,
          dimensionId: 1,
          name: "Test Criteria",
          dataSource: "google_search",
          weight: 1,
          thresholdType: "range",
          thresholdValue: { min: 0, max: 100, target: 0 },
          enabled: true,
        },
      ]);

      let searchCallCount = 0;
      (performGoogleSearch as jest.Mock).mockImplementation(async () => {
        searchCallCount++;
        return [
          {
            title: "Test Result",
            snippet: "Test content with investigation keyword",
            link: "https://example.com",
          },
        ];
      });

      // First request - should cache data
      ((prisma as any).apiDataCache.findFirst as jest.Mock).mockResolvedValueOnce(null);
      let cacheUpsertCalled = false;
      ((prisma as any).apiDataCache.upsert as jest.Mock).mockImplementation(() => {
        cacheUpsertCalled = true;
        return Promise.resolve({});
      });

      const scores1 = await scoringEngine.calculateRiskScores("California", "Test County");

      // Verify caching occurred
      expect(cacheUpsertCalled).toBe(true);
      expect(scores1).toHaveLength(1);
      expect(scores1[0].scoreValue).toBeGreaterThan(0);

      // Second request - should use cached data
      ((prisma as any).apiDataCache.findFirst as jest.Mock).mockResolvedValueOnce({
        dataValue: {
          state: "California",
          county: "Test County",
          criteriaName: "Test Criteria",
          totalResults: 1,
          riskIndicators: [{ keyword: "investigation", severity: "MEDIUM" }],
          keyFindings: [],
          sourceBreakdown: {},
          riskScore: 50,
          summary: {
            riskLevel: "MEDIUM",
            recommendations: ["Test recommendation"],
          },
        },
      });

      const scores2 = await scoringEngine.calculateRiskScores("California", "Test County");

      // Verify cached data was used
      expect(scores2).toHaveLength(1);
      expect(scores2[0].scoreValue).toBe(50); // Cached score
      expect(searchCallCount).toBeLessThanOrEqual(5); // Limited search calls

      console.log(`✅ Data caching and retrieval verified (${searchCallCount} search calls)`);
    });
  });

  describe("Error Handling and Recovery", () => {
    it("should gracefully handle complete API failures", async () => {
      const { prisma } = require("../../lib/prisma");

      // Setup configuration
      ((prisma as any).scoringDimension.findMany as jest.Mock).mockResolvedValue([
        { id: 1, name: "Test Dimension", weight: 1, enabled: true },
      ]);

      ((prisma as any).scoringCriteria.findMany as jest.Mock).mockResolvedValue([
        {
          id: 1,
          dimensionId: 1,
          name: "Test Criteria",
          dataSource: "google_search",
          weight: 1,
          thresholdType: "range",
          thresholdValue: { min: 0, max: 100, target: 0 },
          enabled: true,
        },
      ]);

      // Mock complete API failure
      (performGoogleSearch as jest.Mock).mockRejectedValue(new Error("Complete API failure"));
      ((prisma as any).apiDataCache.findFirst as jest.Mock).mockResolvedValue(null);
      ((prisma as any).apiDataCache.upsert as jest.Mock).mockResolvedValue({});

      // Should still complete with fallback data
      const scores = await scoringEngine.calculateRiskScores("California", "Test County");

      expect(scores).toHaveLength(1);
      expect(scores[0].scoreValue).toBeGreaterThanOrEqual(0); // Fallback score (could be 0 or 50)
      expect(scores[0].confidenceScore).toBeGreaterThanOrEqual(25); // Fallback confidence
      expect(scores[0].rawValue.totalResults).toBe(0);

      console.log("✅ Complete API failure handled gracefully");
    });

    it("should handle database connection issues", async () => {
      const { prisma } = require("../../lib/prisma");

      // Mock database failure
      ((prisma as any).scoringDimension.findMany as jest.Mock).mockRejectedValue(
        new Error("Database connection failed")
      );

      // Should fall back to default scoring with cached data
      const scores = await scoringEngine.calculateRiskScores("California", "Test County");

      expect(scores).toHaveLength(2); // Default scores for child welfare and transparency
      expect(scores[0].dimensionId).toBe(1); // Child welfare dimension
      expect(scores[1].dimensionId).toBe(2); // Transparency dimension

      scores.forEach(score => {
        expect(score.scoreValue).toBeGreaterThanOrEqual(0);
        expect(score.confidenceScore).toBeGreaterThanOrEqual(25);
        expect(score.rawValue).toBeDefined();
      });

      console.log(`✅ Database failure handled with default scoring (${scores.length} dimensions)`);
    });
  });

  describe("Real-world Scenario Simulation", () => {
    it("should handle mixed API success/failure scenarios", async () => {
      const { prisma } = require("../../lib/prisma");

      // Setup multiple criteria with different data sources
      ((prisma as any).scoringDimension.findMany as jest.Mock).mockResolvedValue([
        { id: 1, name: "Child Welfare", weight: 1, enabled: true },
      ]);

      ((prisma as any).scoringCriteria.findMany as jest.Mock).mockResolvedValue([
        {
          id: 1,
          dimensionId: 1,
          name: "Google Search Criteria",
          dataSource: "google_search",
          weight: 0.5,
          thresholdType: "range",
          thresholdValue: { min: 0, max: 100, target: 0 },
          enabled: true,
        },
        {
          id: 2,
          dimensionId: 1,
          name: "NCMEC Criteria",
          dataSource: "ncmec",
          weight: 0.5,
          thresholdType: "range",
          thresholdValue: { min: 0, max: 100, target: 80 },
          enabled: true,
        },
      ]);

      // Mock mixed success/failure
      let googleSearchCallCount = 0;
      (performGoogleSearch as jest.Mock).mockImplementation(async () => {
        googleSearchCallCount++;
        if (googleSearchCallCount <= 2) {
          return [
            {
              title: "Successful Search Result",
              snippet: "Content with investigation keyword",
              link: "https://example.com",
            },
          ];
        } else {
          throw new Error("API rate limit exceeded");
        }
      });

      ((prisma as any).apiDataCache.findFirst as jest.Mock).mockResolvedValue(null);
      ((prisma as any).apiDataCache.upsert as jest.Mock).mockResolvedValue({});

      // Execute scoring
      const scores = await scoringEngine.calculateRiskScores("California", "Mixed County");

      // Should have results for both criteria despite partial failures
      expect(scores).toHaveLength(2);

      const googleScore = scores.find(s => s.criteriaId === 1);
      const ncmecScore = scores.find(s => s.criteriaId === 2);

      expect(googleScore?.scoreValue).toBeGreaterThan(0);
      expect(ncmecScore?.scoreValue).toBeGreaterThanOrEqual(0);

      console.log(
        `✅ Mixed scenario handled: Google: ${googleScore?.scoreValue}, NCMEC: ${ncmecScore?.scoreValue}`
      );
    });
  });
});
