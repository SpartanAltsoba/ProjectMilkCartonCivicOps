import { NextApiRequest, NextApiResponse } from "next";
import { logger } from "../logger";

interface RateLimitConfig {
  windowMs: number;
  max: number;
  standardHeaders: boolean;
  legacyHeaders: boolean;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
  keyGenerator?: (req: NextApiRequest) => string;
  handler?: (req: NextApiRequest, res: NextApiResponse) => void;
  onLimitReached?: (req: NextApiRequest, res: NextApiResponse) => void;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const defaultConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: (req: NextApiRequest) => {
    return (
      (req.headers["x-forwarded-for"] as string) ||
      (req.headers["x-real-ip"] as string) ||
      req.socket.remoteAddress ||
      "unknown"
    );
  },
  handler: (req: NextApiRequest, res: NextApiResponse) => {
    res.status(429).json({
      error: "Too many requests",
      message: "Rate limit exceeded. Please try again later.",
      retryAfter: Math.ceil(15 * 60), // 15 minutes in seconds
    });
  },
};

export class RateLimiter {
  private config: RateLimitConfig;
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...defaultConfig, ...config };

    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000
    );
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime <= now) {
        delete this.store[key];
      }
    });
  }

  private getKey(req: NextApiRequest): string {
    return this.config.keyGenerator!(req);
  }

  private shouldSkip(req: NextApiRequest, res: NextApiResponse): boolean {
    const statusCode = res.statusCode;

    if (this.config.skipSuccessfulRequests && statusCode >= 200 && statusCode < 300) {
      return true;
    }

    if (this.config.skipFailedRequests && statusCode >= 400) {
      return true;
    }

    return false;
  }

  private setHeaders(
    res: NextApiResponse,
    limit: number,
    remaining: number,
    resetTime: number
  ): void {
    if (this.config.standardHeaders) {
      res.setHeader("X-RateLimit-Limit", limit.toString());
      res.setHeader("X-RateLimit-Remaining", Math.max(0, remaining).toString());
      res.setHeader("X-RateLimit-Reset", Math.ceil(resetTime / 1000).toString());
    }

    if (this.config.legacyHeaders) {
      res.setHeader("X-Rate-Limit-Limit", limit.toString());
      res.setHeader("X-Rate-Limit-Remaining", Math.max(0, remaining).toString());
      res.setHeader("X-Rate-Limit-Reset", Math.ceil(resetTime / 1000).toString());
    }
  }

  middleware = async (req: NextApiRequest, res: NextApiResponse, next: () => Promise<void>) => {
    try {
      const key = this.getKey(req);
      const now = Date.now();
      const resetTime = now + this.config.windowMs;

      // Initialize or get existing record
      if (!this.store[key] || this.store[key].resetTime <= now) {
        this.store[key] = {
          count: 0,
          resetTime,
        };
      }

      const record = this.store[key];
      const remaining = this.config.max - record.count;

      // Set rate limit headers
      this.setHeaders(res, this.config.max, remaining, record.resetTime);

      // Check if limit exceeded
      if (record.count >= this.config.max) {
        logger.warn("Rate limit exceeded", {
          key,
          count: record.count,
          limit: this.config.max,
          method: req.method,
          url: req.url,
        });

        if (this.config.onLimitReached) {
          this.config.onLimitReached(req, res);
        }

        return this.config.handler!(req, res);
      }

      // Increment counter
      record.count++;

      // Continue to next middleware
      await next();

      // Check if we should skip counting this request
      if (this.shouldSkip(req, res)) {
        record.count--;
      }
    } catch (error) {
      logger.error("Rate limiter error:", error as Error);
      // Fail open - allow request to continue
      return next();
    }
  };

  getStatus(req: NextApiRequest): { count: number; remaining: number; resetTime: number } {
    const key = this.getKey(req);
    const record = this.store[key];

    if (!record || record.resetTime <= Date.now()) {
      return {
        count: 0,
        remaining: this.config.max,
        resetTime: Date.now() + this.config.windowMs,
      };
    }

    return {
      count: record.count,
      remaining: Math.max(0, this.config.max - record.count),
      resetTime: record.resetTime,
    };
  }

  reset(req: NextApiRequest): void {
    const key = this.getKey(req);
    delete this.store[key];
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store = {};
  }
}

// Create different rate limiters for different endpoints
export const rateLimiter = new RateLimiter();

export const strictRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes for sensitive endpoints
  handler: (req: NextApiRequest, res: NextApiResponse) => {
    res.status(429).json({
      error: "Rate limit exceeded",
      message: "Too many requests to sensitive endpoint. Please try again later.",
      retryAfter: Math.ceil(15 * 60),
    });
  },
});

export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per 15 minutes
  skipSuccessfulRequests: true, // Don't count successful logins
  handler: (req: NextApiRequest, res: NextApiResponse) => {
    res.status(429).json({
      error: "Too many login attempts",
      message: "Account temporarily locked due to too many failed login attempts.",
      retryAfter: Math.ceil(15 * 60),
    });
  },
  onLimitReached: (req: NextApiRequest, _res: NextApiResponse) => {
    logger.warn("Authentication rate limit exceeded", {
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
      url: req.url,
    });
  },
});

export const createRateLimiter = (config: Partial<RateLimitConfig>) => {
  return new RateLimiter(config);
};
