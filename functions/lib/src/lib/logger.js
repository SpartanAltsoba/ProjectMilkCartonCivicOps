"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
class Logger {
    constructor() {
        this.logLevel = process.env.LOG_LEVEL || "info";
    }
    shouldLog(level) {
        const levels = ["debug", "info", "warn", "error"];
        const currentLevelIndex = levels.indexOf(this.logLevel);
        const messageLevelIndex = levels.indexOf(level);
        return messageLevelIndex >= currentLevelIndex;
    }
    formatMessage(level, message, data) {
        return Object.assign({ level,
            message, timestamp: new Date().toISOString() }, (data && { data }));
    }
    output(logEntry) {
        if (process.env.NODE_ENV === "development") {
            // Pretty print for development
            console.log(`[${logEntry.timestamp}] ${logEntry.level.toUpperCase()}: ${logEntry.message}`);
            if (logEntry.data) {
                console.log("Data:", logEntry.data);
            }
            if (logEntry.error) {
                console.error("Error:", logEntry.error);
            }
        }
        else {
            // JSON format for production
            console.log(JSON.stringify(logEntry));
        }
    }
    info(message, data) {
        if (this.shouldLog("info")) {
            const logEntry = this.formatMessage("info", message, data);
            this.output(logEntry);
        }
    }
    warn(message, data) {
        if (this.shouldLog("warn")) {
            const logEntry = this.formatMessage("warn", message, data);
            this.output(logEntry);
        }
    }
    error(message, error, data) {
        if (this.shouldLog("error")) {
            const logData = Object.assign({}, (data || {}));
            if (error instanceof Error) {
                logData.errorDetails = {
                    name: error.name,
                    message: error.message,
                    stack: error.stack,
                };
            }
            else if (error) {
                logData.error = error;
            }
            const logEntry = this.formatMessage("error", message, logData);
            this.output(logEntry);
        }
    }
    debug(message, data) {
        if (this.shouldLog("debug")) {
            const logEntry = this.formatMessage("debug", message, data);
            this.output(logEntry);
        }
    }
    // Utility method for API request logging
    logApiRequest(req, additionalData) {
        var _a, _b, _c;
        const requestData = Object.assign({ method: req.method, url: req.url, userAgent: (_a = req.headers) === null || _a === void 0 ? void 0 : _a["user-agent"], ip: ((_b = req.headers) === null || _b === void 0 ? void 0 : _b["x-forwarded-for"]) || ((_c = req.headers) === null || _c === void 0 ? void 0 : _c["x-real-ip"]) }, (additionalData || {}));
        this.info("API Request", requestData);
    }
    // Utility method for API response logging
    logApiResponse(statusCode, duration, additionalData) {
        const responseData = Object.assign(Object.assign({ statusCode }, (duration !== undefined && { duration: `${duration}ms` })), (additionalData || {}));
        this.info("API Response", responseData);
    }
    // Utility method for performance logging
    logPerformance(operation, duration, additionalData) {
        const performanceData = Object.assign({ operation, duration: `${duration}ms` }, (additionalData || {}));
        this.info("Performance", performanceData);
    }
}
// Create singleton instance
exports.logger = new Logger();
//# sourceMappingURL=logger.js.map