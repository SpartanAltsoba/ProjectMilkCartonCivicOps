import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { withErrorHandler } from "../../../lib/middleware/errorMiddleware";
import { ValidationError } from "../../../lib/errors";
import { logger } from "../../../lib/logger";

interface RiskAlert {
  id: number;
  regionId: number;
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  score: number;
  createdAt: Date;
  region: {
    stateName: string;
    countyName?: string;
  };
}

interface RiskAlertParams {
  regionId?: number;
  riskLevel?: string;
  limit?: number;
  offset?: number;
}

async function fetchRiskAlertsHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }

  const { regionId, riskLevel, limit = 10, offset = 0 }: RiskAlertParams = req.query;

  // Validate parameters
  const limitNum = parseInt(String(limit));
  const offsetNum = parseInt(String(offset));

  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    throw new ValidationError("Limit must be between 1 and 100");
  }

  if (isNaN(offsetNum) || offsetNum < 0) {
    throw new ValidationError("Offset must be non-negative");
  }

  // Build where clause
  const whereClause: any = {};

  if (regionId) {
    const regionIdNum = parseInt(String(regionId));
    if (isNaN(regionIdNum)) {
      throw new ValidationError("Invalid region ID");
    }
    whereClause.regionId = regionIdNum;
  }

  // Get risk scores and convert to alerts
  const riskScores = await prisma.riskScore.findMany({
    where: whereClause,
    include: {
      region: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limitNum,
    skip: offsetNum,
  });

  // Convert risk scores to alerts format
  const alerts: RiskAlert[] = riskScores.map(score => {
    const scoreValue = parseFloat(score.score.toString());
    let riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

    if (scoreValue > 80) {
      riskLevel = "CRITICAL";
    } else if (scoreValue > 60) {
      riskLevel = "HIGH";
    } else if (scoreValue > 40) {
      riskLevel = "MEDIUM";
    } else {
      riskLevel = "LOW";
    }

    return {
      id: score.id,
      regionId: score.regionId,
      riskLevel,
      title: `Risk Alert for ${score.region.stateName}${score.region.countyName ? `, ${score.region.countyName}` : ""}`,
      description: `Risk score of ${scoreValue} detected. ${riskLevel === "CRITICAL" ? "Immediate attention required." : "Monitor situation closely."}`,
      score: scoreValue,
      createdAt: score.createdAt,
      region: {
        stateName: score.region.stateName,
        countyName: score.region.countyName || undefined,
      },
    };
  });

  // Filter by risk level if specified
  const filteredAlerts = riskLevel
    ? alerts.filter(alert => alert.riskLevel === riskLevel.toUpperCase())
    : alerts;

  // Log the request
  await logger.info("Risk alerts fetched", {
    regionId,
    riskLevel,
    count: filteredAlerts.length,
  });

  res.status(200).json({
    alerts: filteredAlerts,
    pagination: {
      limit: limitNum,
      offset: offsetNum,
      total: filteredAlerts.length,
    },
  });
}

export default withErrorHandler(fetchRiskAlertsHandler);
