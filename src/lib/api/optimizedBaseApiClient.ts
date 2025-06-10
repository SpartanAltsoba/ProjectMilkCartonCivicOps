import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { logger } from "../logger";
import { ApiCache, CacheKey } from "./cache";
import { BaseApiClientConfig } from "../types/apiClient";
import { ExtendedAxiosRequestConfig } from "../types/apiClientTypes";

export const API_CONFIGS = {
  GOVERNMENT: {
    timeout: 30000,
    retryConfig: {
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffFactor: 2,
    },
    cacheConfig: {
      enabled: true,
      ttlMs: 3600000, // 1 hour
      maxSize: 1000,
    },
  },
  COURT: {
    timeout: 45000,
    retryConfig: {
      maxRetries: 5,
      initialDelayMs: 2000,
      maxDelayMs: 20000,
      backoffFactor: 2,
    },
    cacheConfig: {
      enabled: true,
      ttlMs: 7200000, // 2 hours
      maxSize: 2000,
    },
  },
};

export class OptimizedBaseApiClient {
  private axiosInstance: AxiosInstance;
  private config: BaseApiClientConfig;
  private cache?: ApiCache;
  private retryCount: number;
  private retryDelay: number;

  constructor(config: BaseApiClientConfig) {
    this.config = config;
    this.retryCount = 0;
    this.retryDelay = this.config.retryConfig.initialDelayMs;

    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: config.headers || {},
    });

    if (config.cacheConfig?.enabled) {
      this.cache = new ApiCache({
        maxSize: config.cacheConfig.maxSize,
        defaultTtl: config.cacheConfig.ttlMs,
      });
    }

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.axiosInstance.interceptors.request.use(
      config => {
        const requestId = Math.random().toString(36).substring(7);
        (config as ExtendedAxiosRequestConfig).metadata = {
          requestId,
          timestamp: new Date().toISOString(),
          endpoint: config.url || "",
          method: config.method || "GET",
        };
        return config;
      },
      error => {
        logger.error("Request interceptor error", error);
        return Promise.reject(error);
      }
    );

    this.axiosInstance.interceptors.response.use(
      response => {
        const config = response.config as ExtendedAxiosRequestConfig;
        const duration = Date.now() - new Date(config.metadata?.timestamp || "").getTime();

        logger.info("API request completed", {
          requestId: config.metadata?.requestId,
          endpoint: config.metadata?.endpoint,
          method: config.metadata?.method,
          status: response.status,
          duration,
        });

        return response;
      },
      async error => {
        const config = error.config as ExtendedAxiosRequestConfig;

        if (!config) {
          logger.error("Response error without config", error);
          return Promise.reject(error);
        }

        const shouldRetry = this.shouldRetry(error);
        if (shouldRetry && this.retryCount < this.config.retryConfig.maxRetries) {
          this.retryCount++;
          const delay = Math.min(
            this.retryDelay * this.config.retryConfig.backoffFactor,
            this.config.retryConfig.maxDelayMs
          );

          logger.warn("Retrying failed request", {
            requestId: config.metadata?.requestId,
            endpoint: config.metadata?.endpoint,
            attempt: this.retryCount,
            delay,
          });

          await new Promise(resolve => setTimeout(resolve, delay));
          this.retryDelay = delay;

          return this.axiosInstance.request(config);
        }

        logger.error("Response error", {
          requestId: config.metadata?.requestId,
          endpoint: config.metadata?.endpoint,
          error: error.message,
          status: error.response?.status,
        });

        return Promise.reject(error);
      }
    );
  }

  private shouldRetry(error: any): boolean {
    if (!error.config) return false;

    // Don't retry on client errors (except 429 - rate limit)
    if (error.response?.status && error.response.status !== 429 && error.response.status < 500) {
      return false;
    }

    // Retry on network errors, 5xx responses, and rate limits
    return !error.response || error.response.status >= 500 || error.response.status === 429;
  }

  private createCacheKey(endpoint: string, config?: AxiosRequestConfig): CacheKey {
    return {
      endpoint,
      params: config?.params as Record<string, unknown>,
      headers: config?.headers as Record<string, string>,
    };
  }

  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    if (this.cache) {
      const cacheKey = this.createCacheKey(endpoint, config);
      const cachedData = await this.cache.get<T>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    const response = await this.axiosInstance.get<T>(endpoint, config);

    if (this.cache && response.data) {
      const cacheKey = this.createCacheKey(endpoint, config);
      await this.cache.set(cacheKey, response.data);
    }

    return response.data;
  }

  async post<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.post<T>(endpoint, data, config);
    return response.data;
  }

  async put<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.put<T>(endpoint, data, config);
    return response.data;
  }

  async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.delete<T>(endpoint, config);
    return response.data;
  }

  async patch<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.patch<T>(endpoint, data, config);
    return response.data;
  }

  async cachedRequest<T>(
    cacheKey: string,
    requestFn: () => Promise<T>,
    ttlHours?: number
  ): Promise<T> {
    if (this.cache) {
      const key = { endpoint: cacheKey, params: {}, headers: {} };
      const cachedData = await this.cache.get<T>(key);
      if (cachedData) {
        return cachedData;
      }
    }

    const result = await requestFn();

    if (this.cache && result) {
      const key = { endpoint: cacheKey, params: {}, headers: {} };
      await this.cache.set(key, result, ttlHours ? ttlHours * 3600000 : undefined);
    }

    return result;
  }

  async batchRequests<T>(
    requests: (() => Promise<T>)[],
    concurrency: number = 3,
    delayMs: number = 1000
  ): Promise<T[]> {
    const results: T[] = [];

    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);
      const batchResults = await Promise.all(batch.map(req => req()));
      results.push(...batchResults);

      // Add delay between batches (except for the last batch)
      if (i + concurrency < requests.length) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    return results;
  }
}
