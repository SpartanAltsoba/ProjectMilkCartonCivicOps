import { NextApiRequest, NextApiResponse } from "next";
import { ErrorHandler, AppError } from "../errors";
import { logger } from "../logger";

type ApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void>;

export function withErrorHandler(handler: ApiHandler): ApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error: any) {
      // Log request details for context
      const requestDetails = {
        method: req.method,
        url: req.url,
        query: req.query,
        headers: {
          ...req.headers,
          // Remove sensitive headers
          authorization: req.headers.authorization ? "[REDACTED]" : undefined,
          cookie: req.headers.cookie ? "[REDACTED]" : undefined,
        },
      };

      // Handle the error
      const errorResponse = await ErrorHandler.handleError(error);

      // Add request context to logging
      await logger.error("API Error", error, {
        ...errorResponse,
        request: requestDetails,
      });

      // Set appropriate status code
      const statusCode = error instanceof AppError ? error.statusCode : 500;

      // Send error response
      res.status(statusCode).json(errorResponse);
    }
  };
}

// Example usage:
/*
export default withErrorHandler(async function handler(req, res) {
  // Your API route logic here
  // Any errors thrown will be properly handled
});
*/
