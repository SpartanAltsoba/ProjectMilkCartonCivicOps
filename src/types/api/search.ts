// Define a base interface for all search results
export interface BaseSearchResult {
  title: string;
}

// Define specific interfaces for each type of search result, extending the base interface
export interface LocalSearchResult extends BaseSearchResult {
  id: number;
  summary: string | null;
  publishedAt: Date;
}

export interface GoogleSearchResult extends BaseSearchResult {
  snippet: string;
  url: string;
}

// Define interfaces for CPS data
export interface CpsData {
  laws: string[];
  fundingSources: string[];
}

export interface CpsAgencySearchResult extends BaseSearchResult {
  agencyData: CpsData;
  aiInsights: string;
}

export interface DecisionChainSearchResult extends BaseSearchResult {
  caseData: CpsData;
  narrative: string;
}

// Union type for all search results
export type SearchResult =
  | LocalSearchResult
  | GoogleSearchResult
  | CpsAgencySearchResult
  | DecisionChainSearchResult;

// Interface for search query
export interface SearchQuery {
  term: string;
  state?: string;
  county?: string;
  source?: "all" | "local" | "google" | "cpsAgency" | "decisionChain";
}

// Define interface for Firebase user
export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
  isAnonymous: boolean;
  tenantId: string | null;
  providerData: (FirebaseUser | null)[];
}

// Define interface for Firestore document
export interface FirestoreDocument {
  id: string;
  data: Record<string, unknown>;
}
