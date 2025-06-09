import { logger } from "functions/lib/logger";

interface SourceCategory {
  agency: string[];
  legal: string[];
  contractor: string[];
  representative: string[];
}

interface CitationMetadata {
  url: string;
  title?: string;
  accessDate: string;
  category: keyof SourceCategory;
  searchQuery?: string;
}

/**
 * Manages source citations for all CSE queries and data collection
 */
export class SourceCitations {
  private sources: CitationMetadata[] = [];

  /**
   * Adds a source citation
   */
  addSource(citation: CitationMetadata): void {
    // Avoid duplicate URLs
    if (!this.sources.some(source => source.url === citation.url)) {
      this.sources.push({
        ...citation,
        accessDate: citation.accessDate || new Date().toISOString(),
      });

      logger.info("Source citation added", {
        url: citation.url,
        category: citation.category,
      });
    }
  }

  /**
   * Adds multiple sources from search results
   */
  addSourcesFromSearch(
    results: Array<{ link: string; title: string }>,
    category: keyof SourceCategory,
    searchQuery?: string
  ): void {
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
  getSourcesByCategory(): SourceCategory {
    const categorized: SourceCategory = {
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
  getAllSourceUrls(): string[] {
    return this.sources.map(source => source.url);
  }

  /**
   * Gets detailed citation information
   */
  getDetailedCitations(): CitationMetadata[] {
    return [...this.sources];
  }

  /**
   * Generates formatted citation list for reports
   */
  generateFormattedCitations(): string {
    const categorized = this.getSourcesByCategory();
    let formatted = "";

    Object.entries(categorized).forEach(([category, urls]) => {
      if (urls.length > 0) {
        formatted += `\n## ${this.capitalizeCategory(category)} Sources\n`;
        urls.forEach((url: string, index: number) => {
          const source = this.sources.find(s => s.url === url);
          formatted += `${index + 1}. ${source?.title || "Untitled"}\n`;
          formatted += `   ${url}\n`;
          formatted += `   Accessed: ${source?.accessDate ? new Date(source.accessDate).toLocaleDateString() : "Unknown"}\n`;
          if (source?.searchQuery) {
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
  exportAsJson(): string {
    return JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        totalSources: this.sources.length,
        sourcesByCategory: this.getSourcesByCategory(),
        detailedCitations: this.sources,
      },
      null,
      2
    );
  }

  /**
   * Clears all citations
   */
  clear(): void {
    this.sources = [];
    logger.info("All source citations cleared");
  }

  /**
   * Gets citation statistics
   */
  getStatistics(): Record<string, number> {
    const stats: Record<string, number> = {
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

  private capitalizeCategory(category: string): string {
    return category.charAt(0).toUpperCase() + category.slice(1);
  }
}

// Export singleton instance for global use
export const globalSourceCitations = new SourceCitations();

export type { SourceCategory, CitationMetadata };
