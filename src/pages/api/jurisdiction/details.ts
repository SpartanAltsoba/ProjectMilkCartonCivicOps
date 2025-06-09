import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { withErrorHandler } from "../../../lib/middleware/errorMiddleware";
import { ValidationError } from "../../../lib/errors";
import { logger } from "../../../lib/logger";

interface JurisdictionDetails {
  id: number;
  stateName: string;
  stateCode: string;
  countyName?: string;
  riskScore?: {
    current: number;
    trend: "increasing" | "decreasing" | "stable";
    lastUpdated: Date;
  };
  statistics: {
    totalCases: number;
    activeCases: number;
    resolvedCases: number;
    averageResolutionTime: number; // in days
  };
  foiaRequests: {
    total: number;
    pending: number;
    completed: number;
  };
  decisionChains: {
    total: number;
    averageLength: number;
  };
}

async function getJurisdictionDetailsHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }

  const { id, state, county } = req.query;

  let region;

  if (id) {
    // Get by ID
    const regionId = parseInt(String(id));
    if (isNaN(regionId)) {
      throw new ValidationError("Invalid region ID");
    }

    region = await prisma.region.findUnique({
      where: { id: regionId },
      include: {
        riskScores: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        foiaRequests: true,
        decisionChains: true,
      },
    });
  } else if (state) {
    // Get by state and optional county
    const whereClause: any = {
      stateCode: String(state).toUpperCase(),
    };

    if (county) {
      whereClause.countyName = String(county);
    }

    region = await prisma.region.findFirst({
      where: whereClause,
      include: {
        riskScores: {
          orderBy: { createdAt: "desc" },
          take: 2, // Get last 2 to calculate trend
        },
        foiaRequests: true,
        decisionChains: true,
      },
    });
  } else {
    throw new ValidationError("Either region ID or state must be provided");
  }

  if (!region) {
    throw new ValidationError("Jurisdiction not found");
  }

  // Calculate risk score trend
  let riskTrend: "increasing" | "decreasing" | "stable" = "stable";
  if (region.riskScores.length >= 2) {
    const current = parseFloat(region.riskScores[0].score.toString());
    const previous = parseFloat(region.riskScores[1].score.toString());
    const difference = current - previous;

    if (difference > 5) {
      riskTrend = "increasing";
    } else if (difference < -5) {
      riskTrend = "decreasing";
    }
  }

  // Calculate FOIA request statistics
  const foiaStats = {
    total: region.foiaRequests.length,
    pending: region.foiaRequests.filter(req => req.status === "pending").length,
    completed: region.foiaRequests.filter(req => req.status === "completed").length,
  };

  // Calculate decision chain statistics
  const decisionChainStats = {
    total: region.decisionChains.length,
    averageLength:
      region.decisionChains.length > 0
        ? region.decisionChains.reduce((sum, chain) => {
            const data = chain.data as any;
            return sum + (data.steps?.length || 0);
          }, 0) / region.decisionChains.length
        : 0,
  };

  // Mock statistics for now (would come from actual case data)
  const mockStatistics = {
    totalCases: Math.floor(Math.random() * 1000) + 100,
    activeCases: Math.floor(Math.random() * 50) + 10,
    resolvedCases: Math.floor(Math.random() * 900) + 50,
    averageResolutionTime: Math.floor(Math.random() * 90) + 30,
  };

  const jurisdictionDetails: JurisdictionDetails = {
    id: region.id,
    stateName: region.stateName,
    stateCode: region.stateCode,
    countyName: region.countyName || undefined,
    riskScore:
      region.riskScores.length > 0
        ? {
            current: parseFloat(region.riskScores[0].score.toString()),
            trend: riskTrend,
            lastUpdated: region.riskScores[0].createdAt,
          }
        : undefined,
    statistics: mockStatistics,
    foiaRequests: foiaStats,
    decisionChains: decisionChainStats,
  };

  // Log the request
  await logger.info("Jurisdiction details fetched", {
    regionId: region.id,
    state: region.stateCode,
    county: region.countyName,
  });

  res.status(200).json(jurisdictionDetails);
}

export default withErrorHandler(getJurisdictionDetailsHandler);
