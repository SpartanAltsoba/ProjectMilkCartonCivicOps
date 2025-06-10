"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoringEngine = void 0;
const logger_1 = require("../../../src/lib/logger");
const cache_1 = require("../../../src/lib/api/cache");
const googleSearch_1 = require("../../../src/lib/api/googleSearch");
const prisma_1 = require("../../../src/lib/database/prisma");
class ScoringEngine {
    constructor() { }
    async getCachedData(key) {
        return cache_1.cacheManager.get({
            apiName: "ScoringEngine",
            entityType: "score",
            entityId: 0,
            dataKey: key,
        });
    }
    async cacheData(key, data, ttlHours = 24) {
        await cache_1.cacheManager.set({
            apiName: "ScoringEngine",
            entityType: "score",
            entityId: 0,
            dataKey: key,
        }, data, ttlHours);
    }
    async fetchApiData(criteria, state, county) {
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
    async fetchGoogleSearchData(state, county, cacheKey, criteriaName) {
        const searchCacheKey = `${cacheKey}_${criteriaName.replace(/\s+/g, "_")}`;
        const cachedData = await this.getCachedData(`google_search:${searchCacheKey}`);
        if (cachedData)
            return cachedData;
        try {
            const searchQueries = this.buildSearchQueries(state, county, criteriaName);
            const allResults = [];
            for (const query of searchQueries) {
                try {
                    logger_1.logger.info(`Searching: ${query}`);
                    const results = await (0, googleSearch_1.performGoogleSearch)(query);
                    if (results && typeof results === "object" && "results" in results) {
                        allResults.push(...results.results);
                    }
                    // Respect rate limits
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
                catch (error) {
                    logger_1.logger.error(`Search failed for query: ${query}`, error);
                }
            }
            const analyzedData = this.analyzeSearchResults(allResults, state, county, criteriaName);
            await this.cacheData(`google_search:${searchCacheKey}`, analyzedData, 24);
            return analyzedData;
        }
        catch (error) {
            logger_1.logger.error("Error fetching Google search data:", error);
            const fallbackData = {
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
    buildSearchQueries(state, county, criteriaName) {
        const location = county ? `${county} county ${state}` : state;
        const queries = [];
        // Default searches
        queries.push(`"${criteriaName}" "${location}" problems issues`);
        queries.push(`"child welfare" "${location}" "${criteriaName}" investigation`);
        return queries;
    }
    analyzeSearchResults(results, state, county, criteriaName) {
        const analysis = {
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
            if (!result || typeof result !== "object")
                return;
            const resultObj = result;
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
                }
                catch (_a) {
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
            riskLevel: analysis.riskScore > 70
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
    generateRecommendations(riskIndicators, riskScore) {
        const recommendations = [];
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
    async calculateRiskScores(state, county) {
        try {
            const dimensions = await prisma_1.prisma.scoringDimension.findMany({
                where: { enabled: true },
            });
            const results = [];
            for (const dimension of dimensions) {
                const criteria = await prisma_1.prisma.scoringCriteria.findMany({
                    where: {
                        dimensionId: dimension.id,
                        enabled: true,
                    },
                });
                for (const criterion of criteria) {
                    try {
                        const apiData = await this.fetchApiData(criterion, state, county);
                        const typedData = apiData;
                        results.push({
                            dimensionId: dimension.id,
                            criteriaId: criterion.id,
                            scoreValue: typedData.riskScore || 50,
                            confidenceScore: typedData.error ? 25 : 75,
                            rawValue: apiData,
                            dataSources: [criterion.dataSource],
                        });
                    }
                    catch (error) {
                        logger_1.logger.error(`Error calculating score for criterion ${criterion.id}:`, error);
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
        }
        catch (error) {
            logger_1.logger.error("Error in calculateRiskScores:", error);
            return [];
        }
    }
    async saveScores(scores) {
        for (const score of scores) {
            try {
                await prisma_1.prisma.scoringSnapshot.create({
                    data: {
                        dimensionId: score.dimensionId,
                        criteriaId: score.criteriaId,
                        entityType: "location",
                        entityId: 1,
                        scoreValue: score.scoreValue,
                        confidenceScore: score.confidenceScore,
                        rawValue: score.rawValue,
                        dataSources: score.dataSources,
                    },
                });
            }
            catch (error) {
                logger_1.logger.error("Error saving score:", error);
            }
        }
    }
}
exports.scoringEngine = new ScoringEngine();
//# sourceMappingURL=scoringUtils.js.map