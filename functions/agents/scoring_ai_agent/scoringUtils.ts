import { Prisma } from "@prisma/client";
import { logger } from "../../../src/lib/logger";
import { cacheManager } from "../../../src/lib/api/cache";
import { performGoogleSearch } from "../../../src/lib/api/googleSearch";
import { prisma } from "../../../src/lib/database/prisma";

interface ScoringCriteria {
  id: number;
  dimensionId: number;
  name: string;
  description: string | null;
  dataSource: string;
  weight: Prisma.Decimal | number;
  thresholdType: string;
  thresholdValue: Prisma.JsonValue;
  enabled: boolean;
}

interface RiskIndicator {
  keyword: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  source: string;
  context: string;
}

interface KeyFinding {
  title: string;
  snippet: string;
  url: string;
  domain: string;
}

interface SearchAnalysis {
  state: string;
  county?: string;
  criteriaName: string;
  totalResults: number;
  riskIndicators: RiskIndicator[];
  keyFindings: KeyFinding[];
  sourceBreakdown: Record<string, number>;
  riskScore: number;
  summary?: {
    totalRiskIndicators: number;
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
    mostCommonSources: Array<{ domain: string; count: number }>;
    riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    recommendations: string[];
  };
}

interface ScoreResult {
  dimensionId: number;
  criteriaId: number;
  scoreValue: number;
  confidenceScore: number;
  rawValue: unknown;
  dataSources: string[];
}

class ScoringEngine {
  constructor() {}

  private async getCachedData(key: string): Promise<unknown> {
    return cacheManager.get({
      apiName: "ScoringEngine",
      entityType: "score",
      entityId: 0,
      dataKey: key,
    });
  }

  private async cacheData(key: string, data: unknown, ttlHours = 24): Promise<void> {
    await cacheManager.set(
      {
        apiName: "ScoringEngine",
        entityType: "score",
        entityId: 0,
        dataKey: key,
      },
      data,
      ttlHours
    );
  }

  private async fetchApiData(
    criteria: ScoringCriteria,
    state: string,
    county?: string
  ): Promise<unknown> {
    const cacheKey = `${criteria.dataSource}:${state}${county ? "_" + county : ""}:${criteria.id}`;

    // Check cache first
    const cachedData = await this.getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Only implement Google search for now
    if (criteria.dataSource === "google_search") {
      return this.fetchGoogleSearchData(state, county, cacheKey, criteria.name);
    }

    // Return default data for other sources
    return {
      state,
      county,
      error: `Data source ${criteria.dataSource} not implemented`,
    };
  }

  private async fetchGoogleSearchData(
    state: string,
    county: string | undefined,
    cacheKey: string,
    criteriaName: string
  ): Promise<SearchAnalysis> {
    const searchCacheKey = `${cacheKey}_${criteriaName.replace(/\s+/g, "_")}`;
    const cachedData = await this.getCachedData(`google_search:${searchCacheKey}`);
    if (cachedData) return cachedData as SearchAnalysis;

    try {
      const searchQueries = this.buildSearchQueries(state, county, criteriaName);
      const allResults: unknown[] = [];

      for (const query of searchQueries) {
        try {
          logger.info(`Searching: ${query}`);
          const results = await performGoogleSearch(query);
          if (results && typeof results === "object" && "results" in results) {
            allResults.push(...(results.results as unknown[]));
          }

          // Respect rate limits
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          logger.error(`Search failed for query: ${query}`, error as Error);
        }
      }

      const analyzedData = this.analyzeSearchResults(allResults, state, county, criteriaName);
      await this.cacheData(`google_search:${searchCacheKey}`, analyzedData, 24);
      return analyzedData;
    } catch (error) {
      logger.error("Error fetching Google search data:", error as Error);
      const fallbackData: SearchAnalysis = {
        state,
        county,
        criteriaName,
        totalResults: 0,
        riskIndicators: [],
        keyFindings: [],
        sourceBreakdown: {},
        riskScore: 0,
        summary: {
          totalRiskIndicators: 0,
          highRiskCount: 0,
          mediumRiskCount: 0,
          lowRiskCount: 0,
          mostCommonSources: [],
          riskLevel: "LOW",
          recommendations: [],
        },
      };
      await this.cacheData(`google_search:${searchCacheKey}`, fallbackData, 1);
      return fallbackData;
    }
  }

  private buildSearchQueries(
    state: string,
    county: string | undefined,
    criteriaName: string
  ): string[] {
    const location = county ? `${county} county ${state}` : state;
    const queries: string[] = [];

    // Default searches
    queries.push(`"${criteriaName}" "${location}" problems issues`);
    queries.push(`"child welfare" "${location}" "${criteriaName}" investigation`);

    return queries;
  }

