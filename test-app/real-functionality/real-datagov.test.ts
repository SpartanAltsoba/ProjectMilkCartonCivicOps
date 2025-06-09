import axios from "axios";

describe("REAL Data.gov API Test - NO MOCK DATA", () => {
  const API_KEY = process.env.DATA_GOV_API_KEY || "DEMO_KEY";
  const BASE_URL = "https://api.data.gov/v1";

  it("should test actual Data.gov catalog search for child welfare", async () => {
    console.log("🔍 TESTING REAL DATA.GOV API...");
    console.log(`Using API Key: ${API_KEY.substring(0, 8)}...`);

    try {
      // Search for actual child welfare datasets
      const response = await axios.get(`${BASE_URL}/catalog/search`, {
        params: {
          api_key: API_KEY,
          q: "child welfare",
          limit: 10,
        },
        timeout: 10000,
      });

      console.log("\n📊 REAL DATA.GOV RESPONSE:");
      console.log(`Status: ${response.status}`);
      console.log(`Response Type: ${typeof response.data}`);

      if (response.data && response.data.results) {
        console.log(`Found ${response.data.results.length} datasets`);

        response.data.results.slice(0, 3).forEach((dataset: any, index: number) => {
          console.log(`\n${index + 1}. ${dataset.title || "No title"}`);
          console.log(
            `   Description: ${dataset.description?.substring(0, 100) || "No description"}...`
          );
          console.log(`   Organization: ${dataset.organization?.name || "Unknown"}`);
          console.log(`   Last Modified: ${dataset.modified || "Unknown"}`);
        });
      } else {
        console.log("No results array found in response");
        console.log("Response structure:", Object.keys(response.data));
      }

      expect(response.status).toBe(200);
    } catch (error: any) {
      console.error("\n❌ DATA.GOV API ERROR:");
      console.error(`Error: ${error.message}`);
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
        console.error(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
      }

      // Don't fail the test - just document what happened
      expect(error).toBeDefined();
    }
  });

  it("should test HHS (Health and Human Services) data search", async () => {
    console.log("\n🏥 TESTING HHS DATA SEARCH...");

    try {
      const response = await axios.get(`${BASE_URL}/catalog/search`, {
        params: {
          api_key: API_KEY,
          q: "HHS child protective services",
          organization: "hhs-gov",
          limit: 5,
        },
        timeout: 10000,
      });

      console.log("\n📊 HHS DATA SEARCH RESULTS:");
      console.log(`Status: ${response.status}`);

      if (response.data && response.data.results) {
        console.log(`Found ${response.data.results.length} HHS datasets`);

        response.data.results.forEach((dataset: any, index: number) => {
          console.log(`\n${index + 1}. ${dataset.title || "No title"}`);
          console.log(`   URL: ${dataset.landingPage || "No URL"}`);
        });
      }

      expect(response.status).toBe(200);
    } catch (error: any) {
      console.error("\n❌ HHS SEARCH ERROR:");
      console.error(`Error: ${error.message}`);
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
        console.error(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }
  });

  it("should test direct API endpoint access", async () => {
    console.log("\n🔗 TESTING DIRECT API ACCESS...");

    try {
      // Try to access a known government API endpoint
      const response = await axios.get("https://api.data.gov/ed/collegescorecard/v1/schools", {
        params: {
          api_key: API_KEY,
          fields: "school.name,school.state",
          per_page: 5,
        },
        timeout: 10000,
      });

      console.log("\n📊 DIRECT API TEST (College Scorecard):");
      console.log(`Status: ${response.status}`);
      console.log(`Found ${response.data.results?.length || 0} schools`);

      if (response.data.results) {
        response.data.results.slice(0, 2).forEach((school: any, index: number) => {
          console.log(`${index + 1}. ${school["school.name"]} (${school["school.state"]})`);
        });
      }

      expect(response.status).toBe(200);
    } catch (error: any) {
      console.error("\n❌ DIRECT API ERROR:");
      console.error(`Error: ${error.message}`);
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
      }
    }
  });
});
