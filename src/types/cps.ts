export type City = string;

export interface CPSData {
  id: string;
  city: City;
  state: string;
  county: string;
  caseCount: number;
  riskScore: number;
  agencies: Array<{
    name: string;
    type: string;
    jurisdiction: string;
  }>;
  lastUpdated: Date;
  // Additional fields that might come from Firebase
  [key: string]: any;
}
