import type { NextApiRequest, NextApiResponse } from "next";
import { logger } from "../../../../lib/logger";

interface CpsAgencyQuery {
  agencyId?: string;
  state?: string;
  county?: string;
}

interface CpsAgencyData {
  id: string;
  name: string;
  state: string;
  county: string;
  contactInfo: {
    phone?: string;
    email?: string;
    address?: string;
  };
  services: string[];
  lastUpdated: string;
}

interface ApiResponse {
  success: boolean;
  data?: CpsAgencyData | CpsAgencyData[];
  message?: string;
  error?: string;
}

// Mock data for demonstration
const mockAgencies: CpsAgencyData[] = [
  {
    id: "wa-king-001",
    name: "King County Department of Children, Youth, and Families",
    state: "WA",
    county: "King",
    contactInfo: {
      phone: "(206) 263-9100",
      email: "dcyf.info@dcyf.wa.gov",
      address: "1115 Union St, Seattle, WA 98101",
    },
    services: ["Child Protection", "Foster Care", "Adoption Services", "Family Support"],
    lastUpdated: new Date().toISOString(),
  },
];

function validateQuery(query: CpsAgencyQuery): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!query.agencyId && !query.state) {
    errors.push("Either agencyId or state parameter is required");
  }

  if (query.state && typeof query.state !== "string") {
    errors.push("State must be a string");
  }

  if (query.county && typeof query.county !== "string") {
    errors.push("County must be a string");
  }

  if (query.agencyId && typeof query.agencyId !== "string") {
    errors.push("Agency ID must be a string");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function findAgencies(query: CpsAgencyQuery): CpsAgencyData[] {
  return mockAgencies.filter(agency => {
    if (query.agencyId) {
      return agency.id === query.agencyId;
    }

    let matches = true;

    if (query.state) {
      matches = matches && agency.state.toLowerCase() === query.state.toLowerCase();
    }

    if (query.county) {
      matches = matches && agency.county.toLowerCase() === query.county.toLowerCase();
    }

    return matches;
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res.status(405).json({
        success: false,
        error: "Method not allowed",
        message: "Only GET requests are allowed",
      });
    }

    const query: CpsAgencyQuery = {
      agencyId: req.query.agencyId as string,
      state: req.query.state as string,
      county: req.query.county as string,
    };

    const validation = validateQuery(query);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: "Invalid query parameters",
        message: validation.errors.join(", "),
      });
    }

    const agencies = findAgencies(query);

    if (agencies.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No agencies found",
        message: "No CPS agencies found matching the specified criteria",
      });
    }

    logger.info("CPS Agency search completed", {
      query,
      resultCount: agencies.length,
      timestamp: new Date().toISOString(),
    });

    const responseData = query.agencyId ? agencies[0] : agencies;

    return res.status(200).json({
      success: true,
      data: responseData,
      message: `Found ${agencies.length} CPS ${agencies.length === 1 ? "agency" : "agencies"}`,
    });
  } catch (error) {
    logger.error("CPS Agency API error:", error as Error);

    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "An unexpected error occurred while processing your request",
    });
  }
}
