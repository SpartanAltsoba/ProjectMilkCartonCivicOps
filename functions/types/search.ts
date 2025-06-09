export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  source: string;
}

export interface SearchConfig {
  maxResults?: number;
  filterDomains?: string[];
  excludeDomains?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface SearchFilters {
  domains?: string[];
  excludedDomains?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  legalFilters?: {
    jurisdiction?: string;
    courtLevel?: "federal" | "state" | "local" | "all";
    documentTypes?: ("statute" | "case_law" | "regulation" | "policy")[];
  };
  policyFilters?: {
    policyType?: string;
    agency?: string;
    jurisdiction?: string;
  };
}

export interface SearchResponse {
  results: SearchResult[];
  metadata: {
    query: string;
    totalResults: number;
    searchTime: number;
    filters?: SearchFilters;
  };
}