  private analyzeSearchResults(
    results: unknown[],
    state: string,
    county: string | undefined,
    criteriaName: string
  ): SearchAnalysis {
    const analysis: SearchAnalysis = {
      state,
      county,
      criteriaName,
      totalResults: results.length,
      riskIndicators: [],
      keyFindings: [],
      sourceBreakdown: {},
      riskScore: 0,
    };

    // Risk keywords
    const highRiskKeywords = [
      "criminal",
      "death",
      "fatality",
      "federal investigation",
      "criminal charges",
      "federal charges",
      "child death",
      "systemic failure",
    ];
    const mediumRiskKeywords = [
      "investigation",
      "abuse",
      "neglect",
      "lawsuit",
      "violation",
      "misconduct",
      "oversight",
      "reform required",
    ];
    const lowRiskKeywords = [
      "complaint",
      "review",
      "concern",
      "improvement needed",
      "policy change",
      "under review",
    ];

    let riskScore = 0;

    results.forEach(result => {
      if (!result || typeof result !== "object") return;

      const resultObj = result as Record<string, unknown>;
      const title = String(resultObj.title || "");
      const snippet = String(resultObj.snippet || "");
      const link = String(resultObj.link || "");

      const text = `${title} ${snippet}`.toLowerCase();

      // Process risk indicators
      highRiskKeywords.forEach(keyword => {
        if (text.includes(keyword)) {
          riskScore += 25;
          analysis.riskIndicators.push({
            keyword,
            severity: "HIGH",
            source: link,
            context: snippet,
          });
        }
      });

      mediumRiskKeywords.forEach(keyword => {
        if (text.includes(keyword)) {
          riskScore += 15;
          analysis.riskIndicators.push({
            keyword,
            severity: "MEDIUM",
            source: link,
            context: snippet,
          });
        }
      });

      lowRiskKeywords.forEach(keyword => {
        if (text.includes(keyword)) {
          riskScore += 8;
          analysis.riskIndicators.push({
            keyword,
            severity: "LOW",
            source: link,
            context: snippet,
          });
        }
      });

      // Track sources
      if (link) {
        try {
          const domain = new URL(link).hostname;
          analysis.sourceBreakdown[domain] = (analysis.sourceBreakdown[domain] || 0) + 1;
        } catch {
          // Invalid URL, skip
        }
      }

      // Extract key findings
      if (snippet) {
        const domain = link ? new URL(link).hostname : "unknown";
        analysis.keyFindings.push({
          title,
          snippet,
          url: link,
          domain,
        });
      }
    });

    analysis.riskScore = Math.min(100, riskScore);

    // Generate summary
    analysis.summary = {
      totalRiskIndicators: analysis.riskIndicators.length,
      highRiskCount: analysis.riskIndicators.filter(r => r.severity === "HIGH").length,
      mediumRiskCount: analysis.riskIndicators.filter(r => r.severity === "MEDIUM").length,
      lowRiskCount: analysis.riskIndicators.filter(r => r.severity === "LOW").length,
      mostCommonSources: Object.entries(analysis.sourceBreakdown)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([domain, count]) => ({ domain, count })),
      riskLevel:
        analysis.riskScore > 70
          ? "CRITICAL"
          : analysis.riskScore > 50
            ? "HIGH"
            : analysis.riskScore > 25
              ? "MEDIUM"
              : "LOW",
      recommendations: this.generateRecommendations(analysis.riskIndicators, analysis.riskScore),
    };

    return analysis;
  }

  private generateRecommendations(riskIndicators: RiskIndicator[], riskScore: number): string[] {
    const recommendations: string[] = [];

    const highRiskCount = riskIndicators.filter(r => r.severity === "HIGH").length;
    const mediumRiskCount = riskIndicators.filter(r => r.severity === "MEDIUM").length;

    if (highRiskCount > 0) {
      recommendations.push("🚨 High-risk indicators found requiring investigation");
      recommendations.push("📋 Consider filing FOIA requests");
    }

    if (mediumRiskCount > 3) {
      recommendations.push("🔍 Further investigation recommended");
      recommendations.push("📊 Request detailed statistics");
    }

    if (riskScore > 50) {
      recommendations.push("📧 Contact relevant oversight committees");
    }

    return recommendations;
  }

  public async calculateRiskScores(state: string, county?: string): Promise<ScoreResult[]> {
    try {
      const dimensions = await prisma.scoringDimension.findMany({
        where: { enabled: true },
      });

      const results: ScoreResult[] = [];

      for (const dimension of dimensions) {
        const criteria = await prisma.scoringCriteria.findMany({
          where: {
            dimensionId: dimension.id,
            enabled: true,
          },
        });

        for (const criterion of criteria) {
          try {
            const apiData = await this.fetchApiData(criterion, state, county);
            const typedData = apiData as { riskScore?: number; error?: string };

            results.push({
              dimensionId: dimension.id,
              criteriaId: criterion.id,
              scoreValue: typedData.riskScore || 50,
              confidenceScore: typedData.error ? 25 : 75,
              rawValue: apiData,
              dataSources: [criterion.dataSource],
            });
          } catch (error) {
            logger.error(`Error calculating score for criterion ${criterion.id}:`, error as Error);
            results.push({
              dimensionId: dimension.id,
              criteriaId: criterion.id,
              scoreValue: 50,
              confidenceScore: 0,
              rawValue: { error: "Calculation failed" },
              dataSources: [criterion.dataSource],
            });
          }
        }
      }

      return results;
    } catch (error) {
      logger.error("Error in calculateRiskScores:", error as Error);
      return [];
    }
  }

  public async saveScores(scores: ScoreResult[]): Promise<void> {
    for (const score of scores) {
      try {
        await prisma.scoringSnapshot.create({
          data: {
            dimensionId: score.dimensionId,
            criteriaId: score.criteriaId,
            entityType: "location",
            entityId: 1,
            scoreValue: score.scoreValue,
            confidenceScore: score.confidenceScore,
            rawValue: score.rawValue as any,
            dataSources: score.dataSources,
          },
        });
      } catch (error) {
        logger.error("Error saving score:", error as Error);
      }
    }
  }
}

export const scoringEngine = new ScoringEngine();
export type { ScoringCriteria, RiskIndicator, KeyFinding, SearchAnalysis, ScoreResult };
