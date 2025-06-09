import { NextApiRequest, NextApiResponse } from "next";
import { withErrorHandler } from "../../../lib/middleware/errorMiddleware";
import { ValidationError } from "../../../lib/errors";
import { logger } from "../../../lib/logger";

interface ExportOption {
  id: string;
  name: string;
  description: string;
  format: "CSV" | "JSON" | "PDF" | "XLSX";
  endpoint: string;
  requiresAuth: boolean;
  maxRecords?: number;
  supportedFilters: string[];
}

const EXPORT_OPTIONS: ExportOption[] = [
  {
    id: "risk-scores",
    name: "Risk Scores Export",
    description: "Export risk scores and analysis for selected jurisdictions",
    format: "CSV",
    endpoint: "/api/data/export/risk-scores",
    requiresAuth: true,
    maxRecords: 10000,
    supportedFilters: ["region", "dateRange", "riskLevel"],
  },
  {
    id: "jurisdiction-details",
    name: "Jurisdiction Details",
    description: "Export detailed information about selected jurisdictions",
    format: "JSON",
    endpoint: "/api/data/export/jurisdiction-details",
    requiresAuth: true,
    supportedFilters: ["state", "county", "dataType"],
  },
  {
    id: "foia-requests",
    name: "FOIA Requests Report",
    description: "Export FOIA requests and their statuses",
    format: "PDF",
    endpoint: "/api/data/export/foia-requests",
    requiresAuth: true,
    supportedFilters: ["status", "dateRange", "requestType"],
  },
  {
    id: "decision-chains",
    name: "Decision Chain Analysis",
    description: "Export decision chain analysis and outcomes",
    format: "XLSX",
    endpoint: "/api/data/export/decision-chains",
    requiresAuth: true,
    maxRecords: 5000,
    supportedFilters: ["region", "outcomeType", "dateRange"],
  },
];

async function getExportOptionsHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }

  const { format, requiresAuth } = req.query;

  let filteredOptions = [...EXPORT_OPTIONS];

  // Filter by format if specified
  if (format) {
    const requestedFormat = String(format).toUpperCase();
    if (!["CSV", "JSON", "PDF", "XLSX"].includes(requestedFormat)) {
      throw new ValidationError("Invalid format specified");
    }
    filteredOptions = filteredOptions.filter(option => option.format === requestedFormat);
  }

  // Filter by authentication requirement if specified
  if (requiresAuth !== undefined) {
    const authRequired = requiresAuth === "true";
    filteredOptions = filteredOptions.filter(option => option.requiresAuth === authRequired);
  }

  // Log the request
  await logger.info("Export options fetched", {
    format,
    requiresAuth,
    optionsCount: filteredOptions.length,
  });

  res.status(200).json({
    options: filteredOptions,
    formats: ["CSV", "JSON", "PDF", "XLSX"],
    maxRecordsDefault: 10000,
  });
}

export default withErrorHandler(getExportOptionsHandler);
