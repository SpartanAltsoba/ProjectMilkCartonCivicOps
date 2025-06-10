"use strict";
/**
 * Firebase-compatible logger utility
 * Provides structured logging with error handling and sensitive data protection
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
class Logger {
    static sanitizeMetadata(metadata) {
        // Remove any sensitive data or PII before logging
        const sanitized = Object.assign({}, metadata);
        const sensitiveKeys = ["password", "token", "key", "secret", "credential"];
        Object.keys(sanitized).forEach(key => {
            if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
                sanitized[key] = "[REDACTED]";
            }
        });
        return sanitized;
    }
    static formatMessage(level, message, metadata) {
        const timestamp = new Date().toISOString();
        const sanitizedMetadata = metadata ? this.sanitizeMetadata(metadata) : {};
        return JSON.stringify(Object.assign({ timestamp,
            level,
            message }, sanitizedMetadata));
    }
    static info(message, metadata) {
        console.info(this.formatMessage("info", message, metadata));
    }
    static warn(message, metadata) {
        console.warn(this.formatMessage("warn", message, metadata));
    }
    static error(message, metadata) {
        console.error(this.formatMessage("error", message, metadata));
    }
    static debug(message, metadata) {
        if (process.env.NODE_ENV !== "production") {
            console.debug(this.formatMessage("debug", message, metadata));
        }
    }
}
exports.logger = Logger;
//# sourceMappingURL=logger.js.map