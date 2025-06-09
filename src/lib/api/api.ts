import { prisma } from "./prisma";
import type { ScoringSnapshot, ScoringDimension } from "@prisma/client";

// SWR fetcher function
export const fetcher = (url: string) => fetch(url).then(res => res.json());

interface ScoringSnapshotWithDimension extends ScoringSnapshot {
  dimension: ScoringDimension;
}

export async function fetchRiskScores(state?: string, county?: string) {
  try {
    // Use scoring snapshots as risk scores
    const scores = await prisma.scoringSnapshot.findMany({
      where: {
        entityType: "region",
        ...(state && {
          rawValue: {
            path: ["state"],
            equals: state,
          } as any,
        }),
        ...(county && {
          rawValue: {
            path: ["county"],
            equals: county,
          } as any,
        }),
      },
      include: {
        dimension: true,
      },
      orderBy: {
        scoreDate: "desc",
      },
      take: 100,
    });

    // Return array directly for dashboard compatibility
    return scores.map((score: ScoringSnapshotWithDimension) => ({
      id: String(score.id),
      name: score.dimension.name,
      source: "Scoring Engine",
      timestamp: score.scoreDate.toISOString(),
      confidence: score.confidenceScore ? Number(score.confidenceScore) : 0,
      value: Number(score.scoreValue),
    }));
  } catch (error) {
    console.error("Error fetching risk scores:", error);
    return []; // Return empty array on error
  }
}

export async function fetchStatesAndCounties() {
  try {
    // Get unique states and counties from scoring snapshots
    const snapshots = await prisma.scoringSnapshot.findMany({
      where: {
        entityType: "region",
        rawValue: {
          not: null as any,
        },
      },
      select: {
        rawValue: true,
      },
    });

    const states = new Set<string>();
    const counties = new Set<string>();

    snapshots.forEach(snapshot => {
      if (snapshot.rawValue && typeof snapshot.rawValue === "object") {
        const data = snapshot.rawValue as any;
        if (data.state) states.add(data.state);
        if (data.county) counties.add(data.county);
      }
    });

    return {
      data: {
        states: Array.from(states).sort(),
        counties: Array.from(counties).sort(),
      },
      status: 200,
    };
  } catch (error) {
    console.error("Error fetching states and counties:", error);
    throw error;
  }
}

export async function performSearch(term: string) {
  try {
    // Search through cached API data
    const results = await prisma.apiDataCache.findMany({
      where: {
        OR: [
          { dataKey: { contains: term, mode: "insensitive" } },
          {
            dataValue: {
              path: ["title"],
              string_contains: term,
            },
          },
          {
            dataValue: {
              path: ["description"],
              string_contains: term,
            },
          },
        ],
        status: "active",
      },
      orderBy: {
        fetchedAt: "desc",
      },
      take: 50,
    });

    return {
      data: {
        results: results.map(result => ({
          id: result.id,
          title: result.dataKey,
          summary:
            result.dataValue &&
            typeof result.dataValue === "object" &&
            "description" in result.dataValue
              ? result.dataValue.description
              : "No description available",
          source: result.apiName,
          entityType: result.entityType,
          fetchedAt: result.fetchedAt,
        })),
      },
      status: 200,
    };
  } catch (error) {
    console.error("Error performing search:", error);
    throw error;
  }
}

export async function fetchRiskAlerts() {
  try {
    // Fetch high-risk scores as alerts
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
      take: 10,
    });

    const alerts = highRiskScores.map(score => ({
      id: `risk-${score.id}`,
      message: `High ${score.dimension.name} score (${score.scoreValue}) detected`,
      timestamp: score.scoreDate.getTime(),
      severity: Number(score.scoreValue) >= 90 ? ("high" as const) : ("medium" as const),
    }));

    return alerts.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Error fetching risk alerts:", error);
    return [];
  }
}

export async function fetchExportOptions() {
  try {
    // Return available export formats and data types
    const exportTypes = [
      "PDF Report",
      "CSV Data",
      "JSON Export",
      "Excel Spreadsheet",
      "Risk Score Summary",
      "FOIA Request History",
      "Audit Log Export",
      "Decision Chain Data",
    ];

    return exportTypes;
  } catch (error) {
    console.error("Error fetching export options:", error);
    throw error;
  }
}

export async function getJurisdictionDetails() {
  try {
    // Get jurisdiction information from scoring snapshots
    const snapshots = await prisma.scoringSnapshot.findMany({
      where: {
        entityType: "region",
        rawValue: {
          not: null as any,
        },
      },
      select: {
        id: true,
        rawValue: true,
      },
      distinct: ["rawValue"],
    });

    const regions = snapshots.map(snapshot => {
      const data = snapshot.rawValue as any;
      return {
        id: snapshot.id,
        state: data?.state || "Unknown",
        county: data?.county || "Unknown",
      };
    });

    const jurisdictionDetails = {
      regions,
      foiaContacts: {
        federal: {
          name: "Department of Health and Human Services",
          email: "foia@hhs.gov",
          address: "200 Independence Avenue, S.W., Washington, D.C. 20201",
        },
        state: "Contact information varies by state",
        local: "Contact information varies by county",
      },
      processingTimes: {
        federal: "20 business days",
        state: "10-30 business days (varies by state)",
        local: "5-15 business days (varies by jurisdiction)",
      },
      fees: {
        search: "$25/hour after first 2 hours",
        duplication: "$0.10 per page",
        review: "$45/hour",
      },
    };

    return jurisdictionDetails;
  } catch (error) {
    console.error("Error fetching jurisdiction details:", error);
    throw error;
  }
}
