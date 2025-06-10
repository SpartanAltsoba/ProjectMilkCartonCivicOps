import { NextApiRequest, NextApiResponse } from "next";
import { logger } from "../lib/logger";

type AsyncApiHandler = (
  req: NextApiRequest,
  res: NextApiResponse
) => Promise<void | NextApiResponse>;

export const asyncHandler = (handler: AsyncApiHandler) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error) {
      logger.error("API Error:", error);
      const message = error instanceof Error ? error.message : "Internal server error";
      const statusCode =
        error instanceof Error && "statusCode" in error ? (error as any).statusCode : 500;

      if (!res.headersSent) {
        res.status(statusCode).json({ error: message });
      }
    }
  };
};
