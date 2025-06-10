import { PrismaClient } from "@prisma/client";
import { logger } from "../logger";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

class PrismaManager {
  private static instance: PrismaClient;

  static getInstance(): PrismaClient {
    if (!PrismaManager.instance) {
      PrismaManager.instance = new PrismaClient({
        log: ["query", "info", "warn", "error"],
      });

      // Log queries in development
      if (process.env.NODE_ENV === "development") {
        logger.debug("Prisma client initialized");
      }
    }

    return PrismaManager.instance;
  }

  static async disconnect(): Promise<void> {
    if (PrismaManager.instance) {
      await PrismaManager.instance.$disconnect();
      logger.info("Prisma client disconnected");
    }
  }
}

// Use global variable in development to prevent multiple instances
const prisma = globalThis.prisma || PrismaManager.getInstance();

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

export { prisma };
export default prisma;

// Helper functions for common operations
export const withPrisma = async <T>(
  operation: (prisma: PrismaClient) => Promise<T>
): Promise<T> => {
  try {
    return await operation(prisma);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown database error";
    logger.error("Database operation failed", { error: errorMessage });
    throw error;
  }
};

export const healthCheck = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error("Database health check failed", { error });
    return false;
  }
};
