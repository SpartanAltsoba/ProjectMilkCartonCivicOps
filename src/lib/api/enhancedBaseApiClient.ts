import axios, { AxiosInstance, AxiosResponse, CancelTokenSource } from "axios";
import { ApiCache } from "./cache";
import type { BaseApiClientConfig } from "../types/apiClient";
import { EnhancedRequestOptions } from "../types/apiClientTypes";

export class EnhancedBaseApiClient {
  private axiosInstance: AxiosInstance;
  private config: BaseApiClientConfig;
  private cache?: ApiCache;
  private retryDelay: number;
  private retryCount: number;
  private cancelTokens: Map<string, CancelTokenSource> = new Map();

  constructor(config: BaseApiClientConfig, axiosInstance: AxiosInstance, cache?: ApiCache) {
    this.config = config;
    this.axiosInstance = axiosInstance;
    this.cache = cache;
    this.retryDelay = this.config.retryConfig.initialDelayMs;
    this.retryCount = 0;
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Setup request interceptor
    this.axiosInstance.interceptors.request.use(
      config => {
        console.log(`Making request to: ${config.url}`);
        return config;
      },
      error => {
        console.error("Request error:", error);
        return Promise.reject(error);
      }
    );

    // Setup response interceptor
    this.axiosInstance.interceptors.response.use(
      response => {
        console.log(`Response received from: ${response.config.url}`);
        return response;
      },
      error => {
        console.error("Response error:", error);
        return Promise.reject(error);
      }
    );
  }

  private handleError(error: any): Error {
    // Basic error handling
    if (error.response) {
      return new Error(`API Error: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      return new Error("Network Error: No response received");
    } else {
      return new Error(`Request Error: ${error.message}`);
    }
  }

  protected async request<T>(options: EnhancedRequestOptions): Promise<T> {
    const abortController = new AbortController();
    const requestConfig = {
      ...options,
      url: options.endpoint,
      signal: abortController.signal,
    };

    try {
      const response: AxiosResponse<T> = await this.axiosInstance.request(requestConfig);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ... rest of the code ...
}
