import { NextApiRequest, NextApiResponse } from "next";
import { logger } from "../lib/logger";

type ApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void;

export const withErrorHandler = (handler: ApiHandler) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error) {
      logger.error("API Error:", error);

      // If headers have already been sent, we can't send another response
      if (res.headersSent) {
        return;
      }

      // Handle specific error types
      if (error instanceof Error) {
        const statusCode = "statusCode" in error ? (error as any).statusCode : 500;
        const message = error.message || "Internal server error";
        return res.status(statusCode).json({ error: message });
      }

      // Generic error response
      return res.status(500).json({ error: "Internal server error" });
    }
  };
};
