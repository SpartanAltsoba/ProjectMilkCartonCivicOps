export interface DecisionChainData {
  id: string;
  jurisdiction: string;
  scenario: string;
  findings?: string[];
  recommendations?: string[];
  stakeholders?: string[];
  timeline?: TimelineEvent[];
  riskFactors?: RiskFactor[];
  rawAnalysis?: string;
  metadata?: {
    generatedAt?: string;
    analysisType?: string;
    confidence?: number;
    aiModel?: string;
  };
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  event: string;
  actor: string;
  outcome?: string;
}

export interface RiskFactor {
  id: string;
  factor: string;
  severity: "low" | "medium" | "high";
  description: string;
}

export interface AnalysisRequest {
  jurisdiction: string;
  scenario: string;
  parameters?: Record<string, any>;
}

export interface AnalysisResponse {
  success: boolean;
  data?: DecisionChainData;
  error?: string;
}
