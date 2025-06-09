import { z, ZodError } from "zod";
import { NextApiRequest, NextApiResponse } from "next";
import { logger } from "./logger";

// Common validation schemas
const stateSchema = z.string().min(2).max(50);
const countySchema = z.string().min(1).max(100).optional();
const searchTermSchema = z.string().min(1).max(500);
const sourceSchema = z
  .enum(["all", "local", "google", "cpsAgency", "decisionChain"])
  .default("all");

// Request validation schemas
const riskScoresQuerySchema = z.object({
  state: stateSchema,
  county: countySchema,
});

const searchQuerySchema = z.object({
  term: searchTermSchema,
  state: stateSchema.optional(),
  county: countySchema,
  source: sourceSchema,
  cpsAgencyId: z.string().optional(),
  detailedDecisionChain: z.string().optional(),
});

// Validation helper function
function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown, res: NextApiResponse): T | null {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join(".")}: ${err.message}`);
      logger.warn("Request validation failed", {
        errors: errorMessages,
        data,
      });
      res.status(400).json({
        error: "Validation failed",
        details: errorMessages,
      });
    } else {
      logger.error(
        "Unexpected validation error",
        error instanceof Error ? error : new Error(String(error))
      );
      res.status(500).json({ error: "Internal server error" });
    }
    return null;
  }
}

// HTTP method validation
function validateMethod(
  req: NextApiRequest,
  res: NextApiResponse,
  allowedMethods: string[]
): boolean {
  if (!req.method || !allowedMethods.includes(req.method)) {
    res.setHeader("Allow", allowedMethods);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    return false;
  }
  return true;
}

// Session validation helper
function validateSession(session: any, res: NextApiResponse): boolean {
  if (!session) {
    res.status(401).json({ error: "Authentication required" });
    return false;
  }
  return true;
}

export {
  stateSchema,
  countySchema,
  searchTermSchema,
  sourceSchema,
  riskScoresQuerySchema,
  searchQuerySchema,
  validateRequest,
  validateMethod,
  validateSession,
};
