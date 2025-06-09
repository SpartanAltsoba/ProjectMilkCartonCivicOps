type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: Record<string, unknown>;
  error?: Error;
}

class Logger {
  private logLevel: LogLevel;

  constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || "info";
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ["debug", "info", "warn", "error"];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(data && { data }),
    };
  }

  private output(logEntry: LogEntry): void {
    if (process.env.NODE_ENV === "development") {
      // Pretty print for development
      console.log(`[${logEntry.timestamp}] ${logEntry.level.toUpperCase()}: ${logEntry.message}`);
      if (logEntry.data) {
        console.log("Data:", logEntry.data);
      }
      if (logEntry.error) {
        console.error("Error:", logEntry.error);
      }
    } else {
      // JSON format for production
      console.log(JSON.stringify(logEntry));
    }
  }

  info(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog("info")) {
      const logEntry = this.formatMessage("info", message, data);
      this.output(logEntry);
    }
  }

  warn(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog("warn")) {
      const logEntry = this.formatMessage("warn", message, data);
      this.output(logEntry);
    }
  }

  error(message: string, error?: Error | unknown, data?: Record<string, unknown>): void {
    if (this.shouldLog("error")) {
      const logData: Record<string, unknown> = { ...(data || {}) };

      if (error instanceof Error) {
        logData.errorDetails = {
          name: error.name,
          message: error.message,
          stack: error.stack,
        };
      } else if (error) {
        logData.error = error;
      }

      const logEntry = this.formatMessage("error", message, logData);
      this.output(logEntry);
    }
  }

  debug(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog("debug")) {
      const logEntry = this.formatMessage("debug", message, data);
      this.output(logEntry);
    }
  }

  // Utility method for API request logging
  logApiRequest(
    req: {
      method?: string;
      url?: string;
      headers?: Record<string, unknown>;
    },
    additionalData?: Record<string, unknown>
  ): void {
    const requestData: Record<string, unknown> = {
      method: req.method,
      url: req.url,
      userAgent: req.headers?.["user-agent"],
      ip: req.headers?.["x-forwarded-for"] || req.headers?.["x-real-ip"],
      ...(additionalData || {}),
    };

    this.info("API Request", requestData);
  }

  // Utility method for API response logging
  logApiResponse(
    statusCode: number,
    duration?: number,
    additionalData?: Record<string, unknown>
  ): void {
    const responseData: Record<string, unknown> = {
      statusCode,
      ...(duration !== undefined && { duration: `${duration}ms` }),
      ...(additionalData || {}),
    };

    this.info("API Response", responseData);
  }

  // Utility method for performance logging
  logPerformance(
    operation: string,
    duration: number,
    additionalData?: Record<string, unknown>
  ): void {
    const performanceData: Record<string, unknown> = {
      operation,
      duration: `${duration}ms`,
      ...(additionalData || {}),
    };

    this.info("Performance", performanceData);
  }
}

// Create singleton instance
export const logger = new Logger();

// Export types for use in other modules
export type { LogEntry, LogLevel };
