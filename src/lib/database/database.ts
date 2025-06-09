import { Pool, PoolClient } from "pg";
import { PrismaClient } from "@prisma/client";
import { logger } from "./logger";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("error", (err: Error) => {
  logger.error("Unexpected error on idle client", err);
  process.exit(-1);
});

interface QueryConfig {
  text: string;
  values?: unknown[];
}

async function query<T = unknown>(queryConfig: QueryConfig): Promise<T[]> {
  const start = Date.now();
  try {
    const res = await pool.query(queryConfig);
    const duration = Date.now() - start;
    logger.info("Executed query", {
      query: queryConfig.text,
      duration,
      rows: res.rowCount,
    });
    return res.rows;
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error("Database query error", error);
    throw err;
  }
}

async function transaction<T = unknown>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function closeConnections(): Promise<void> {
  await Promise.all([prisma.$disconnect(), pool.end()]);
}

process.on("SIGINT", async () => {
  await closeConnections();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await closeConnections();
  process.exit(0);
});

export { prisma, pool, query, transaction, closeConnections };
