import Config from "../../src/lib/config";

describe("CourtListener Direct API Test", () => {
  jest.setTimeout(30000);

  it("should connect directly to CourtListener API", async () => {
    const token = Config.COURTLISTENER_TOKEN;
    console.log("Using token:", token ? "Token present" : "No token");

    if (!token) {
      throw new Error("COURTLISTENER_TOKEN not found in config");
    }

    const url = "https://www.courtlistener.com/api/rest/v3/search/";
    const params = new URLSearchParams({
      q: "child welfare",
      type: "o",
      order_by: "score desc",
      limit: "5",
    });

    try {
      const response = await fetch(`${url}?${params}`, {
        method: "GET",
        headers: {
          Authorization: `Token ${token}`,
          "User-Agent": "CivicTraceOps/1.0.0",
          Accept: "application/json",
        },
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.log("Error response:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("API Response:", JSON.stringify(data, null, 2));

      expect(data).toHaveProperty("results");
      expect(Array.isArray(data.results)).toBe(true);
    } catch (error) {
      console.error("Direct API test failed:", error);
      throw error;
    }
  });
});
