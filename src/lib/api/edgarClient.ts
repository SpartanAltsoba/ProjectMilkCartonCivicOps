import { BaseApiClient, ApiError } from "./baseApiClient";
import { logger } from "../logger";
import { firestore } from "firebase-admin";

interface ResearchMonsterConfig {
  userAgent: string[];
  delayRange: [number, number];
}

interface CPSData {
  laws: string[];
  fundingSources: string[];
}

interface CPSDataResponse {
  data: CPSData;
  state: string;
  county: string;
  city: string;
}

export class ResearchMonsterClient extends BaseApiClient {
  private static readonly BASE_URL = "https://www.researchmonster.com/";
  private lastRequestTime: number = 0;
  private userAgentIndex: number = 0;

  constructor(private config: ResearchMonsterConfig) {
    super({
      baseUrl: ResearchMonsterClient.BASE_URL,
      defaultHeaders: {
        "User-Agent": config.userAgent[0],
        "Accept-Encoding": "gzip, deflate",
      },
      retry: {
        maxRetries: 3,
        initialDelay: 2000,
        maxDelay: 10000,
        backoffFactor: 2,
      },
    });
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const delay =
      this.config.delayRange[0] +
      Math.random() * (this.config.delayRange[1] - this.config.delayRange[0]);

    if (timeSinceLastRequest < delay) {
      await new Promise(resolve => setTimeout(resolve, delay - timeSinceLastRequest));
    }

    this.lastRequestTime = Date.now();
    this.userAgentIndex = (this.userAgentIndex + 1) % this.config.userAgent.length;
    this.setDefaultHeader("User-Agent", this.config.userAgent[this.userAgentIndex]);
  }

  protected async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    await this.enforceRateLimit();

    try {
      return await super.request<T>(url, options);
    } catch (error) {
      if (error instanceof ApiError) {
        switch (error.status) {
          case 403:
            logger.error("Research Monster API access forbidden - check user agent", {
              url,
              headers: options.headers,
            });
            throw new ApiError(
              403,
              "Access to Research Monster API forbidden. Please ensure your application is properly identified.",
              error.data
            );
          case 429:
            logger.warn("Research Monster API rate limit exceeded", {
              url,
              retryAfter: (options.headers as Record<string, string>)?.[`Retry-After`],
            });
            throw error;
          default:
            throw error;
        }
      }
      throw error;
    }
  }

  async getCPSData(state: string, county?: string, city?: string): Promise<CPSDataResponse> {
    const queryParams = this.buildQueryString({
      state,
      county,
      city,
    });

    try {
      const response = await this.get<CPSDataResponse>(`/api/cps/data${queryParams}`);

      logger.info("Successfully retrieved CPS data", {
        state,
        county,
        city,
        data: response.data,
      });

      return response;
    } catch (error) {
      logger.error("Failed to retrieve CPS data", {
        state,
        county,
        city,
        error,
      });
      throw error;
    }
  }

  async storeCPSDataToFirestore(data: CPSDataResponse): Promise<void> {
    const db = firestore();
    const docRef = db.collection("cpsData").doc(`${data.state}-${data.county}-${data.city}`);

    try {
      await db.runTransaction(async transaction => {
        const doc = await transaction.get(docRef);

        if (!doc.exists) {
          transaction.set(docRef, data);
        } else {
          transaction.update(docRef, data as any);
        }
      });

      logger.info("Successfully stored CPS data to Firestore", {
        state: data.state,
        county: data.county,
        city: data.city,
      });
    } catch (error) {
      logger.error("Failed to store CPS data to Firestore", {
        state: data.state,
        county: data.county,
        city: data.city,
        error,
      });
      throw error;
    }
  }
}

export const createResearchMonsterClient = (
  config: ResearchMonsterConfig
): ResearchMonsterClient => {
  if (!config.userAgent || !config.delayRange) {
    throw new Error("Research Monster API client requires userAgent and delayRange configuration");
  }
  return new ResearchMonsterClient(config);
};
