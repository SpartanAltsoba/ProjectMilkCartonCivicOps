"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleSearchClient = void 0;
exports.performGoogleSearch = performGoogleSearch;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../logger");
class GoogleSearchClient {
    constructor() {
        this.baseUrl = "https://www.googleapis.com/customsearch/v1";
        this.apiKey = process.env.GOOGLE_SEARCH_API_KEY || "";
        this.cseId = process.env.GOOGLE_CSE_ID || "";
        if (!this.apiKey || !this.cseId) {
            logger_1.logger.warn("Google Search API credentials not configured");
        }
    }
    async search(query, options = {}) {
        var _a, _b, _c, _d;
        if (!this.apiKey || !this.cseId) {
            return {
                results: [],
                error: "Google Search API not configured",
            };
        }
        try {
            const params = Object.assign({ key: this.apiKey, cx: this.cseId, q: query, num: options.num || 10, start: options.start || 1 }, (options.siteSearch && { siteSearch: options.siteSearch }));
            logger_1.logger.info("Performing Google search", { query, params: Object.assign(Object.assign({}, params), { key: "[REDACTED]" }) });
            const response = await axios_1.default.get(this.baseUrl, {
                params,
                timeout: 10000,
            });
            const items = response.data.items || [];
            const results = items.map((item) => ({
                title: item.title || "",
                link: item.link || "",
                snippet: item.snippet || "",
                displayLink: item.displayLink,
            }));
            return {
                results,
                searchInformation: response.data.searchInformation,
            };
        }
        catch (error) {
            logger_1.logger.error("Google search failed", error, { query });
            if (axios_1.default.isAxiosError(error)) {
                const status = (_a = error.response) === null || _a === void 0 ? void 0 : _a.status;
                const message = ((_d = (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.error) === null || _d === void 0 ? void 0 : _d.message) || error.message;
                return {
                    results: [],
                    error: `Google Search API error (${status}): ${message}`,
                };
            }
            return {
                results: [],
                error: "Unknown error occurred during search",
            };
        }
    }
    async searchWithRetry(query, maxRetries = 3) {
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await this.search(query);
                if (!result.error) {
                    return result;
                }
                lastError = result.error;
                if (attempt < maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                    logger_1.logger.info(`Search attempt ${attempt} failed, retrying in ${delay}ms`, {
                        query,
                        error: result.error,
                    });
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
            catch (error) {
                lastError = error instanceof Error ? error.message : "Unknown error";
                if (attempt < maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000;
                    logger_1.logger.info(`Search attempt ${attempt} failed, retrying in ${delay}ms`, {
                        query,
                        error: lastError,
                    });
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        return {
            results: [],
            error: lastError || "All retry attempts failed",
        };
    }
}
exports.GoogleSearchClient = GoogleSearchClient;
const googleSearchClient = new GoogleSearchClient();
async function performGoogleSearch(query) {
    return googleSearchClient.searchWithRetry(query);
}
//# sourceMappingURL=googleSearch.js.map