export interface BaseSearchResult {
  id: string;
  title: string;
  url: string;
  snippet: string;
  source: string;
  timestamp: string;
}

export interface LocalSearchResult extends BaseSearchResult {
  type: "local";
  relevanceScore: number;
  category: string;
  summary?: string;
  publishedAt?: string;
}

export interface GoogleSearchResult extends BaseSearchResult {
  type: "google";
  rank: number;
  pagemap?: {
    metatags?: Array<Record<string, string>>;
    [key: string]: any;
  };
}

export type SearchResult = LocalSearchResult | GoogleSearchResult;

export interface SearchFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  sources?: string[];
  categories?: string[];
  relevanceThreshold?: number;
}

export interface SearchOptions {
  filters?: SearchFilters;
  sortBy?: "relevance" | "date" | "source";
  limit?: number;
  offset?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  totalPages: number;
  filters: SearchFilters;
}
