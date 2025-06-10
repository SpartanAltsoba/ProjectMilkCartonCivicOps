"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = get;
exports.post = post;
exports.put = put;
exports.validateExternalUrl = validateExternalUrl;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("functions/lib/logger");
const errorHandling_1 = require("./errorHandling");
// Default timeout for external API calls
const DEFAULT_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
/**
 * Creates an axios instance with Firebase-compatible configuration
 */
function createAxiosInstance(baseURL, timeout = DEFAULT_TIMEOUT) {
    return axios_1.default.create({
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
async function retryWithBackoff(operation, retries = MAX_RETRIES, delay = INITIAL_RETRY_DELAY) {
    try {
        return await operation();
    }
    catch (error) {
        if (retries > 0 && isRetryableError(error)) {
            logger_1.logger.warn("Retrying failed operation", {
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
function isRetryableError(error) {
    if (axios_1.default.isAxiosError(error)) {
        // Retry on network errors or 5xx server errors
        return !error.response || (error.response.status >= 500 && error.response.status < 600);
    }
    return false;
}
/**
 * Makes a GET request to an external API
 */
async function get(url, config) {
    try {
        validateExternalUrl(url);
        const axiosInstance = createAxiosInstance();
        const response = await retryWithBackoff(() => axiosInstance.get(url, config));
        logger_1.logger.info("GET request successful", {
            url,
            status: response.status,
        });
        return {
            success: true,
            data: response.data,
            timestamp: new Date().toISOString(),
        };
    }
    catch (error) {
        return handleApiError(error, "GET", url);
    }
}
/**
 * Makes a POST request to an external API
 */
async function post(url, data, config) {
    try {
        validateExternalUrl(url);
        const axiosInstance = createAxiosInstance();
        const response = await retryWithBackoff(() => axiosInstance.post(url, data, config));
        logger_1.logger.info("POST request successful", {
            url,
            status: response.status,
        });
        return {
            success: true,
            data: response.data,
            timestamp: new Date().toISOString(),
        };
    }
    catch (error) {
        return handleApiError(error, "POST", url);
    }
}
/**
 * Makes a PUT request to an external API
 */
async function put(url, data, config) {
    try {
        validateExternalUrl(url);
        const axiosInstance = createAxiosInstance();
        const response = await retryWithBackoff(() => axiosInstance.put(url, data, config));
        logger_1.logger.info("PUT request successful", {
            url,
            status: response.status,
        });
        return {
            success: true,
            data: response.data,
            timestamp: new Date().toISOString(),
        };
    }
    catch (error) {
        return handleApiError(error, "PUT", url);
    }
}
/**
 * Handles API errors with standardized responses
 */
function handleApiError(error, method, url) {
    var _a;
    logger_1.logger.error("API request failed", {
        method,
        url,
        error: error instanceof Error ? error.message : String(error),
    });
    if (axios_1.default.isAxiosError(error)) {
        if (error.response) {
            // Server responded with error status
            return {
                success: false,
                error: {
                    code: error.response.status,
                    message: ((_a = error.response.data) === null || _a === void 0 ? void 0 : _a.message) || `Server error: ${error.response.status}`,
                    type: "API_ERROR",
                },
                timestamp: new Date().toISOString(),
            };
        }
        else if (error.request) {
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
function validateExternalUrl(url) {
    try {
        const parsedUrl = new URL(url);
        // Only allow HTTPS for external APIs (except localhost for development)
        if (parsedUrl.protocol !== "https:" && !parsedUrl.hostname.includes("localhost")) {
            throw (0, errorHandling_1.createError)("Only HTTPS URLs are allowed for external API calls", "URL_VALIDATION_ERROR");
        }
        // Block internal/private IP ranges in production
        const hostname = parsedUrl.hostname;
        if (hostname === "localhost" ||
            hostname === "127.0.0.1" ||
            hostname.startsWith("10.") ||
            hostname.startsWith("192.168.") ||
            hostname.startsWith("172.")) {
            if (process.env.NODE_ENV === "production") {
                throw (0, errorHandling_1.createError)("Internal/private IP addresses are not allowed in production", "URL_VALIDATION_ERROR");
            }
        }
    }
    catch (error) {
        if (error instanceof Error && error.name === "URL_VALIDATION_ERROR") {
            throw error;
        }
        throw (0, errorHandling_1.createError)("Invalid URL format", "URL_VALIDATION_ERROR");
    }
}
exports.default = {
    get,
    post,
    put,
    validateExternalUrl,
};
//# sourceMappingURL=apiUtils.js.map