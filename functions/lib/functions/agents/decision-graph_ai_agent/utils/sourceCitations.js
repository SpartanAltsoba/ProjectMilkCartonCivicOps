"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalSourceCitations = exports.SourceCitations = void 0;
const logger_1 = require("functions/lib/logger");
/**
 * Manages source citations for all CSE queries and data collection
 */
class SourceCitations {
    constructor() {
        this.sources = [];
    }
    /**
     * Adds a source citation
     */
    addSource(citation) {
        // Avoid duplicate URLs
        if (!this.sources.some(source => source.url === citation.url)) {
            this.sources.push(Object.assign(Object.assign({}, citation), { accessDate: citation.accessDate || new Date().toISOString() }));
            logger_1.logger.info("Source citation added", {
                url: citation.url,
                category: citation.category,
            });
        }
    }
    /**
     * Adds multiple sources from search results
     */
    addSourcesFromSearch(results, category, searchQuery) {
        results.forEach(result => {
            this.addSource({
                url: result.link,
                title: result.title,
                category,
                searchQuery,
                accessDate: new Date().toISOString(),
            });
        });
    }
    /**
     * Gets all sources grouped by category
     */
    getSourcesByCategory() {
        const categorized = {
            agency: [],
            legal: [],
            contractor: [],
            representative: [],
        };
        this.sources.forEach(source => {
            categorized[source.category].push(source.url);
        });
        return categorized;
    }
    /**
     * Gets all source URLs as a flat array
     */
    getAllSourceUrls() {
        return this.sources.map(source => source.url);
    }
    /**
     * Gets detailed citation information
     */
    getDetailedCitations() {
        return [...this.sources];
    }
    /**
     * Generates formatted citation list for reports
     */
    generateFormattedCitations() {
        const categorized = this.getSourcesByCategory();
        let formatted = "";
        Object.entries(categorized).forEach(([category, urls]) => {
            if (urls.length > 0) {
                formatted += `\n## ${this.capitalizeCategory(category)} Sources\n`;
                urls.forEach((url, index) => {
                    const source = this.sources.find(s => s.url === url);
                    formatted += `${index + 1}. ${(source === null || source === void 0 ? void 0 : source.title) || "Untitled"}\n`;
                    formatted += `   ${url}\n`;
                    formatted += `   Accessed: ${(source === null || source === void 0 ? void 0 : source.accessDate) ? new Date(source.accessDate).toLocaleDateString() : "Unknown"}\n`;
                    if (source === null || source === void 0 ? void 0 : source.searchQuery) {
                        formatted += `   Search Query: "${source.searchQuery}"\n`;
                    }
                    formatted += "\n";
                });
            }
        });
        return formatted;
    }
    /**
     * Exports citations in JSON format
     */
    exportAsJson() {
        return JSON.stringify({
            generatedAt: new Date().toISOString(),
            totalSources: this.sources.length,
            sourcesByCategory: this.getSourcesByCategory(),
            detailedCitations: this.sources,
        }, null, 2);
    }
    /**
     * Clears all citations
     */
    clear() {
        this.sources = [];
        logger_1.logger.info("All source citations cleared");
    }
    /**
     * Gets citation statistics
     */
    getStatistics() {
        const stats = {
            total: this.sources.length,
            agency: 0,
            legal: 0,
            contractor: 0,
            representative: 0,
        };
        this.sources.forEach(source => {
            stats[source.category]++;
        });
        return stats;
    }
    capitalizeCategory(category) {
        return category.charAt(0).toUpperCase() + category.slice(1);
    }
}
exports.SourceCitations = SourceCitations;
// Export singleton instance for global use
exports.globalSourceCitations = new SourceCitations();
//# sourceMappingURL=sourceCitations.js.map