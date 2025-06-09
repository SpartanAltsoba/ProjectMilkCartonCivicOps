// Mock logger for testing
const logger = {
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data || ""),
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data || ""),
  warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`, data || ""),
  debug: (message: string, data?: any) => console.debug(`[DEBUG] ${message}`, data || ""),
};

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  source: "google";
}

interface SearchResponse {
  results: SearchResult[];
}

/**
 * Perform a Google search using the Custom Search API
 */
const performGoogleSearch = async (query: string): Promise<SearchResponse> => {
  if (!query || typeof query !== "string") {
    logger.error("Invalid search query", { query });
    throw new Error("Query is required");
  }

  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_CSE_ID;

  if (!apiKey || !searchEngineId) {
    logger.error("Missing Google Search API configuration");
    throw new Error("Google Search API key or CSE ID not configured");
  }

  try {
    // Add a small random delay to avoid rate limiting
    const delayTime = Math.floor(Math.random() * 1000) + 500;
    await new Promise(resolve => setTimeout(resolve, delayTime));

    const url = new URL("https://www.googleapis.com/customsearch/v1");
    url.searchParams.append("key", apiKey);
    url.searchParams.append("cx", searchEngineId);
    url.searchParams.append("q", query);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const errorMessage = data.error?.message || "Failed to perform Google search";
      logger.error("Google Search API error", {
        status: response.status,
        statusText: response.statusText,
        errorMessage,
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (!data.items) {
      return {
        results: [],
      };
    }

    const results: SearchResult[] = data.items.map((item: any) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      source: "google" as const,
    }));

    logger.info("Google search completed", {
      query,
      resultCount: results.length,
    });

    return {
      results,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    logger.error("Google search error", { error: errorMessage });
    throw new Error(errorMessage);
  }
};

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
