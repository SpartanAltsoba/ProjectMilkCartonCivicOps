"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiClient = exports.API_CONFIGS = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("./logger");
exports.API_CONFIGS = {
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
class ApiClient {
    constructor(config) {
        var _a;
        this.config = config;
        this.retryCount = 0;
        this.retryDelay = ((_a = this.config.retryConfig) === null || _a === void 0 ? void 0 : _a.initialDelayMs) || 1000;
        this.axiosInstance = axios_1.default.create({
            baseURL: config.baseURL,
            timeout: config.timeout || 30000,
            headers: config.headers || {},
        });
        this.setupInterceptors();
    }
    setupInterceptors() {
        this.axiosInstance.interceptors.request.use(config => {
            const requestId = Math.random().toString(36).substring(7);
            logger_1.logger.info("API request started", {
                requestId,
                endpoint: config.url,
                method: config.method,
            });
            return config;
        }, error => {
            logger_1.logger.error("Request interceptor error", error);
            return Promise.reject(error);
        });
        this.axiosInstance.interceptors.response.use(response => {
            logger_1.logger.info("API request completed", {
                endpoint: response.config.url,
                status: response.status,
            });
            return response;
        }, async (error) => {
            var _a, _b, _c, _d;
            if (!error.config) {
                logger_1.logger.error("Response error without config", error);
                return Promise.reject(error);
            }
            const shouldRetry = this.shouldRetry(error);
            const maxRetries = ((_a = this.config.retryConfig) === null || _a === void 0 ? void 0 : _a.maxRetries) || 3;
            if (shouldRetry && this.retryCount < maxRetries) {
                this.retryCount++;
                const delay = Math.min(this.retryDelay * (((_b = this.config.retryConfig) === null || _b === void 0 ? void 0 : _b.backoffFactor) || 2), ((_c = this.config.retryConfig) === null || _c === void 0 ? void 0 : _c.maxDelayMs) || 10000);
                logger_1.logger.warn("Retrying failed request", {
                    endpoint: error.config.url,
                    attempt: this.retryCount,
                    delay,
                });
                await new Promise(resolve => setTimeout(resolve, delay));
                this.retryDelay = delay;
                return this.axiosInstance.request(error.config);
            }
            logger_1.logger.error("Response error", {
                endpoint: error.config.url,
                error: error.message,
                status: (_d = error.response) === null || _d === void 0 ? void 0 : _d.status,
            });
            return Promise.reject(error);
        });
    }
    shouldRetry(error) {
        var _a;
        if (!error.config)
            return false;
        // Don't retry on client errors (except 429 - rate limit)
        if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) && error.response.status !== 429 && error.response.status < 500) {
            return false;
        }
        // Retry on network errors, 5xx responses, and rate limits
        return !error.response || error.response.status >= 500 || error.response.status === 429;
    }
    async get(endpoint, config) {
        const response = await this.axiosInstance.get(endpoint, config);
        return response.data;
    }
    async post(endpoint, data, config) {
        const response = await this.axiosInstance.post(endpoint, data, config);
        return response.data;
    }
    async put(endpoint, data, config) {
        const response = await this.axiosInstance.put(endpoint, data, config);
        return response.data;
    }
    async delete(endpoint, config) {
        const response = await this.axiosInstance.delete(endpoint, config);
        return response.data;
    }
    async patch(endpoint, data, config) {
        const response = await this.axiosInstance.patch(endpoint, data, config);
        return response.data;
    }
}
exports.ApiClient = ApiClient;
//# sourceMappingURL=apiClient.js.map