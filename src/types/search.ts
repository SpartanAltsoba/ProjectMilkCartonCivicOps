export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  metadata?: {
    source?: string;
    type?: string;
    date?: string;
    relevance?: number;
    jurisdiction?: string;
    documentType?: string;
    agency?: string;
  };
}

export interface SearchResponse {
  results: SearchResult[];
  metadata: {
    query: string;
    totalResults?: number;
    searchTime?: number;
    filters?: {
      source?: string;
      location?: string;
      dateRange?: {
        start: string;
        end: string;
      };
      legalFilters?: {
        jurisdiction?: string;
        courtLevel?: string;
        documentTypes?: string[];
      };
      policyFilters?: {
        agency?: string;
        policyType?: string;
        status?: string;
      };
    };
  };
}

export interface SearchError {
  code: string;
  message: string;
  details?: any;
}

// Re-export legacy search result type for backward compatibility
export type { ISearchResult } from "./index";

// Export type guard for search results
export function isSearchResult(obj: any): obj is SearchResult {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.title === "string" &&
    typeof obj.link === "string" &&
    typeof obj.snippet === "string"
  );
}

// Export type guard for search response
export function isSearchResponse(obj: any): obj is SearchResponse {
  return (
    typeof obj === "object" &&
    obj !== null &&
    Array.isArray(obj.results) &&
    obj.results.every(isSearchResult) &&
    typeof obj.metadata === "object" &&
    typeof obj.metadata.query === "string"
  );
}
