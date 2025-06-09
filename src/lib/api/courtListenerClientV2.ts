import { OptimizedBaseApiClient, API_CONFIGS } from "./optimizedBaseApiClient";
import { logger } from "../logger";
import { sanitizeStateCode, sanitizeCountyName } from "../../utils/sanitizeInput";

interface CourtCase {
  id: string;
  title: string;
  court: string;
  date: string;
  summary: string;
  url: string;
  citations: string[];
}

interface SearchResult {
  cases: CourtCase[];
  totalResults: number;
  page: number;
  hasMore: boolean;
}

class CourtListenerClientV2 {
  private apiClient: OptimizedBaseApiClient;

  constructor() {
    this.apiClient = new OptimizedBaseApiClient({
      ...API_CONFIGS.GOVERNMENT,
      baseURL: "https://www.courtlistener.com/api/rest/v3",
      headers: {
        Authorization: `Token ${process.env.COURTLISTENER_TOKEN || ""}`,
        "Content-Type": "application/json",
      },
    });
  }

  async searchCases(
    state: string,
    county?: string,
    options: {
      limit?: number;
      page?: number;
      dateAfter?: string;
      dateBefore?: string;
    } = {}
  ): Promise<CourtCase[]> {
    try {
      const stateCode = sanitizeStateCode(state);
      const searchQuery = this.buildSearchQuery(stateCode, county);

      const params = {
        q: searchQuery,
        type: "o", // Opinions
        order_by: "-date_filed",
        ...options,
      };

      logger.info("Searching court cases", { state: stateCode, county, params });

      const response = await this.apiClient.get<{
        results: Array<{
          id: number;
          case_name: string;
          court: string;
          date_filed: string;
          snippet: string;
          absolute_url: string;
          citation: Array<{ cite: string }>;
        }>;
        count: number;
        next: string | null;
      }>("/search/", { params });

      const cases: CourtCase[] = response.results.map(result => ({
        id: result.id.toString(),
        title: result.case_name || "Unknown Case",
        court: result.court || "Unknown Court",
        date: result.date_filed || "",
        summary: result.snippet || "",
        url: result.absolute_url || "",
        citations: result.citation?.map(c => c.cite) || [],
      }));

      logger.info("Court cases search completed", {
        state: stateCode,
        county,
        resultsCount: cases.length,
        totalResults: response.count,
      });

      return cases;
    } catch (error) {
      logger.error("Failed to search court cases", error as Error, {
        state,
        county,
      });
      return [];
    }
  }

  private buildSearchQuery(state: string, county?: string): string {
    let query = `child welfare OR foster care OR CPS OR "child protective services"`;

    if (county) {
      const sanitizedCounty = sanitizeCountyName(county);
      query += ` AND "${sanitizedCounty}"`;
    }

    query += ` AND state:${state}`;

    return query;
  }

  async getCaseDetails(caseId: string): Promise<CourtCase | null> {
    try {
      const response = await this.apiClient.get<{
        id: number;
        case_name: string;
        court: string;
        date_filed: string;
        snippet: string;
        absolute_url: string;
        citation: Array<{ cite: string }>;
      }>(`/opinions/${caseId}/`);

      return {
        id: response.id.toString(),
        title: response.case_name || "Unknown Case",
        court: response.court || "Unknown Court",
        date: response.date_filed || "",
        summary: response.snippet || "",
        url: response.absolute_url || "",
        citations: response.citation?.map(c => c.cite) || [],
      };
    } catch (error) {
      logger.error("Failed to get case details", error as Error, { caseId });
      return null;
    }
  }
}

export const courtListenerClientV2 = new CourtListenerClientV2();
export type { CourtCase, SearchResult };
