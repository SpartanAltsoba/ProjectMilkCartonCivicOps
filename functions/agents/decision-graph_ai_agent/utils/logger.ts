/**
 * Firebase-compatible logger utility
 * Provides structured logging with error handling and sensitive data protection
 */

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogMetadata {
  [key: string]: unknown;
}

class Logger {
  private static sanitizeMetadata(metadata: LogMetadata): LogMetadata {
    // Remove any sensitive data or PII before logging
    const sanitized = { ...metadata };
    const sensitiveKeys = ["password", "token", "key", "secret", "credential"];

    Object.keys(sanitized).forEach(key => {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = "[REDACTED]";
      }
    });

    return sanitized;
  }

  private static formatMessage(level: LogLevel, message: string, metadata?: LogMetadata): string {
    const timestamp = new Date().toISOString();
    const sanitizedMetadata = metadata ? this.sanitizeMetadata(metadata) : {};

    return JSON.stringify({
      timestamp,
      level,
      message,
      ...sanitizedMetadata,
    });
  }

  static info(message: string, metadata?: LogMetadata): void {
    console.info(this.formatMessage("info", message, metadata));
  }

  static warn(message: string, metadata?: LogMetadata): void {
    console.warn(this.formatMessage("warn", message, metadata));
  }

  static error(message: string, metadata?: LogMetadata): void {
    console.error(this.formatMessage("error", message, metadata));
  }

  static debug(message: string, metadata?: LogMetadata): void {
    if (process.env.NODE_ENV !== "production") {
      console.debug(this.formatMessage("debug", message, metadata));
    }
  }
}

export const logger = Logger;
