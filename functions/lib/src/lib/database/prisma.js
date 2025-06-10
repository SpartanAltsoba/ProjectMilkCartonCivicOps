"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheck = exports.withPrisma = exports.prisma = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("./logger");
class PrismaManager {
    static getInstance() {
        if (!PrismaManager.instance) {
            PrismaManager.instance = new client_1.PrismaClient({
                log: ["query", "info", "warn", "error"],
            });
            // Log queries in development
            if (process.env.NODE_ENV === "development") {
                logger_1.logger.debug("Prisma client initialized");
            }
        }
        return PrismaManager.instance;
    }
    static async disconnect() {
        if (PrismaManager.instance) {
            await PrismaManager.instance.$disconnect();
            logger_1.logger.info("Prisma client disconnected");
        }
    }
}
// Use global variable in development to prevent multiple instances
const prisma = globalThis.prisma || PrismaManager.getInstance();
exports.prisma = prisma;
if (process.env.NODE_ENV !== "production") {
    globalThis.prisma = prisma;
}
// Graceful shutdown
process.on("beforeExit", async () => {
    await PrismaManager.disconnect();
});
process.on("SIGINT", async () => {
    await PrismaManager.disconnect();
    process.exit(0);
});
process.on("SIGTERM", async () => {
    await PrismaManager.disconnect();
    process.exit(0);
});
exports.default = prisma;
// Helper functions for common operations
const withPrisma = async (operation) => {
    try {
        return await operation(prisma);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown database error";
        logger_1.logger.error("Database operation failed", { error: errorMessage });
        throw error;
    }
};
exports.withPrisma = withPrisma;
const healthCheck = async () => {
    try {
        await prisma.$queryRaw `SELECT 1`;
        return true;
    }
    catch (error) {
        logger_1.logger.error("Database health check failed", { error });
        return false;
    }
};
exports.healthCheck = healthCheck;
//# sourceMappingURL=prisma.js.map