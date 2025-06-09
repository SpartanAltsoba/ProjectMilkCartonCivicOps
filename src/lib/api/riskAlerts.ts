import { PrismaClient, Prisma } from "@prisma/client";
import { createError } from "../../middleware/errorHandler";

const prisma = new PrismaClient();

export interface RiskAlertParams {
  regionId: number;
  startDate?: Date;
  endDate?: Date;
  threshold?: number;
}

export interface RiskAlert {
  id: number;
  score: number;
  details: Prisma.JsonValue;
  createdAt: Date;
  region: {
    id: number;
    stateName: string;
    stateCode: string;
    countyName?: string | null;
  };
}

export async function fetchRiskAlerts(params: RiskAlertParams): Promise<RiskAlert[]> {
  try {
    const region = await prisma.region.findUnique({
      where: {
        id: params.regionId,
      },
    });

    if (!region) {
      throw createError(404, "Region not found", "REGION_NOT_FOUND");
    }

    const riskScores = (await prisma.riskScore.findMany({
      where: {
        regionId: params.regionId,
        ...(params.startDate &&
          params.endDate && {
            createdAt: {
              gte: params.startDate,
              lte: params.endDate,
            },
          }),
        ...(params.threshold && {
          score: {
            gte: params.threshold,
          },
        }),
      },
      include: {
        region: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })) as Prisma.RiskScoreGetPayload<{ include: { region: true } }>[];

    return riskScores.map(score => ({
      id: score.id,
      score: score.score.toNumber(),
      details: score.details,
      createdAt: score.createdAt,
      region: {
        id: score.region.id,
        stateName: score.region.stateName,
        stateCode: score.region.stateCode,
        countyName: score.region.countyName,
      },
    }));
  } catch (error) {
    if (error instanceof Error) {
      throw createError(500, `Failed to fetch risk alerts: ${error.message}`);
    }
    throw error;
  }
}

export type ExportOptionsType = "CSV" | "PDF" | "JSON";

export async function fetchExportOptions(_type: ExportOptionsType) {
  try {
    const regions = await prisma.region.findMany({
      orderBy: [
        {
          stateCode: "asc",
        },
        {
          countyName: "asc",
        },
      ],
    });

    const dateRange = await prisma.riskScore.aggregate({
      _min: {
        createdAt: true,
      },
      _max: {
        createdAt: true,
      },
    });

    return {
      regions,
      dateRange: {
        start: dateRange._min?.createdAt || null,
        end: dateRange._max?.createdAt || null,
      },
      formats: [
        { id: "CSV", label: "CSV File (.csv)", mimeType: "text/csv" },
        { id: "PDF", label: "PDF Report (.pdf)", mimeType: "application/pdf" },
        { id: "JSON", label: "JSON Data (.json)", mimeType: "application/json" },
      ],
      fields: [
        { id: "region", label: "Region", required: true },
        { id: "score", label: "Risk Score", required: true },
        { id: "details", label: "Details", required: false },
        { id: "createdAt", label: "Date", required: true },
      ],
    };
  } catch (error) {
    if (error instanceof Error) {
      throw createError(500, `Failed to fetch export options: ${error.message}`);
    }
    throw error;
  }
}

export async function getJurisdictionDetails(regionId: number) {
  try {
    const region = await prisma.region.findUnique({
      where: {
        id: regionId,
      },
      include: {
        riskScores: {
          take: 1,
          orderBy: {
            createdAt: "desc",
          },
        },
        foiaRequests: {
          where: {
            status: "completed",
          },
        },
      },
    });

    if (!region) {
      throw createError(404, "Jurisdiction not found", "JURISDICTION_NOT_FOUND");
    }

    const recentDecisions = await prisma.decisionChain.findMany({
      where: {
        regionId,
      },
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      ...region,
      currentRiskScore: region.riskScores[0]?.score || null,
      foiaRequestCount: region.foiaRequests.length || 0,
      recentDecisions,
      lastUpdated: region.riskScores[0]?.createdAt || null,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw createError(500, `Failed to fetch jurisdiction details: ${error.message}`);
    }
    throw error;
  }
}
