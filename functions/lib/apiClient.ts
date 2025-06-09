import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { logger } from "./logger";

export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  retryConfig?: {
    maxRetries: number;
    initialDelayMs: number;
    maxDelayMs: number;
    backoffFactor: number;
  };
}

export const API_CONFIGS = {
  GOVERNMENT: {
    timeout: 30000,
    retryConfig: {
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffFactor: 2,
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
  },
};

export class ApiClient {
  private axiosInstance: AxiosInstance;
  private config: ApiClientConfig;
  private retryCount: number;
  private retryDelay: number;

  constructor(config: ApiClientConfig) {
    this.config = config;
    this.retryCount = 0;
    this.retryDelay = this.config.retryConfig?.initialDelayMs || 1000;

    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: config.headers || {},
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.axiosInstance.interceptors.request.use(
      config => {
        const requestId = Math.random().toString(36).substring(7);
        logger.info("API request started", {
          requestId,
          endpoint: config.url,
          method: config.method,
        });
        return config;
      },
      error => {
        logger.error("Request interceptor error", error);
        return Promise.reject(error);
      }
    );

    this.axiosInstance.interceptors.response.use(
      response => {
        logger.info("API request completed", {
          endpoint: response.config.url,
          status: response.status,
        });
        return response;
      },
      async error => {
        if (!error.config) {
          logger.error("Response error without config", error);
          return Promise.reject(error);
        }

        const shouldRetry = this.shouldRetry(error);
        const maxRetries = this.config.retryConfig?.maxRetries || 3;

        if (shouldRetry && this.retryCount < maxRetries) {
          this.retryCount++;
          const delay = Math.min(
            this.retryDelay * (this.config.retryConfig?.backoffFactor || 2),
            this.config.retryConfig?.maxDelayMs || 10000
          );

          logger.warn("Retrying failed request", {
            endpoint: error.config.url,
            attempt: this.retryCount,
            delay,
          });

          await new Promise(resolve => setTimeout(resolve, delay));
          this.retryDelay = delay;

          return this.axiosInstance.request(error.config);
        }

        logger.error("Response error", {
          endpoint: error.config.url,
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

  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.get<T>(endpoint, config);
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
}
