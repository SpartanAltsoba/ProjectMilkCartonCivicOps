export interface JurisdictionDetails {
  id: string;
  name: string;
  type: "federal" | "state" | "county" | "city";
  parentJurisdiction?: string;
  population?: number;
  area?: number;
  officials: Array<{
    name: string;
    title: string;
    contact?: string;
  }>;
  agencies: Array<{
    name: string;
    type: string;
    contact?: string;
  }>;
  riskFactors: Array<{
    factor: string;
    score: number;
    description: string;
  }>;
  lastUpdated: string;
}
