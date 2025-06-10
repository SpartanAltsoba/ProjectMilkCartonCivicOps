export interface IStakeholder {
  id: string;
  name: string;
  role: string;
  organization: string;
  level: "federal" | "state" | "local" | "private";
}

export interface IRelationship {
  id: string;
  from: string;
  to: string;
  type: "reports_to" | "collaborates_with" | "oversees" | "provides_data";
  description?: string;
}

export interface ILegacyRiskScore {
  id: string;
  score: number;
  stakeholderId: string;
  category: string;
  timestamp: Date;
}

export interface ILegacyAlert {
  id: string;
  type: "warning" | "critical" | "info";
  message: string;
  stakeholderId: string;
  timestamp: Date;
}

export interface ISearchResult {
  id: string;
  title: string;
  description: string;
  url: string;
  relevanceScore: number;
  source: string;
  timestamp: string;
}

export interface IFOIARequest {
  id: string;
  requestText: string;
  agency: string;
  state: string;
  county?: string;
  status: "draft" | "submitted" | "pending" | "fulfilled" | "denied";
  submittedDate?: string;
  responseDate?: string;
}

export interface IUser {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  createdAt: string;
}

export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface IStateCounty {
  state: string;
  counties: string[];
}

// Export CPS types
export type { CPSData, City } from "./cps";
