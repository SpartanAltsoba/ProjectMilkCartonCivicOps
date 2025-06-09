import { AxiosRequestConfig } from "axios";

export interface RequestMetadata {
  requestId: string;
  timestamp: string;
  endpoint: string;
  method: string;
  userAgent?: string;
  ip?: string;
}

export interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  metadata?: RequestMetadata;
  retryCount?: number;
  cacheKey?: string;
  skipCache?: boolean;
  skipRetry?: boolean;
}

export interface ApiErrorMetadata {
  requestId: string;
  timestamp: string;
  endpoint: string;
  statusCode?: number;
  retryCount?: number;
  responseTime?: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  metadata?: ApiErrorMetadata;
}

export interface EnhancedRequestOptions {
  endpoint: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  data?: unknown;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  timeout?: number;
  skipCache?: boolean;
  skipRetry?: boolean;
  validateResponse?: boolean;
  cacheKey?: string;
  cacheTtl?: number;
}

export interface ResponseMetadata {
  requestId: string;
  timestamp: string;
  responseTime: number;
  cached: boolean;
  retryCount: number;
  endpoint: string;
}

export interface EnhancedResponse<T> {
  data: T;
  metadata: ResponseMetadata;
}
