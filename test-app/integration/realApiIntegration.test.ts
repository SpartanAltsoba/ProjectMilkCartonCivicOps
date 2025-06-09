import { describe, expect, test, jest, beforeEach, afterEach } from "@jest/globals";
import { courtListenerClientV2 } from "../../lib/apiClients/courtListenerClientV2";
import { dataGovClientV2 } from "../../lib/apiClients/dataGovClientV2";
import { unifiedApiClient } from "../../lib/apiClients/unifiedApiClient";

// These tests will run against real APIs when API keys are available
// They can be skipped in CI/CD if API keys are not configured

const SKIP_REAL_API_TESTS = !process.env.COURT_LISTENER_API_KEY && !process.env.DATA_GOV_API_KEY;

describe("Real API Integration Tests", () => {
  beforeEach(() => {
    if (!SKIP_REAL_API_TESTS) {
      jest.clearAllMocks();
    }
  });

  describe("Court Listener API Integration", () => {
    (SKIP_REAL_API_TESTS ? test.skip : test)(
      "should fetch court cases",
      async () => {
        const result = await courtListenerClientV2.searchCases("CA");

        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);

        if (result.length > 0) {
          const case1 = result[0];
          expect(case1).toHaveProperty("id");
          expect(case1).toHaveProperty("caseName");
          expect(case1).toHaveProperty("court");
        }
      },
      30000
    );

    (SKIP_REAL_API_TESTS ? test.skip : test)(
      "should handle batch requests",
      async () => {
        const locations = [{ state: "CA" }, { state: "NY" }, { state: "TX" }];

        const result = await courtListenerClientV2.batchSearchCases(locations);

        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      },
      60000
    );

    (SKIP_REAL_API_TESTS ? test.skip : test)(
      "should handle pagination",
      async () => {
        const result = await courtListenerClientV2.searchCasesWithPagination("CA", undefined, 1, 5);

        expect(result).toBeDefined();
        expect(result).toHaveProperty("cases");
        expect(result).toHaveProperty("totalCount");
        expect(result).toHaveProperty("hasNext");
        expect(Array.isArray(result.cases)).toBe(true);
      },
      30000
    );
  });

  describe("Data.gov API Integration", () => {
    (SKIP_REAL_API_TESTS ? test.skip : test)(
      "should search datasets",
      async () => {
        const result = await dataGovClientV2.searchDatasets("child welfare");

        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);

        if (result.length > 0) {
          const dataset = result[0];
          expect(dataset).toHaveProperty("id");
          expect(dataset).toHaveProperty("title");
          expect(dataset).toHaveProperty("description");
          expect(dataset).toHaveProperty("distribution");
        }
      },
      30000
    );

    (SKIP_REAL_API_TESTS ? test.skip : test)(
      "should get child welfare stats",
      async () => {
        const result = await dataGovClientV2.getChildWelfareStats("CA");

        expect(result).toBeDefined();
        expect(result).toHaveProperty("state");
        expect(result.state).toBe("CA");
        expect(result).toHaveProperty("fosterCareEntries");
        expect(result).toHaveProperty("adoptions");
        expect(result).toHaveProperty("timeInCare");
        expect(result).toHaveProperty("reunificationRate");
      },
      30000
    );

    (SKIP_REAL_API_TESTS ? test.skip : test)(
      "should get foster care data",
      async () => {
        const result = await dataGovClientV2.getFosterCareData("CA", 2022);

        expect(result).toBeDefined();
        expect(result).toHaveProperty("state");
        expect(result.state).toBe("CA");
        expect(result).toHaveProperty("year");
        expect(result.year).toBe(2022);
        expect(result).toHaveProperty("estimatedFosterChildren");
      },
      30000
    );

    (SKIP_REAL_API_TESTS ? test.skip : test)(
      "should get child abuse data",
      async () => {
        const result = await dataGovClientV2.getChildAbuseData("CA", 2022);

        expect(result).toBeDefined();
        expect(result).toHaveProperty("state");
        expect(result.state).toBe("CA");
        expect(result).toHaveProperty("reportedCases");
        expect(result).toHaveProperty("substantiatedCases");
        expect(result).toHaveProperty("fatalities");
      },
      30000
    );

    (SKIP_REAL_API_TESTS ? test.skip : test)(
      "should get demographic data",
      async () => {
        const result = await dataGovClientV2.getDemographicData("CA", "Los Angeles");

        expect(result).toBeDefined();
        expect(result).toHaveProperty("state");
        expect(result.state).toBe("CA");
        expect(result).toHaveProperty("county");
        expect(result.county).toBe("Los Angeles");
        expect(result).toHaveProperty("population");
        expect(result).toHaveProperty("childPopulation");
        expect(result).toHaveProperty("povertyRate");
      },
      30000
    );

    (SKIP_REAL_API_TESTS ? test.skip : test)(
      "should get education stats",
      async () => {
        const result = await dataGovClientV2.getEducationStats("CA", "Los Angeles");

        expect(result).toBeDefined();
        expect(result).toHaveProperty("state");
        expect(result.state).toBe("CA");
        expect(result).toHaveProperty("graduationRate");
        expect(result).toHaveProperty("chronicAbsenteeism");
        expect(result).toHaveProperty("specialEducationRate");
      },
      30000
    );

    (SKIP_REAL_API_TESTS ? test.skip : test)(
      "should get juvenile justice stats",
      async () => {
        const result = await dataGovClientV2.getJuvenileJusticeStats("CA");

        expect(result).toBeDefined();
        expect(result).toHaveProperty("state");
        expect(result.state).toBe("CA");
        expect(result).toHaveProperty("arrests");
        expect(result).toHaveProperty("detentions");
        expect(result).toHaveProperty("recidivismRate");
      },
      30000
    );

    (SKIP_REAL_API_TESTS ? test.skip : test)(
      "should batch get child welfare stats",
      async () => {
        const states = ["CA", "NY", "TX"];
        const results = await dataGovClientV2.batchGetChildWelfareStats(states);

        expect(results).toBeDefined();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(states.length);

        results.forEach((result, index) => {
          expect(result).toHaveProperty("state");
          expect(result.state).toBe(states[index]);
          expect(result).toHaveProperty("data");
          expect(result.data).toHaveProperty("fosterCareEntries");
        });
      },
      60000
    );
  });

  describe("Unified API Client Integration", () => {
    (SKIP_REAL_API_TESTS ? test.skip : test)(
      "should get comprehensive state analysis",
      async () => {
        const result = await dataGovClientV2.getComprehensiveStateAnalysis("CA", "Los Angeles");

        expect(result).toBeDefined();
        expect(result.state).toBe("CA");
        expect(result.county).toBe("Los Angeles");
        expect(result.analysis).toBeDefined();
        expect(result.generatedAt).toBeDefined();
      },
      90000
    );

    (SKIP_REAL_API_TESTS ? test.skip : test)(
      "should handle state-only analysis",
      async () => {
        const result = await dataGovClientV2.getComprehensiveStateAnalysis("TX");

        expect(result).toBeDefined();
        expect(result.state).toBe("TX");
        expect(result.analysis).toBeDefined();
        expect(result.generatedAt).toBeDefined();
      },
      60000
    );
  });

  describe("Error Handling Tests", () => {
    (SKIP_REAL_API_TESTS ? test.skip : test)(
      "should handle invalid state codes",
      async () => {
        await expect(courtListenerClientV2.searchCases("INVALID")).rejects.toThrow();
      },
      15000
    );

    (SKIP_REAL_API_TESTS ? test.skip : test)(
      "should handle empty search results",
      async () => {
        const result = await dataGovClientV2.searchDatasets(
          "extremely_specific_query_with_no_results_12345"
        );

        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(0);
      },
      15000
    );
  });

  describe("Performance Tests", () => {
    (SKIP_REAL_API_TESTS ? test.skip : test)(
      "should complete requests within reasonable time",
      async () => {
        const startTime = Date.now();

        await courtListenerClientV2.searchCases("CA");

        const duration = Date.now() - startTime;
        expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
      },
      35000
    );

    (SKIP_REAL_API_TESTS ? test.skip : test)(
      "should handle concurrent requests",
      async () => {
        const promises = [
          courtListenerClientV2.searchCases("CA"),
          courtListenerClientV2.searchCases("NY"),
          dataGovClientV2.searchDatasets("education"),
        ];

        const results = await Promise.allSettled(promises);

        // At least some requests should succeed
        const successfulResults = results.filter(r => r.status === "fulfilled");
        expect(successfulResults.length).toBeGreaterThan(0);
      },
      45000
    );
  });
});

// Mock data fallback tests
describe("Mock Data Fallback Tests", () => {
  test("should use mock data when APIs are unavailable", async () => {
    // These tests will always run with mock data
    const result = await courtListenerClientV2.searchCases("CA");

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    // Mock data should have expected structure
    const case1 = result[0];
    expect(case1).toHaveProperty("id");
    expect(case1).toHaveProperty("caseName");
    expect(case1).toHaveProperty("court");
  });

  test("should provide consistent mock data", async () => {
    const result1 = await courtListenerClientV2.searchCases("CA");
    const result2 = await courtListenerClientV2.searchCases("CA");

    expect(result1).toEqual(result2);
  });

  test("should handle mock data for comprehensive analysis", async () => {
    const result = await dataGovClientV2.getComprehensiveStateAnalysis("CA");

    expect(result).toBeDefined();
    expect(result.state).toBe("CA");
    expect(result.analysis).toBeDefined();
    expect(result.analysis.childWelfare).toBeDefined();
    expect(result.analysis.fosterCare).toBeDefined();
    expect(result.analysis.childAbuse).toBeDefined();
  });
});
