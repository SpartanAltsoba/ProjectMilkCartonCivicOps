import { courtListenerClientV2 } from "../../src/lib/api/courtListenerClientV2";

describe("CourtListener API Simple Test", () => {
  // Set longer timeout for API calls
  jest.setTimeout(60000);

  it("should connect to CourtListener API and fetch cases", async () => {
    try {
      const cases = await courtListenerClientV2.searchCases("California");

      console.log("API Response received:", cases.length, "cases");

      expect(Array.isArray(cases)).toBe(true);

      if (cases.length > 0) {
        const firstCase = cases[0];
        console.log("First case:", firstCase);

        expect(firstCase).toHaveProperty("id");
        expect(firstCase).toHaveProperty("caseName");
      }
    } catch (error) {
      console.error("API Test Error:", error);
      throw error;
    }
  });
});
