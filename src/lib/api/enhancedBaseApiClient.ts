import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, CancelTokenSource } from "axios";
import { z } from "zod";
import { logger } from "../logger";
import { ApiCache, CacheKeyBuilder } from "./cache";
import { ApiValidator, ValidationError } from "./validation";
import type { BaseApiClientConfig } from "../types/apiClient";
import {
  RequestMetadata,
  ExtendedAxiosRequestConfig,
  ApiErrorMetadata,
  ApiError,
  EnhancedRequestOptions,
} from "../types/apiClientTypes";

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

  // ... rest of the code ...

  protected async request<T>(options: EnhancedRequestOptions): Promise<T> {
    // ... rest of the code ...
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.request({
        url: options.endpoint,
        cancelToken: cancelTokenSource.token,
        ...config,
      });
      // ... rest of the code ...
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ... rest of the code ...
}
