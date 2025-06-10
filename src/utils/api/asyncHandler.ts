import { NextApiRequest, NextApiResponse } from "next";
import { logger } from "../../lib/logger";

type AsyncApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void>;

export const asyncHandler = (handler: AsyncApiHandler) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error) {
      logger.error("API Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
};
