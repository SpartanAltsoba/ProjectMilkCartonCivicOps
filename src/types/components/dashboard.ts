export interface Alert {
  id: string;
  message: string;
  timestamp: number;
  severity: "low" | "medium" | "high";
}

export interface RiskScore {
  id: string;
  name: string;
  source: string;
  timestamp: string;
  confidence: number;
  value: number;
}

export interface DashboardProps {
  initialAlerts: Alert[];
  initialRiskScores: RiskScore[];
  exportTypes: string[];
}
