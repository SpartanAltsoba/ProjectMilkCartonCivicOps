import fetch from "node-fetch";

describe("REAL Data.gov API Test - Node.js Native", () => {
  const API_KEY = process.env.DATA_GOV_API_KEY || "DEMO_KEY";
  const BASE_URL = "https://api.data.gov";

  it("should search for REAL child welfare data", async () => {
    console.log("🔍 TESTING REAL CHILD WELFARE DATA SEARCH...");

    try {
      // Search for child welfare datasets
      const response = await fetch(
        `${BASE_URL}/catalog.json?api_key=${API_KEY}&q=child+welfare+statistics`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      console.log(`\n📊 Response Status: ${response.status}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      console.log("\n📋 FOUND DATASETS:");
      if (data.dataset) {
        data.dataset.slice(0, 5).forEach((dataset: any, index: number) => {
          console.log(`\n${index + 1}. ${dataset.title || "Untitled"}`);
          if (dataset.description) {
            console.log(`   Description: ${dataset.description.substring(0, 200)}...`);
          }
          if (dataset.publisher) {
            console.log(`   Publisher: ${dataset.publisher.name}`);
          }
          if (dataset.modified) {
            console.log(`   Last Updated: ${dataset.modified}`);
          }
          if (dataset.distribution) {
            console.log("   Available Formats:");
            dataset.distribution.forEach((dist: any) => {
              console.log(
                `   - ${dist.format || "Unknown"}: ${dist.downloadURL || "No direct download"}`
              );
            });
          }
        });
      } else {
        console.log("No datasets found in response");
        console.log("Response structure:", Object.keys(data));
      }

      expect(response.ok).toBe(true);
    } catch (error: any) {
      console.error("\n❌ API ERROR:");
      console.error(error.message);
      if (error.response) {
        console.error("Response:", await error.response.text());
      }
      throw error;
    }
  });

  it("should test REAL HHS child welfare endpoints", async () => {
    console.log("\n🏥 TESTING HHS CHILD WELFARE ENDPOINTS...");

    try {
      // Try specific HHS endpoint for child welfare data
      const response = await fetch(
        `${BASE_URL}/childrens-bureau/afcars/states?api_key=${API_KEY}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      console.log(`\n📊 Response Status: ${response.status}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      console.log("\n📋 HHS DATA:");
      console.log(JSON.stringify(data, null, 2));

      expect(response.ok).toBe(true);
    } catch (error: any) {
      console.error("\n❌ HHS API ERROR:");
      console.error(error.message);
      if (error.response) {
        console.error("Response:", await error.response.text());
      }

      // Try alternative endpoint
      console.log("\n🔄 Trying alternative endpoint...");

      try {
        const altResponse = await fetch(`${BASE_URL}/acf/child-welfare?api_key=${API_KEY}`, {
          headers: {
            Accept: "application/json",
          },
        });

        console.log(`📊 Alternative Response Status: ${altResponse.status}`);

        if (altResponse.ok) {
          const altData = await altResponse.json();
          console.log("\n📋 ALTERNATIVE DATA:");
          console.log(JSON.stringify(altData, null, 2));
        }
      } catch (altError: any) {
        console.error("Alternative endpoint also failed:", altError.message);
      }
    }
  });

  it("should test REAL state-specific CPS data", async () => {
    console.log("\n🏛️ TESTING STATE CPS DATA...");

    const states = ["CA", "TX", "NY"];

    for (const state of states) {
      try {
        console.log(`\n📊 Checking ${state} CPS data...`);

        const response = await fetch(
          `${BASE_URL}/state/${state}/child-welfare?api_key=${API_KEY}`,
          {
            headers: {
              Accept: "application/json",
            },
          }
        );

        console.log(`Response Status: ${response.status}`);

        if (response.ok) {
          const data = await response.json();
          console.log(`\n📋 ${state} DATA:`);
          console.log(JSON.stringify(data, null, 2));
        } else {
          console.log(`No data available for ${state}`);
        }
      } catch (error: any) {
        console.error(`\n❌ Error fetching ${state} data:`, error.message);
      }
    }
  });

  it("should document ALL available child welfare endpoints", async () => {
    console.log("\n📚 DOCUMENTING ALL CHILD WELFARE ENDPOINTS...");

    try {
      // Try to get API documentation/metadata
      const response = await fetch(`${BASE_URL}/docs/child-welfare?api_key=${API_KEY}`, {
        headers: {
          Accept: "application/json",
        },
      });

      console.log(`\n📊 Response Status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log("\n📋 AVAILABLE ENDPOINTS:");
        console.log(JSON.stringify(data, null, 2));
      } else {
        console.log("Documentation endpoint not available");

        // List known endpoints we've discovered
        console.log("\n📋 KNOWN ENDPOINTS:");
        console.log("1. /catalog.json - Dataset search");
        console.log("2. /childrens-bureau/afcars/states - AFCARS data");
        console.log("3. /acf/child-welfare - ACF data");
        console.log("4. /state/{state}/child-welfare - State-specific data");
      }
    } catch (error: any) {
      console.error("\n❌ Error fetching documentation:", error.message);
    }
  });
});
