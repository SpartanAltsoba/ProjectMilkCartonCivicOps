import { NextApiRequest, NextApiResponse } from "next";
import { logger } from "../lib/logger";

export interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    id: string;
    email: string;
  };
}

type AuthenticatedHandler = (
  req: AuthenticatedRequest,
  res: NextApiResponse
) => Promise<void> | void;

export const withAuth = (handler: AuthenticatedHandler) => {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      // For now, we'll skip actual authentication and just pass through
      // In a real implementation, you would verify JWT tokens, sessions, etc.
      logger.info("Auth middleware - skipping authentication for development");

      // Mock user for development
      req.user = {
        id: "dev-user",
        email: "dev@example.com",
      };

      return handler(req, res);
    } catch (error) {
      logger.error("Authentication error:", error);
      return res.status(401).json({ error: "Unauthorized" });
    }
  };
};
