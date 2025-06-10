import { NextApiRequest, NextApiResponse } from "next";
import { securityMiddleware } from "../middleware/security";
import { SimpleCache } from "../cache";

interface CacheOptions {
  enabled: boolean;
  ttl?: number;
  keyGenerator?: (req: NextApiRequest) => string;
}

interface ApiWrapperOptions {
  cache?: CacheOptions;
  security?: boolean;
  compression?: boolean;
}

type ApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void;

const defaultOptions: ApiWrapperOptions = {
  cache: {
    enabled: false,
  },
  security: true,
  compression: true,
};

export function withApiWrapper(
  handler: ApiHandler,
  options: Partial<ApiWrapperOptions> = defaultOptions
) {
  const finalOptions = { ...defaultOptions, ...options };

  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Apply security middleware if enabled
      if (finalOptions.security) {
        const securityPassed = await securityMiddleware(req, res);
        if (!securityPassed) {
          return;
        }
      }

      // Check cache if enabled
      if (finalOptions.cache?.enabled && req.method === "GET") {
        const cacheKey =
          finalOptions.cache.keyGenerator?.(req) || `${req.url}:${JSON.stringify(req.query)}`;

        const cachedData = SimpleCache.get(cacheKey);
        if (cachedData) {
          return res.status(200).json(cachedData);
        }

        // Wrap response methods to intercept and cache the response
        const originalJson = res.json;
        res.json = function (body: any) {
          SimpleCache.set(cacheKey, body, finalOptions.cache?.ttl || 3600);
          return originalJson.call(this, body);
        };
      }

      // Apply compression headers if enabled
      if (finalOptions.compression) {
        res.setHeader("Content-Encoding", "gzip");
        res.setHeader("Vary", "Accept-Encoding");
      }

      // Call the original handler
      return await handler(req, res);
    } catch (error: unknown) {
      console.error("API error:", error);
      const message = error instanceof Error ? error.message : "Internal server error";
      res.status(500).json({ error: message });
    }
  };
}

// Convenience wrapper with default options
export const withSecurity = (handler: ApiHandler) =>
  withApiWrapper(handler, { security: true, compression: false, cache: { enabled: false } });
