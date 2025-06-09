import { courtListenerClientV2 } from "../../src/lib/api/courtListenerClientV2";

describe("CourtListener API Integration Tests", () => {
  // Set longer timeout for API calls
  jest.setTimeout(30000);

  describe("Case Search", () => {
    it("should fetch real CPS-related cases from a state", async () => {
      const cases = await courtListenerClientV2.searchCases("California");
      expect(Array.isArray(cases)).toBe(true);
      expect(cases.length).toBeGreaterThan(0);

      // Verify case structure
      const firstCase = cases[0];
      expect(firstCase).toHaveProperty("id");
      expect(firstCase).toHaveProperty("caseName");
      expect(firstCase).toHaveProperty("court");
      expect(firstCase).toHaveProperty("dateDecided");
    });

    it("should fetch cases with county filter", async () => {
      const cases = await courtListenerClientV2.searchCases("California", "Los Angeles");
      expect(Array.isArray(cases)).toBe(true);

      // Verify cases are from specified county
      cases.forEach(case_ => {
        expect(case_.court.toLowerCase()).toContain("los angeles");
      });
    });
  });

  describe("Case Details", () => {
    it("should fetch detailed information for a specific case", async () => {
      // First get a case ID from search
      const cases = await courtListenerClientV2.searchCases("California");
      const caseId = cases[0].id;

      // Then fetch its details
      const caseDetails = await courtListenerClientV2.getCaseDetails(caseId);
      expect(caseDetails).toHaveProperty("id", caseId);
      expect(caseDetails).toHaveProperty("summary");
      expect(caseDetails).toHaveProperty("status");
    });
  });

  describe("Judge History", () => {
    it("should fetch history for judges handling CPS cases", async () => {
      const cases = await courtListenerClientV2.searchCases("California");
      const judgeName = cases[0].court.split(",")[0]; // Usually format is "Judge Name, Court"

      const history = await courtListenerClientV2.getJudgeHistory(judgeName);
      expect(history).toHaveProperty("results");
      expect(Array.isArray(history.results)).toBe(true);
      expect(history.results.length).toBeGreaterThan(0);
    });
  });

  describe("Batch Operations", () => {
    it("should search cases across multiple jurisdictions", async () => {
      const locations = [
        { state: "California", county: "Los Angeles" },
        { state: "California", county: "San Francisco" },
        { state: "New York", county: "Kings" },
      ];

      const cases = await courtListenerClientV2.batchSearchCases(locations);
      expect(Array.isArray(cases)).toBe(true);
      expect(cases.length).toBeGreaterThan(0);
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid state names gracefully", async () => {
      await expect(courtListenerClientV2.searchCases("InvalidState")).rejects.toThrow();
    });

    it("should handle invalid case IDs gracefully", async () => {
      await expect(courtListenerClientV2.getCaseDetails("invalid-id")).rejects.toThrow();
    });
  });
});
