export interface BaseApiClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  retryConfig: {
    maxRetries: number;
    initialDelayMs: number;
    maxDelayMs: number;
    backoffFactor: number;
  };
  cacheConfig?: {
    enabled: boolean;
    ttlMs: number;
    maxSize: number;
  };
  validateResponses?: boolean;
}

export interface ApiResponse<T> {
  data: T;
  metadata?: {
    timestamp: string;
    requestId: string;
    cached?: boolean;
    responseTime?: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  metadata?: {
    requestId: string;
    timestamp: string;
    endpoint: string;
    statusCode?: number;
  };
}

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
}

export interface CacheConfig {
  enabled: boolean;
  ttlMs: number;
  maxSize: number;
}
