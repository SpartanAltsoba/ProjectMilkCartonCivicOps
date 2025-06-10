import { logger } from "../../../lib/logger";

export class InputValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InputValidationError";
  }
}

/**
 * Validates that required environment variables are present
 */
export function validateEnvironment(requiredVars: string[]): void {
  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    throw new InputValidationError(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

interface ApiErrorResponse {
  success: false;
  error: {
    code: number;
    message: string;
    type: string;
  };
  timestamp: string;
}

interface ErrorMetadata {
  requestId?: string;
  userId?: string;
  location?: string;
  scenario?: string;
  stackTrace?: string;
}

/**
 * Handles API errors with proper status codes and user-safe messages
 */
export function handleApiError(
  res: { status: (code: number) => { json: (data: any) => void } },
  err: unknown,
  metadata?: ErrorMetadata
): void {
  const timestamp = new Date().toISOString();
  let statusCode = 500;
  let errorType = "INTERNAL_ERROR";
  let userMessage = "An internal error occurred. Please try again later.";

  // Determine error type and appropriate response
  if (err instanceof Error) {
    const errorMessage = err.message.toLowerCase();

    // Input validation errors (400)
    if (
      errorMessage.includes("invalid") ||
      errorMessage.includes("required") ||
      errorMessage.includes("format") ||
      errorMessage.includes("parse")
    ) {
      statusCode = 400;
      errorType = "INPUT_ERROR";
      userMessage = "Invalid input provided. Please check your request and try again.";
    }

    // Not found errors (404)
    else if (
      errorMessage.includes("not found") ||
      errorMessage.includes("no results") ||
      errorMessage.includes("missing")
    ) {
      statusCode = 404;
      errorType = "NOT_FOUND";
      userMessage = "The requested resource could not be found.";
    }

    // Semantic/processing errors (422)
    else if (
      errorMessage.includes("cannot process") ||
      errorMessage.includes("unable to determine") ||
      errorMessage.includes("semantic") ||
      errorMessage.includes("mismatch")
    ) {
      statusCode = 422;
      errorType = "PROCESSING_ERROR";
      userMessage = "Unable to process the request. Please verify your input and try again.";
    }

    // Rate limiting or quota errors (429)
    else if (
      errorMessage.includes("rate limit") ||
      errorMessage.includes("quota") ||
      errorMessage.includes("too many requests")
    ) {
      statusCode = 429;
      errorType = "RATE_LIMIT_ERROR";
      userMessage = "Too many requests. Please wait a moment and try again.";
    }

    // External service errors (502/503)
    else if (
      errorMessage.includes("api error") ||
      errorMessage.includes("service unavailable") ||
      errorMessage.includes("timeout")
    ) {
      statusCode = 503;
      errorType = "SERVICE_ERROR";
      userMessage = "External service temporarily unavailable. Please try again later.";
    }
  }

  // Log error details internally (with full stack trace)
  const logMetadata = {
    ...metadata,
    errorType,
    statusCode,
    originalError: err instanceof Error ? err.message : String(err),
    stackTrace: err instanceof Error ? err.stack : undefined,
  };

  logger.error("API error occurred", logMetadata);

  // Send user-safe response
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code: statusCode,
      message: userMessage,
      type: errorType,
    },
    timestamp,
  };

  res.status(statusCode).json(response);
}

/**
 * Handles specific location parsing errors
 */
export function handleLocationError(
  res: { status: (code: number) => { json: (data: any) => void } },
  err: unknown,
  location?: string
): void {
  logger.error("Location parsing error", {
    location,
    error: err instanceof Error ? err.message : String(err),
  });

  const response: ApiErrorResponse = {
    success: false,
    error: {
      code: 400,
      message: 'Invalid location format. Please use format: "County Name, State"',
      type: "LOCATION_ERROR",
    },
    timestamp: new Date().toISOString(),
  };

  res.status(400).json(response);
}

/**
 * Handles search-related errors
 */
export function handleSearchError(
  res: { status: (code: number) => { json: (data: any) => void } },
  err: unknown,
  query?: string
): void {
  logger.error("Search error", {
    query,
    error: err instanceof Error ? err.message : String(err),
  });

  const response: ApiErrorResponse = {
    success: false,
    error: {
      code: 503,
      message: "Search service temporarily unavailable. Please try again later.",
      type: "SEARCH_ERROR",
    },
    timestamp: new Date().toISOString(),
  };

  res.status(503).json(response);
}

/**
 * Handles diagram generation errors
 */
export function handleDiagramError(
  res: { status: (code: number) => { json: (data: any) => void } },
  err: unknown,
  scenario?: string
): void {
  logger.error("Diagram generation error", {
    scenario,
    error: err instanceof Error ? err.message : String(err),
  });

  const response: ApiErrorResponse = {
    success: false,
    error: {
      code: 422,
      message: "Unable to generate diagram for the provided scenario.",
      type: "DIAGRAM_ERROR",
    },
    timestamp: new Date().toISOString(),
  };

  res.status(422).json(response);
}

/**
 * Creates a standardized error for throwing
 */
export function createError(message: string, type: string = "GENERAL_ERROR"): Error {
  const error = new Error(message);
  error.name = type;
  return error;
}

/**
 * Validates that required fields are present
 */
export function validateRequired(data: Record<string, any>, requiredFields: string[]): void {
  const missing = requiredFields.filter(field => !data[field]);

  if (missing.length > 0) {
    throw createError(`Missing required fields: ${missing.join(", ")}`, "VALIDATION_ERROR");
  }
}

export type { ApiErrorResponse, ErrorMetadata };
