interface LogMetadata {
  [key: string]: unknown;
}

class Logger {
  private logToConsole(level: string, message: string, metadata?: LogMetadata | Error) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(metadata instanceof Error
        ? { error: { message: metadata.message, stack: metadata.stack } }
        : metadata),
    };

    // In production, you might want to use a proper logging service
    console.log(JSON.stringify(logEntry));
  }

  info(message: string, metadata?: LogMetadata) {
    this.logToConsole("info", message, metadata);
  }

  warn(message: string, metadata?: LogMetadata) {
    this.logToConsole("warn", message, metadata);
  }

  error(message: string, error?: Error | LogMetadata, metadata?: LogMetadata) {
    if (error instanceof Error) {
      this.logToConsole("error", message, {
        error: {
          message: error.message,
          stack: error.stack,
        },
        ...metadata,
      });
    } else {
      this.logToConsole("error", message, { ...error, ...metadata });
    }
  }

  debug(message: string, metadata?: LogMetadata) {
    if (process.env.NODE_ENV !== "production") {
      this.logToConsole("debug", message, metadata);
    }
  }
}

export const logger = new Logger();
