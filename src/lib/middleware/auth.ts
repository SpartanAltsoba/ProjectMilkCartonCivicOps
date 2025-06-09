import { NextApiRequest, NextApiResponse, NextApiHandler } from "next";
import { getSession } from "next-auth/react";
import { logger } from "../lib/logger";

const withAuth = (handler: NextApiHandler) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const session = await getSession({ req });
      if (!session) {
        res.status(401).json({ error: "Unauthorized" });
        logger.warn("Unauthorized access attempt detected");
        return;
      }
      return handler(req, res);
    } catch (error) {
      logger.error("Error in withAuth middleware", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
};

export default withAuth;
