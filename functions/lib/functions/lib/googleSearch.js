"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatSearchResults = exports.validateSearchParams = exports.performGoogleSearch = void 0;
const logger_1 = require("./logger");
/**
 * Perform a Google search using the Custom Search API
 */
const performGoogleSearch = async (query) => {
    var _a;
    if (!query || typeof query !== "string") {
        logger_1.logger.error("Invalid search query", { query });
        throw new Error("Query is required");
    }
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const searchEngineId = process.env.GOOGLE_CSE_ID;
    if (!apiKey || !searchEngineId) {
        logger_1.logger.error("Missing Google Search API configuration");
        throw new Error("Google Search API key or CSE ID not configured");
    }
    try {
        // Add a small random delay to avoid rate limiting
        const delayTime = Math.floor(Math.random() * 1000) + 500;
        await new Promise(resolve => setTimeout(resolve, delayTime));
        const url = new URL("https://www.googleapis.com/customsearch/v1");
        url.searchParams.append("key", apiKey);
        url.searchParams.append("cx", searchEngineId);
        url.searchParams.append("q", query);
        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                Accept: "application/json",
            },
        });
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            const errorMessage = ((_a = data.error) === null || _a === void 0 ? void 0 : _a.message) || "Failed to perform Google search";
            logger_1.logger.error("Google Search API error", {
                status: response.status,
                statusText: response.statusText,
                errorMessage,
            });
            throw new Error(errorMessage);
        }
        const data = await response.json();
        if (!data.items) {
            return {
                results: [],
            };
        }
        const results = data.items.map((item) => ({
            title: item.title,
            link: item.link,
            snippet: item.snippet,
            source: "google",
        }));
        logger_1.logger.info("Google search completed", {
            query,
            resultCount: results.length,
        });
        return {
            results,
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        logger_1.logger.error("Google search error", { error: errorMessage });
        throw new Error(errorMessage);
    }
};
exports.performGoogleSearch = performGoogleSearch;
/**
 * Validate search query parameters
 */
const validateSearchParams = (query) => {
    if (!query.trim()) {
        return { valid: false, error: "Search query cannot be empty" };
    }
    if (query.length > 256) {
        return { valid: false, error: "Search query too long (max 256 characters)" };
    }
    // Check for potentially harmful characters
    const dangerousChars = /[<>{}[\]\\]/;
    if (dangerousChars.test(query)) {
        return { valid: false, error: "Search query contains invalid characters" };
    }
    return { valid: true };
};
exports.validateSearchParams = validateSearchParams;
/**
 * Format search results for display
 */
const formatSearchResults = (results) => {
    return results.map(result => {
        var _a;
        return (Object.assign(Object.assign({}, result), { 
            // Ensure snippet is not too long
            snippet: ((_a = result.snippet) === null || _a === void 0 ? void 0 : _a.length) > 200
                ? `${result.snippet.substring(0, 197)}...`
                : result.snippet || "No description available", 
            // Ensure title exists
            title: result.title || "Untitled" }));
    });
};
exports.formatSearchResults = formatSearchResults;
//# sourceMappingURL=googleSearch.js.map