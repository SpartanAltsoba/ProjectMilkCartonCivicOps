import { prisma } from "../prisma";
import { logger } from "../logger";
import { sanitizeInput } from "../../utils/sanitizeInput";
import { AppError } from "../errors/AppError";

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

    // Note: Scoring engine functionality would be implemented here
    // For now, we'll just query existing scores

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

/**
 * Fetch states and counties data
 */
export async function fetchStatesAndCounties() {
  try {
    const regions = await prisma.region.findMany({
      select: {
        id: true,
        stateName: true,
        countyName: true,
      },
      orderBy: [{ stateName: "asc" }, { countyName: "asc" }],
    });

    // Group by state
    const statesMap = new Map<string, string[]>();

    regions.forEach(region => {
      if (!region.stateName) return;

      if (!statesMap.has(region.stateName)) {
        statesMap.set(region.stateName, []);
      }

      const counties = statesMap.get(region.stateName)!;

      if (region.countyName && !counties.includes(region.countyName)) {
        counties.push(region.countyName);
      }
    });

    const data = Array.from(statesMap.entries()).map(([stateName, counties]) => ({
      state: stateName,
      counties: counties.sort(),
    }));

    return { data };
  } catch (error) {
    logger.error("Error fetching states and counties:", error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Failed to fetch states and counties", 500);
  }
}

/**
 * Generate decision graph data
 */
export async function generateDecisionGraph(params: { state?: string; county?: string }) {
  try {
    // Validate and sanitize inputs
    if (params.state) {
      params.state = sanitizeInput(params.state);
    }
    if (params.county) {
      params.county = sanitizeInput(params.county);
    }

    // Query decision chain data
    const decisionChains = await prisma.decisionChain.findMany({
      where: {
        region: {
          ...(params.state && { stateName: params.state }),
          ...(params.county && { countyName: params.county }),
        },
      },
      include: {
        region: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50, // Limit results
    });

    // Format for decision graph visualization
    const nodes = decisionChains.map(chain => ({
      id: chain.id.toString(),
      title: chain.title,
      data: chain.data,
      region: {
        state: chain.region.stateName,
        county: chain.region.countyName,
      },
      createdAt: chain.createdAt,
    }));

    return {
      nodes,
      edges: [], // Would be populated based on relationships between decisions
      metadata: {
        totalNodes: nodes.length,
        state: params.state,
        county: params.county,
      },
    };
  } catch (error) {
    logger.error("Error generating decision graph:", error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Failed to generate decision graph", 500);
  }
}
