export interface ExportOption {
  id: string;
  name: string;
  format: string;
  description: string;
}

export async function fetchExportOptions(): Promise<ExportOption[]> {
  try {
    const options: ExportOption[] = [
      {
        id: "pdf",
        name: "PDF Document",
        format: "pdf",
        description: "Export as a PDF document",
      },
      {
        id: "csv",
        name: "CSV Spreadsheet",
        format: "csv",
        description: "Export as a CSV spreadsheet",
      },
      {
        id: "json",
        name: "JSON Data",
        format: "json",
        description: "Export as JSON data",
      },
    ];

    return options;
  } catch (error) {
    console.error("Error fetching export options:", error);
    throw new Error("Failed to fetch export options");
  }
}

// Re-export from riskAlerts
export { fetchRiskAlerts, type RiskAlert, type RiskAlertParams } from "./riskAlerts";

// Re-export from data
export {
  getRiskScores,
  getHighRiskAlerts,
  getRiskScoreStats,
  fetchStatesAndCounties,
} from "./data";
