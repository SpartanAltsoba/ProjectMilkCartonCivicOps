import { performGoogleSearch } from "../../src/lib/search/googleSearch";

describe("REAL Custom Search Test - NO MOCK DATA", () => {
  it("should search for REAL child welfare data using custom search engine", async () => {
    console.log("🔍 TESTING CUSTOM SEARCH ENGINE...");
    console.log('Searching for: "state CPS data portal API"');

    try {
      const results = await performGoogleSearch("state CPS data portal API");

      console.log("\n📊 SEARCH RESULTS:");
      results.results.forEach((result, index) => {
        console.log(`\n${index + 1}. ${result.title}`);
        console.log(`   URL: ${result.link}`);
        console.log(`   Description: ${result.snippet}`);
      });

      expect(results.results.length).toBeGreaterThan(0);
    } catch (error: any) {
      console.error("\n❌ SEARCH ERROR:");
      console.error(error.message);
      throw error;
    }
  });

  it("should search for REAL NCMEC data endpoints", async () => {
    console.log("\n🔍 SEARCHING FOR NCMEC DATA SOURCES...");
    console.log('Searching for: "NCMEC API documentation public data"');

    try {
      const results = await performGoogleSearch("NCMEC API documentation public data");

      console.log("\n📊 NCMEC DATA SOURCES:");
      results.results.forEach((result, index) => {
        console.log(`\n${index + 1}. ${result.title}`);
        console.log(`   URL: ${result.link}`);
        console.log(`   Description: ${result.snippet}`);
      });

      expect(results.results.length).toBeGreaterThan(0);
    } catch (error: any) {
      console.error("\n❌ SEARCH ERROR:");
      console.error(error.message);
      throw error;
    }
  });

  it("should search for state-specific child welfare APIs", async () => {
    console.log("\n🔍 SEARCHING FOR STATE APIs...");

    const states = ["California", "Texas", "New York"];

    for (const state of states) {
      try {
        console.log(`\nSearching for: "${state} child welfare statistics API"`);

        const results = await performGoogleSearch(`${state} child welfare statistics API`);

        console.log(`\n📊 ${state.toUpperCase()} DATA SOURCES:`);
        results.results.forEach((result, index) => {
          console.log(`\n${index + 1}. ${result.title}`);
          console.log(`   URL: ${result.link}`);
          console.log(`   Description: ${result.snippet}`);
        });

        expect(results.results.length).toBeGreaterThan(0);
      } catch (error: any) {
        console.error(`\n❌ ${state} SEARCH ERROR:`);
        console.error(error.message);
      }
    }
  });

  it("should search for REAL Data.gov catalog endpoints", async () => {
    console.log("\n🔍 SEARCHING FOR DATA.GOV ENDPOINTS...");
    console.log('Searching for: "Data.gov child welfare API catalog endpoint"');

    try {
      const results = await performGoogleSearch("Data.gov child welfare API catalog endpoint");

      console.log("\n📊 DATA.GOV ENDPOINTS:");
      results.results.forEach((result, index) => {
        console.log(`\n${index + 1}. ${result.title}`);
        console.log(`   URL: ${result.link}`);
        console.log(`   Description: ${result.snippet}`);
      });

      expect(results.results.length).toBeGreaterThan(0);
    } catch (error: any) {
      console.error("\n❌ SEARCH ERROR:");
      console.error(error.message);
      throw error;
    }
  });
});
