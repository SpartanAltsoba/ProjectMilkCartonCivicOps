export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const createError = (statusCode: number, message: string, code?: string) => {
  return new ApiError(statusCode, message, code);
};

import { NextApiRequest, NextApiResponse } from "next";

type ApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void;

export const withErrorHandler = (handler: ApiHandler) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error("API Error:", error);

      if (res.headersSent) {
        return;
      }

      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
          error: error.message,
          code: error.code,
        });
      }

      return res.status(500).json({
        error: "Internal server error",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  };
};
