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

const performGoogleSearch = async (query: string): Promise<SearchResponse> => {
  if (!query || typeof query !== "string") {
    legalLogger.error("Invalid search query", { query });
    throw new Error("Query is required");
  }

  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_CSE_ID;

  if (!apiKey || !searchEngineId) {
    legalLogger.error("Missing Google Search API configuration");
    throw new Error("Google Search API key or CSE ID not configured");
  }

  try {
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
      legalLogger.error("Google Search API error", {
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

    const results: LegalSearchResult[] = data.items.map((item: any) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      source: "google" as const,
    }));

    legalLogger.info("Google search completed", {
      query,
      resultCount: results.length,
    });

    return {
      results,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    legalLogger.error("Google search error", { error: errorMessage });
    throw new Error(errorMessage);
  }
};

describe("LEGAL CSE Test - Government & Law Sites Only", () => {
  it("should find parental rights statutes in state law", async () => {
    console.log("🏛️ SEARCHING STATE LAWS FOR PARENTAL RIGHTS...");
    console.log('Query: "parental rights termination statute"');

    try {
      const results = await performGoogleSearch("parental rights termination statute");

      console.log("\n📊 STATE PARENTAL RIGHTS LAWS:");
      results.results.forEach((result, index) => {
        console.log(`\n${index + 1}. ${result.title}`);
        console.log(`   URL: ${result.link}`);
        console.log(`   Snippet: ${result.snippet}`);

        // Check if it's from a state legislature site
        const isStateLaw =
          result.link.includes("leg") ||
          result.link.includes("legislature") ||
          result.link.includes("assembly") ||
          result.link.includes("senate");
        if (isStateLaw) {
          console.log(`   ✅ STATE LAW SOURCE`);
        }
      });

      expect(results.results.length).toBeGreaterThan(0);
    } catch (error: any) {
      console.error("\n❌ SEARCH ERROR:", error.message);
      throw error;
    }
  }, 15000);

  it("should find child welfare laws and regulations", async () => {
    console.log("\n🏛️ SEARCHING FOR CHILD WELFARE LAWS...");
    console.log('Query: "child welfare code removal procedures"');

    try {
      const results = await performGoogleSearch("child welfare code removal procedures");

      console.log("\n📊 CHILD WELFARE LAWS:");
      results.results.forEach((result, index) => {
        console.log(`\n${index + 1}. ${result.title}`);
        console.log(`   URL: ${result.link}`);
        console.log(`   Snippet: ${result.snippet}`);

        // Check source type
        if (result.link.includes("childwelfare.gov")) {
          console.log(`   ✅ FEDERAL CHILD WELFARE SOURCE`);
        } else if (result.link.includes("justice.gov")) {
          console.log(`   ✅ DOJ SOURCE`);
        } else if (result.link.includes("law.cornell.edu")) {
          console.log(`   ✅ CORNELL LAW SOURCE`);
        }
      });

      expect(results.results.length).toBeGreaterThan(0);
    } catch (error: any) {
      console.error("\n❌ SEARCH ERROR:", error.message);
      throw error;
    }
  }, 15000);

  it("should find FOIA and records access laws", async () => {
    console.log("\n🏛️ SEARCHING FOR FOIA LAWS...");
    console.log('Query: "freedom of information act child welfare records"');

    try {
      const results = await performGoogleSearch("freedom of information act child welfare records");

      console.log("\n📊 FOIA LAWS:");
      results.results.forEach((result, index) => {
        console.log(`\n${index + 1}. ${result.title}`);
        console.log(`   URL: ${result.link}`);
        console.log(`   Snippet: ${result.snippet}`);
      });

      expect(results.results.length).toBeGreaterThan(0);
    } catch (error: any) {
      console.error("\n❌ SEARCH ERROR:", error.message);
      throw error;
    }
  }, 15000);

  it("should find due process requirements in CPS cases", async () => {
    console.log("\n🏛️ SEARCHING FOR DUE PROCESS LAWS...");
    console.log('Query: "due process requirements CPS child removal"');

    try {
      const results = await performGoogleSearch("due process requirements CPS child removal");

      console.log("\n📊 DUE PROCESS LAWS:");
      results.results.forEach((result, index) => {
        console.log(`\n${index + 1}. ${result.title}`);
        console.log(`   URL: ${result.link}`);
        console.log(`   Snippet: ${result.snippet}`);

        // Check for court/legal sources
        if (result.link.includes("pacer.uscourts.gov")) {
          console.log(`   ✅ FEDERAL COURT SOURCE`);
        } else if (result.link.includes("justia.com")) {
          console.log(`   ✅ LEGAL DATABASE SOURCE`);
        }
      });

      expect(results.results.length).toBeGreaterThan(0);
    } catch (error: any) {
      console.error("\n❌ SEARCH ERROR:", error.message);
      throw error;
    }
  }, 15000);
});
