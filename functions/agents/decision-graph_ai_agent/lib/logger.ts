interface LogMetadata {
  [key: string]: unknown;
}

class Logger {
  private prefix = "[DecisionGraphAgent]";

  info(message: string, metadata: LogMetadata = {}): void {
    console.info(`${this.prefix} ${message}`, metadata);
  }

  warn(message: string, metadata: LogMetadata = {}): void {
    console.warn(`${this.prefix} ${message}`, metadata);
  }

  error(message: string, metadata: LogMetadata = {}): void {
    console.error(`${this.prefix} ${message}`, metadata);
  }

  debug(message: string, metadata: LogMetadata = {}): void {
    if (process.env.NODE_ENV !== "production") {
      console.debug(`${this.prefix} ${message}`, metadata);
    }
  }
}

export const logger = new Logger();
export type { LogMetadata };
