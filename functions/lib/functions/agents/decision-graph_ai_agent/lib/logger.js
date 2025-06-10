"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
class Logger {
    constructor() {
        this.prefix = "[DecisionGraphAgent]";
    }
    info(message, metadata = {}) {
        console.info(`${this.prefix} ${message}`, metadata);
    }
    warn(message, metadata = {}) {
        console.warn(`${this.prefix} ${message}`, metadata);
    }
    error(message, metadata = {}) {
        console.error(`${this.prefix} ${message}`, metadata);
    }
    debug(message, metadata = {}) {
        if (process.env.NODE_ENV !== "production") {
            console.debug(`${this.prefix} ${message}`, metadata);
        }
    }
}
exports.logger = new Logger();
//# sourceMappingURL=logger.js.map