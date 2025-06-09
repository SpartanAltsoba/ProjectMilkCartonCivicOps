import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import { sanitizeInput } from "../utils/sanitizeInput";
import { AppError } from "../errors/AppError";
import { scoringEngine } from "../lib/scoringEngine";

interface RiskScore {
  id: number;
  score: number;
  confidence?: number;
  dimension: string;
  createdAt: Date;
  region: {
    state: string | null;
    county: string | null;
  };
}

interface SearchParams {
  state?: string;
  county?: string;
  threshold?: number;
  startDate?: string;
  endDate?: string;
}

/**
 * Get risk scores based on search parameters
 */
export async function getRiskScores(params: SearchParams): Promise<RiskScore[]> {
  try {
    // Validate and sanitize inputs
    if (params.state) {
      params.state = sanitizeInput(params.state);
    }
    if (params.county) {
      params.county = sanitizeInput(params.county);
    }

    // Calculate new scores if needed
    if (params.state) {
      const scores = await scoringEngine.calculateRiskScores(params.state, params.county);
      await scoringEngine.saveScores(scores);
    }

    // Query existing scores
    const riskScores = await prisma.scoringSnapshot.findMany({
      where: {
        ...(params.state && {
          rawValue: {
            path: ["state"],
            equals: params.state,
          },
        }),
        ...(params.county && {
          rawValue: {
            path: ["county"],
            equals: params.county,
          },
        }),
        ...(params.threshold && {
          scoreValue: {
            gte: params.threshold,
          },
        }),
        ...(params.startDate && {
          scoreDate: {
            gte: new Date(params.startDate),
          },
        }),
        ...(params.endDate && {
          scoreDate: {
            lte: new Date(params.endDate),
          },
        }),
      },
      include: {
        dimension: true,
      },
      orderBy: {
        scoreDate: "desc",
      },
    });

    // Format response
    return riskScores.map(score => ({
      id: score.id,
      score: Number(score.scoreValue),
      confidence: score.confidenceScore ? Number(score.confidenceScore) : undefined,
      dimension: score.dimension.name,
      createdAt: score.scoreDate,
      region: {
        state:
          score.rawValue && typeof score.rawValue === "object" && "state" in score.rawValue
            ? String(score.rawValue.state)
            : null,
        county:
          score.rawValue && typeof score.rawValue === "object" && "county" in score.rawValue
            ? String(score.rawValue.county)
            : null,
      },
    }));
  } catch (error) {
    logger.error("Error fetching risk scores:", error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Failed to fetch risk scores", 500);
  }
}

/**
 * Get high risk alerts
 */
export async function getHighRiskAlerts() {
  try {
    const highRiskScores = await prisma.scoringSnapshot.findMany({
      where: {
        scoreValue: {
          gte: 80, // High risk threshold
        },
      },
      include: {
        dimension: true,
      },
      orderBy: {
        scoreDate: "desc",
      },
    });

    return highRiskScores.map(score => ({
      id: `risk-${score.id}`,
      type: "warning" as const,
      message: `High ${score.dimension.name} score (${score.scoreValue}) detected`,
      details: score.rawValue,
      timestamp: score.scoreDate,
    }));
  } catch (error) {
    logger.error("Error fetching high risk alerts:", error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Failed to fetch high risk alerts", 500);
  }
}

/**
 * Get risk score statistics
 */
export async function getRiskScoreStats() {
  try {
    const stats = await prisma.scoringSnapshot.aggregate({
      _avg: {
        scoreValue: true,
        confidenceScore: true,
      },
      _min: {
        scoreValue: true,
      },
      _max: {
        scoreValue: true,
      },
      _count: true,
    });

    return {
      totalScores: stats._count,
      averageScore: Number(stats._avg.scoreValue || 0),
      averageConfidence: Number(stats._avg.confidenceScore || 0),
      minScore: Number(stats._min.scoreValue || 0),
      maxScore: Number(stats._max.scoreValue || 0),
    };
  } catch (error) {
    logger.error("Error fetching risk score statistics:", error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Failed to fetch risk score statistics", 500);
  }
}
