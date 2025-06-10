"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.identifyStakeholders = identifyStakeholders;
exports.getInvolvedAgencies = getInvolvedAgencies;
exports.getContractors = getContractors;
exports.getRepresentatives = getRepresentatives;
const logger_1 = require("functions/lib/logger");
const googleSearch_1 = require("functions/lib/googleSearch");
/**
 * Identifies all relevant stakeholders for a given location and scenario
 */
async function identifyStakeholders(location, _scenario) {
    try {
        const [agencies, contractors, representatives] = await Promise.all([
            getInvolvedAgencies(location, _scenario),
            getContractors(location, _scenario),
            getRepresentatives(location),
        ]);
        logger_1.logger.info("Stakeholder identification complete", {
            location: location.full,
            agencyCount: agencies.length,
            contractorCount: contractors.length,
            representativeCount: representatives.length,
        });
        return {
            agencies,
            contractors,
            representatives,
        };
    }
    catch (error) {
        logger_1.logger.error("Error in stakeholder identification", {
            location: location.full,
            error: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
    }
}
/**
 * Identifies CPS and related government agencies
 */
async function getInvolvedAgencies(location, _scenario) {
    const query = `${location.state} ${location.county} CPS agency site:.gov`;
    try {
        const searchResponse = await (0, googleSearch_1.performGoogleSearch)(query);
        return searchResponse.results.map(result => {
            // Determine agency type based on URL and title
            const isState = result.link.includes(".state.");
            const isCounty = result.link.includes(location.county.toLowerCase());
            return {
                name: result.title.replace(/- .+$/, "").trim(), // Remove trailing org info
                type: isState ? "state" : isCounty ? "county" : "local",
                source: result.link,
            };
        });
    }
    catch (error) {
        logger_1.logger.error("Error identifying agencies", {
            location: location.full,
            error: error instanceof Error ? error.message : "Unknown error",
        });
        return [];
    }
}
/**
 * Identifies contractors and service providers
 */
async function getContractors(location, _scenario) {
    const query = `${location.state} ${location.county} foster care contractor site:usaspending.gov OR site:guidestar.org`;
    try {
        const searchResponse = await (0, googleSearch_1.performGoogleSearch)(query);
        return searchResponse.results.map(result => {
            // Try to extract EIN from GuideStart URLs
            const einMatch = result.link.match(/ein=(\d{2}-\d{7})/);
            // Determine organization type
            const isNonprofit = result.link.includes("guidestar.org") ||
                result.title.toLowerCase().includes("non-profit") ||
                result.title.toLowerCase().includes("nonprofit");
            return {
                name: result.title.replace(/\s*\|.*$/, "").trim(), // Remove trailing org info
                ein: einMatch ? einMatch[1] : undefined,
                type: isNonprofit ? "nonprofit" : "unknown",
                source: result.link,
            };
        });
    }
    catch (error) {
        logger_1.logger.error("Error identifying contractors", {
            location: location.full,
            error: error instanceof Error ? error.message : "Unknown error",
        });
        return [];
    }
}
/**
 * Identifies relevant government representatives
 */
async function getRepresentatives(location) {
    const query = `${location.state} ${location.county} child welfare representative site:opensecrets.org`;
    try {
        const searchResponse = await (0, googleSearch_1.performGoogleSearch)(query);
        return searchResponse.results.map(result => {
            // Try to extract role from title or snippet
            const roleMatch = result.title.match(/(?:Senator|Representative|Commissioner|Director)/i) ||
                result.snippet.match(/(?:Senator|Representative|Commissioner|Director)/i);
            return {
                name: result.title.replace(/\s*\(.*?\)/, "").trim(), // Remove parentheticals
                role: roleMatch ? roleMatch[0] : "Unknown Role",
                jurisdiction: `${location.county} County, ${location.state}`,
                source: result.link,
            };
        });
    }
    catch (error) {
        logger_1.logger.error("Error identifying representatives", {
            location: location.full,
            error: error instanceof Error ? error.message : "Unknown error",
        });
        return [];
    }
}
//# sourceMappingURL=stakeholderIdentification.js.map