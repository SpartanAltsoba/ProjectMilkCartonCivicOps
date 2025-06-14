import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { parseStringPromise } from 'xml2js';

interface DataFetcherConfig {
  cseApiKey?: string;
  cseEngineId?: string;
  fecApiKey?: string;
  usaSpendingApiKey?: string;
  rateLimits?: {
    maxConcurrent: number;
    requestsPerMinute: number;
  };
}

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  source: string;
  confidence: number;
  retrieved_at: string;
  tier_hit?: number;
  latency?: number;
}

interface CoverageRequirement {
  entity_type: string;
  min_confidence: number;
  required_fields: string[];
}

interface FetchResult {
  results: SearchResult[];
  coverage: number;
  tier_hit: number;
  latency: number;
}

export class DataFetcher {
  private config: DataFetcherConfig;
  private localDbPath: string;
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second
  private whitelistedDomains = [
    'legislature.gov',
    'oversight.gov',
    'childrensrights.org',
    'childwelfare.gov'
  ];

  constructor(config: DataFetcherConfig) {
    this.config = config;
    this.localDbPath = path.join(process.cwd(), 'data', 'curated_db.json');
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    retryCount = 0
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retryCount >= this.maxRetries) {
        throw error;
      }
      await this.sleep(this.retryDelay * Math.pow(2, retryCount));
      return this.retryWithBackoff(operation, retryCount + 1);
    }
  }

  async fetchWithPriorityLadder(
    query: string,
    coverageNeeded: CoverageRequirement[],
    annotations: string
  ): Promise<FetchResult> {
    const startTime = Date.now();
    let results: SearchResult[] = [];
    let coverage = 0;
    let tierHit = 0;

    // Parse annotations
    const annotationsObj = await parseStringPromise(annotations);
    const boostLabels = annotationsObj.annotations.boost?.[0]?.label || [];
    const excludeLabels = annotationsObj.annotations.exclude?.[0]?.label || [];

    // Tier 0: Query local curated DB
    console.log('Trying Tier 0: Local curated DB...');
    results = await this.queryLocalDB(query);
    coverage = this.calculateCoverage(results, coverageNeeded);
    
    if (coverage >= 0.95) {
      return {
        results,
        coverage,
        tier_hit: 0,
        latency: Date.now() - startTime
      };
    }

    // Tier 1: Google CSE with boost/exclude labels
    console.log('Escalating to Tier 1: Google CSE...');
    const cseResults = await this.queryGoogleCSE(query, boostLabels, excludeLabels);
    results = [...results, ...cseResults];
    coverage = this.calculateCoverage(results, coverageNeeded);
    
    if (coverage >= 0.95) {
      return {
        results,
        coverage,
        tier_hit: 1,
        latency: Date.now() - startTime
      };
    }

    // Tier 2: Structured APIs
    console.log('Escalating to Tier 2: Structured APIs...');
    const [fecResults, usaSpendingResults] = await Promise.all([
      this.queryFEC(query),
      this.queryUSASpending(query)
    ]);
    results = [...results, ...fecResults, ...usaSpendingResults];
    coverage = this.calculateCoverage(results, coverageNeeded);
    
    if (coverage >= 0.95) {
      return {
        results,
        coverage,
        tier_hit: 2,
        latency: Date.now() - startTime
      };
    }

    // Tier 3: Scrape whitelisted sites
    console.log('Escalating to Tier 3: Whitelisted sites...');
    const scrapedResults = await this.scrapeWhitelistedSites(query);
    results = [...results, ...scrapedResults];
    coverage = this.calculateCoverage(results, coverageNeeded);
    
    if (coverage >= 0.95) {
      return {
        results,
        coverage,
        tier_hit: 3,
        latency: Date.now() - startTime
      };
    }

    // Tier 4: Headless browser (if not rate limited)
    if (!this.isRateLimited()) {
      console.log('Escalating to Tier 4: Headless browser...');
      const browserResults = await this.useHeadlessBrowser(query);
      results = [...results, ...browserResults];
      coverage = this.calculateCoverage(results, coverageNeeded);
      tierHit = 4;
    } else {
      console.log('Skipping Tier 4 due to rate limits');
      tierHit = 3;
    }

    return {
      results,
      coverage,
      tier_hit: tierHit,
      latency: Date.now() - startTime
    };
  }

  private async queryLocalDB(query: string): Promise<SearchResult[]> {
    try {
      const data = await fs.readFile(this.localDbPath, 'utf-8');
      const db = JSON.parse(data);
      
      const results = db.vendors
        .filter((v: any) => v.name.toLowerCase().includes(query.toLowerCase()))
        .map((v: any) => ({
          title: v.name,
          link: v.source_url || '',
          snippet: v.description || '',
          source: 'local_db',
          confidence: 1.0,
          retrieved_at: new Date().toISOString(),
          tier_hit: 0
        }));

      console.log(`Found ${results.length} matches in local DB`);
      return results;
    } catch (error) {
      console.warn('Local DB query failed:', error);
      return [];
    }
  }

  private async queryGoogleCSE(
    query: string,
    boostLabels: string[],
    excludeLabels: string[]
  ): Promise<SearchResult[]> {
    if (!this.config.cseApiKey || !this.config.cseEngineId) {
      console.warn('Google CSE credentials not configured');
      return [];
    }

    // Construct boosted query
    const boostQuery = boostLabels.length > 0 
      ? `${query} (${boostLabels.join(' OR ')})`
      : query;

    // Add exclusions
    const fullQuery = excludeLabels.length > 0
      ? `${boostQuery} -${excludeLabels.join(' -')}`
      : boostQuery;

    try {
      const response = await this.retryWithBackoff(() => 
        axios.get('https://www.googleapis.com/customsearch/v1', {
          params: {
            key: this.config.cseApiKey,
            cx: this.config.cseEngineId,
            q: fullQuery,
            num: 10
          }
        })
      );

      return response.data.items.map((item: any) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        source: 'google_cse',
        confidence: 0.8,
        retrieved_at: new Date().toISOString(),
        tier_hit: 1
      }));
    } catch (error) {
      console.error('Google CSE query failed:', error);
      return [];
    }
  }

  private async queryFEC(query: string): Promise<SearchResult[]> {
    if (!this.config.fecApiKey) {
      console.warn('FEC API key not configured');
      return [];
    }

    try {
      const response = await this.retryWithBackoff(() =>
        axios.get('https://api.open.fec.gov/v1/schedules/schedule_a/', {
          params: {
            api_key: this.config.fecApiKey,
            contributor_name: query,
            per_page: 20,
            sort: '-contribution_receipt_date'
          }
        })
      );

      return response.data.results.map((item: any) => ({
        title: `FEC Contribution: ${item.committee_name}`,
        link: `https://www.fec.gov/data/receipts/${item.sub_id}`,
        snippet: `$${item.contribution_receipt_amount} on ${item.contribution_receipt_date}`,
        source: 'fec_api',
        confidence: 0.9,
        retrieved_at: new Date().toISOString(),
        tier_hit: 2
      }));
    } catch (error) {
      console.error('FEC API query failed:', error);
      return [];
    }
  }

  private async queryUSASpending(query: string): Promise<SearchResult[]> {
    try {
      const response = await this.retryWithBackoff(() =>
        axios.post('https://api.usaspending.gov/api/v2/search/spending_by_award/', {
          filters: {
            keywords: [query],
            award_type_codes: ["A", "B", "C", "D"],
            time_period: [
              {
                start_date: "2020-01-01",
                end_date: "2024-12-31"
              }
            ]
          },
          fields: [
            "recipient_name",
            "recipient_id",
            "Award Amount",
            "period_of_performance_start_date",
            "awarding_agency_name",
            "Award ID"
          ],
          page: 1,
          limit: 20,
          sort: "Award Amount",
          order: "desc"
        })
      );

      return response.data.results.map((item: any) => ({
        title: `Contract: ${item.recipient_name}`,
        link: `https://www.usaspending.gov/award/${item["Award ID"]}`,
        snippet: `$${item["Award Amount"]} from ${item.awarding_agency_name}`,
        source: 'usaspending_api',
        confidence: 0.95,
        retrieved_at: new Date().toISOString(),
        tier_hit: 2
      }));
    } catch (error) {
      console.error('USASpending API query failed:', error);
      return [];
    }
  }

  private async scrapeWhitelistedSites(query: string): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    for (const domain of this.whitelistedDomains) {
      try {
        const response = await axios.get(`https://${domain}/search`, {
          params: { q: query },
          timeout: 5000
        });

        // Basic HTML scraping - in production, use proper HTML parsing
        const matches = response.data.match(/<a[^>]*>.*?<\/a>/g) || [];
        
        matches.forEach((match: string) => {
          const href = match.match(/href="([^"]*)"/) || [];
          const text = match.replace(/<[^>]*>/g, '');

          if (href[1] && text) {
            results.push({
              title: text,
              link: href[1],
              snippet: '',
              source: domain,
              confidence: 0.7,
              retrieved_at: new Date().toISOString(),
              tier_hit: 3
            });
          }
        });
      } catch (error) {
        console.warn(`Scraping failed for ${domain}:`, error);
      }
    }

    return results;
  }

  private async useHeadlessBrowser(query: string): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const browser = await chromium.launch();

    try {
      const context = await browser.newContext();
      const page = await context.newPage();

      // Example: Search state legislative sites
      for (const domain of this.whitelistedDomains) {
        try {
          await page.goto(`https://${domain}/search?q=${encodeURIComponent(query)}`);
          await page.waitForLoadState('networkidle');

          const links = await page.$$eval('a', (elements: any[]) => 
            elements.map((el: any) => ({
              href: el.href,
              text: el.textContent || ''
            }))
          );

          links.forEach((link: { href: string; text: string }) => {
            if (link.href && link.text) {
              results.push({
                title: link.text,
                link: link.href,
                snippet: '',
                source: `${domain}_browser`,
                confidence: 0.6,
                retrieved_at: new Date().toISOString(),
                tier_hit: 4
              });
            }
          });
        } catch (error) {
          console.warn(`Browser automation failed for ${domain}:`, error);
        }
      }
    } finally {
      await browser.close();
    }

    return results;
  }

  private calculateCoverage(
    results: SearchResult[],
    requirements: CoverageRequirement[]
  ): number {
    if (results.length === 0 || requirements.length === 0) {
      return 0;
    }

    let totalScore = 0;
    for (const req of requirements) {
      const matchingResults = results.filter(r => 
        r.confidence >= req.min_confidence &&
        req.required_fields.every(field => 
          Object.keys(r).includes(field)
        )
      );

      totalScore += matchingResults.length / results.length;
    }

    return totalScore / requirements.length;
  }

  private isRateLimited(): boolean {
    if (!this.config.rateLimits) {
      return false;
    }

    // Implement rate limiting logic here
    // For now, return false to allow all requests
    return false;
  }
}
