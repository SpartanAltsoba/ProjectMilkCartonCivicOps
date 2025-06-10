"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
class Logger {
    logToConsole(level, message, metadata) {
        const timestamp = new Date().toISOString();
        const logEntry = Object.assign({ timestamp,
            level,
            message }, (metadata instanceof Error
            ? { error: { message: metadata.message, stack: metadata.stack } }
            : metadata));
        // In production, you might want to use a proper logging service
        console.log(JSON.stringify(logEntry));
    }
    info(message, metadata) {
        this.logToConsole("info", message, metadata);
    }
    warn(message, metadata) {
        this.logToConsole("warn", message, metadata);
    }
    error(message, error, metadata) {
        if (error instanceof Error) {
            this.logToConsole("error", message, Object.assign({ error: {
                    message: error.message,
                    stack: error.stack,
                } }, metadata));
        }
        else {
            this.logToConsole("error", message, Object.assign(Object.assign({}, error), metadata));
        }
    }
    debug(message, metadata) {
        if (process.env.NODE_ENV !== "production") {
            this.logToConsole("debug", message, metadata);
        }
    }
}
exports.logger = new Logger();
//# sourceMappingURL=logger.js.map