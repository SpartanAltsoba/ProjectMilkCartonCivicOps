import axios, { AxiosResponse, AxiosRequestConfig } from "axios";
import { logger } from "functions/lib/logger";
import { createError } from "./errorHandling";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: number;
    message: string;
    type: string;
  };
  timestamp: string;
}

// Default timeout for external API calls
const DEFAULT_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

/**
 * Creates an axios instance with Firebase-compatible configuration
 */
function createAxiosInstance(baseURL?: string, timeout: number = DEFAULT_TIMEOUT) {
  return axios.create({
    baseURL,
    timeout,
    headers: {
      "User-Agent": "CivicTrace-DecisionGraph/1.0",
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
}

/**
 * Implements exponential backoff retry logic
 */
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delay: number = INITIAL_RETRY_DELAY
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0 && isRetryableError(error)) {
      logger.warn("Retrying failed operation", {
        retriesLeft: retries - 1,
        delay,
        error: error instanceof Error ? error.message : String(error),
      });

      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(operation, retries - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * Determines if an error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    // Retry on network errors or 5xx server errors
    return !error.response || (error.response.status >= 500 && error.response.status < 600);
  }
  return false;
}

/**
 * Makes a GET request to an external API
 */
export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  try {
    validateExternalUrl(url);
    const axiosInstance = createAxiosInstance();

    const response: AxiosResponse<T> = await retryWithBackoff(() => axiosInstance.get(url, config));

    logger.info("GET request successful", {
      url,
      status: response.status,
    });

    return {
      success: true,
      data: response.data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return handleApiError(error, "GET", url);
  }
}

/**
 * Makes a POST request to an external API
 */
export async function post<T>(
  url: string,
  data: unknown,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  try {
    validateExternalUrl(url);
    const axiosInstance = createAxiosInstance();

    const response: AxiosResponse<T> = await retryWithBackoff(() =>
      axiosInstance.post(url, data, config)
    );

    logger.info("POST request successful", {
      url,
      status: response.status,
    });

    return {
      success: true,
      data: response.data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return handleApiError(error, "POST", url);
  }
}

/**
 * Makes a PUT request to an external API
 */
export async function put<T>(
  url: string,
  data: unknown,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  try {
    validateExternalUrl(url);
    const axiosInstance = createAxiosInstance();

    const response: AxiosResponse<T> = await retryWithBackoff(() =>
      axiosInstance.put(url, data, config)
    );

    logger.info("PUT request successful", {
      url,
      status: response.status,
    });

    return {
      success: true,
      data: response.data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return handleApiError(error, "PUT", url);
  }
}

/**
 * Handles API errors with standardized responses
 */
function handleApiError<T>(error: unknown, method: string, url: string): ApiResponse<T> {
  logger.error("API request failed", {
    method,
    url,
    error: error instanceof Error ? error.message : String(error),
  });

  if (axios.isAxiosError(error)) {
    if (error.response) {
      // Server responded with error status
      return {
        success: false,
        error: {
          code: error.response.status,
          message: error.response.data?.message || `Server error: ${error.response.status}`,
          type: "API_ERROR",
        },
        timestamp: new Date().toISOString(),
      };
    } else if (error.request) {
      // Request made but no response received
      return {
        success: false,
        error: {
          code: 503,
          message: "Network error: No response received from server",
          type: "NETWORK_ERROR",
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Default error response
  return {
    success: false,
    error: {
      code: 500,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
      type: "INTERNAL_ERROR",
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Validates external URLs for security
 */
export function validateExternalUrl(url: string): void {
  try {
    const parsedUrl = new URL(url);

    // Only allow HTTPS for external APIs (except localhost for development)
    if (parsedUrl.protocol !== "https:" && !parsedUrl.hostname.includes("localhost")) {
      throw createError(
        "Only HTTPS URLs are allowed for external API calls",
        "URL_VALIDATION_ERROR"
      );
    }

    // Block internal/private IP ranges in production
    const hostname = parsedUrl.hostname;
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("172.")
    ) {
      if (process.env.NODE_ENV === "production") {
        throw createError(
          "Internal/private IP addresses are not allowed in production",
          "URL_VALIDATION_ERROR"
        );
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === "URL_VALIDATION_ERROR") {
      throw error;
    }
    throw createError("Invalid URL format", "URL_VALIDATION_ERROR");
  }
}

export default {
  get,
  post,
  put,
  validateExternalUrl,
};
