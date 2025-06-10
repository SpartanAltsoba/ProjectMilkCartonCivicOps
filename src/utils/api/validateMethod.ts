import { NextApiRequest, NextApiResponse } from "next";
import { logger } from "../../lib/logger";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export const validateMethod = (allowedMethods: HttpMethod[]) => {
  return (req: NextApiRequest, res: NextApiResponse): boolean => {
    if (!req.method || !allowedMethods.includes(req.method as HttpMethod)) {
      logger.warn(`Invalid HTTP method: ${req.method}`, {
        allowedMethods,
        path: req.url,
      });

      res.setHeader("Allow", allowedMethods);
      res.status(405).json({
        error: `Method ${req.method} Not Allowed`,
        allowedMethods,
      });
      return false;
    }
    return true;
  };
};
