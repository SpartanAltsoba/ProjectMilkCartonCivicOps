export interface RiskScore {
  category: string;
  value: number;
  description?: string;
  timestamp?: string;
  sources?: string[];
  metadata?: Record<string, any>;
}

export interface Alert {
  id?: string;
  title: string;
  message: string;
  severity: "low" | "medium" | "high";
  timestamp?: string;
  category?: string;
  source?: string;
  status?: "active" | "resolved" | "investigating";
  metadata?: Record<string, any>;
}

export interface StatesCounties {
  states: string[];
  counties: Record<string, string[]>;
}

export interface DashboardFilters {
  state?: string;
  county?: string;
  timeframe?: "day" | "week" | "month" | "year";
  categories?: string[];
  severity?: ("low" | "medium" | "high")[];
}

export interface DashboardMetrics {
  totalCases: number;
  averageRiskScore: number;
  highRiskCount: number;
  activeAlerts: number;
  lastUpdated: string;
}

export interface DashboardState {
  filters: DashboardFilters;
  metrics: DashboardMetrics;
  riskScores: RiskScore[];
  alerts: Alert[];
  loading: boolean;
  error: string | null;
}
