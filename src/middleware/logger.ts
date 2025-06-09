import { NextApiRequest, NextApiResponse } from "next";

interface LogData {
  action: string;
  timestamp: string;
  userId?: string;
  details?: any;
}

export function logUserAction(action: string, details?: any) {
  const logData: LogData = {
    action,
    timestamp: new Date().toISOString(),
    details,
  };

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log("[User Action]", logData);
  }

  // TODO: In production, send to logging service or store in database
  return logData;
}

export function logApiRequest(req: NextApiRequest, res: NextApiResponse, details?: any) {
  const logData = {
    method: req.method,
    url: req.url,
    query: req.query,
    body: req.body,
    timestamp: new Date().toISOString(),
    details,
  };

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log("[API Request]", logData);
  }

  // TODO: In production, send to logging service or store in database
  return logData;
}

export function logError(error: Error, context?: any) {
  const logData = {
    error: {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    },
    context,
    timestamp: new Date().toISOString(),
  };

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.error("[Error]", logData);
  }

  // TODO: In production, send to error monitoring service
  return logData;
}
