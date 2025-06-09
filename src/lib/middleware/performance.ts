import { Request, Response } from "express";
import { logger } from "../logger";

interface PerformanceMetrics {
  requestId: string;
  path: string;
  method: string;
  statusCode: number;
  duration: number;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
  databaseQueries: number;
  databaseTime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
}

interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private queryMetrics: Map<string, QueryMetrics[]>;
  private readonly SLOW_REQUEST_THRESHOLD = 1000; // 1 second
  private readonly MEMORY_WARNING_THRESHOLD = 0.8; // 80% of available memory

  private constructor() {
    this.queryMetrics = new Map();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  public middleware = async (
    req: Request,
    res: Response,
    next: () => Promise<void>
  ): Promise<void> => {
    const requestStart = process.hrtime();
    const startCpu = process.cpuUsage();
    const requestId = (req as any).requestId || "unknown";

    const initialQueryCount = this.getQueryCount();

    try {
      await next();
    } finally {
      const duration = this.getDurationInMs(requestStart);
      const currentQueryCount = this.getQueryCount();

      const metrics: PerformanceMetrics = {
        requestId,
        path: req.path || "unknown",
        method: req.method || "unknown",
        statusCode: res.statusCode,
        duration,
        timestamp: new Date(),
        userAgent: req.headers["user-agent"] as string | undefined,
        ip: (req.headers["x-forwarded-for"] as string) || req.ip || "unknown",
        databaseQueries: currentQueryCount - initialQueryCount,
        databaseTime: this.getDatabaseTime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(startCpu),
      };

      await this.saveMetrics(metrics);

      if (duration > this.SLOW_REQUEST_THRESHOLD) {
        logger.warn("Slow request detected", {
          path: metrics.path,
          method: metrics.method,
          duration,
          databaseQueries: metrics.databaseQueries,
          databaseTime: metrics.databaseTime,
        });
      }

      this.checkMemoryUsage();

      res.setHeader("X-Response-Time", `${duration}ms`);
      res.setHeader("X-Database-Queries", metrics.databaseQueries.toString());
      res.setHeader("X-Database-Time", `${metrics.databaseTime}ms`);
    }
  };

  private getDurationInMs(start: [number, number]): number {
    const diff = process.hrtime(start);
    return diff[0] * 1000 + diff[1] / 1000000;
  }

  private getQueryCount(): number {
    return Array.from(this.queryMetrics.values()).reduce((acc, metrics) => acc + metrics.length, 0);
  }

  private getDatabaseTime(): number {
    return Array.from(this.queryMetrics.values())
      .flat()
      .reduce((acc, metric) => acc + metric.duration, 0);
  }

  private getMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }

  private getCpuUsage(): NodeJS.CpuUsage {
    return process.cpuUsage();
  }

  private checkMemoryUsage(): void {
    const memUsage = this.getMemoryUsage();
    const heapUsedRatio = memUsage.heapUsed / memUsage.heapTotal;

    if (heapUsedRatio > this.MEMORY_WARNING_THRESHOLD) {
      logger.warn("High memory usage detected", {
        heapUsedPercentage: `${(heapUsedRatio * 100).toFixed(2)}%`,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss,
      });
    }
  }

  private async saveMetrics(metrics: PerformanceMetrics): Promise<void> {
    try {
      // Log metrics instead of saving to database
      logger.info("Performance metrics", {
        requestId: metrics.requestId,
        path: metrics.path,
        method: metrics.method,
        statusCode: metrics.statusCode,
        duration: metrics.duration,
        databaseQueries: metrics.databaseQueries,
        databaseTime: metrics.databaseTime,
        memoryUsage: {
          heapUsed: metrics.memoryUsage.heapUsed,
          heapTotal: metrics.memoryUsage.heapTotal,
          external: metrics.memoryUsage.external,
          rss: metrics.memoryUsage.rss,
        },
        cpuUsage: {
          user: metrics.cpuUsage.user,
          system: metrics.cpuUsage.system,
        },
      });
    } catch (error) {
      logger.error("Failed to log performance metrics", error as Error);
    }
  }

  public trackQuery(requestId: string, query: string, duration: number): void {
    const metrics = this.queryMetrics.get(requestId) || [];
    metrics.push({
      query,
      duration,
      timestamp: new Date(),
    });
    this.queryMetrics.set(requestId, metrics);
  }

  public clearQueryMetrics(requestId: string): void {
    this.queryMetrics.delete(requestId);
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();
export type { PerformanceMetrics, QueryMetrics };
