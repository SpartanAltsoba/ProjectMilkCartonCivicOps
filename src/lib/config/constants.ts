export const APP_DETAILS = {
  name: "CIVIC TRACE OPS",
  description:
    "A web application designed to empower users to investigate, map, and report on the elements and legal landscape in child welfare systems at the state and county level.",
} as const;

// Available routes in the application
export const ROUTES = {
  home: "/",
  decisionChain: "/decision-chain",
  foiaGenerator: "/foia-generator",
  search: "/search",
  dashboard: "/dashboard",
} as const;

// Component names to be reused across different parts of the application
export const COMPONENTS = {
  Navbar: "Navbar",
  Footer: "Footer",
  StateCountySelector: "StateCountySelector",
  RiskScoreDashboard: "RiskScoreDashboard",
  DecisionChainVisualization: "DecisionChainVisualization",
  FOIAForm: "FOIAForm",
  JurisdictionGuide: "JurisdictionGuide",
  SearchBar: "SearchBar",
  SearchResults: "SearchResults",
  RiskAlerts: "RiskAlerts",
  ExportOptions: "ExportOptions",
} as const;

// API URLs for backend interaction
export const API_ENDPOINTS = {
  auth: {
    login: "/api/auth/login",
    logout: "/api/auth/logout",
    register: "/api/auth/register",
  },
  data: {
    riskScores: "/api/data/risk-scores",
    search: "/api/data/search",
  },
  logging: {
    audit: "/api/logging/audit",
  },
} as const;

// Constants related to authentication and user management
export const AUTH_CONFIG = {
  sessionTimeout: 60 * 30, // 30 minutes
} as const;

// Default settings for the application
export const DEFAULT_SETTINGS = {
  theme: "light",
  alertThreshold: 0.7, // Threshold for risk alerts
} as const;

// Legal and data regulations notes
export const LEGAL_NOTES = {
  foia: "FOIA requests and regulations vary by jurisdiction. Please consult the JurisdictionGuide component to understand specific legal requirements.",
} as const;

// Function to safely get a constant value (useful for future dynamic alterations)
export function getConstant<T extends { [key: string]: any }>(
  constant: T,
  key: keyof T
): T[keyof T] | null {
  return constant[key] ?? null;
}

// Example usage:
// const loginUrl = getConstant(API_ENDPOINTS.auth, 'login');
