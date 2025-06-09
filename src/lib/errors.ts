import { logger } from "./logger";

export enum ErrorCode {
  // Authentication Errors (1xxx)
  UNAUTHORIZED = 1001,
  INVALID_TOKEN = 1002,
  TOKEN_EXPIRED = 1003,
  INSUFFICIENT_PERMISSIONS = 1004,

  // Validation Errors (2xxx)
  INVALID_INPUT = 2001,
  MISSING_REQUIRED_FIELD = 2002,
  INVALID_FORMAT = 2003,

  // Resource Errors (3xxx)
  NOT_FOUND = 3001,
  ALREADY_EXISTS = 3002,
  CONFLICT = 3003,

  // External Service Errors (4xxx)
  API_ERROR = 4001,
  SERVICE_UNAVAILABLE = 4002,
  RATE_LIMIT_EXCEEDED = 4003,

  // Database Errors (5xxx)
  DATABASE_ERROR = 5001,
  TRANSACTION_FAILED = 5002,
  CONSTRAINT_VIOLATION = 5003,

  // System Errors (9xxx)
  INTERNAL_ERROR = 9001,
  NOT_IMPLEMENTED = 9002,
  CONFIGURATION_ERROR = 9003,
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any>;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(ErrorCode.INVALID_INPUT, message, 400, true, context);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(ErrorCode.UNAUTHORIZED, message, 401, true, context);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(ErrorCode.NOT_FOUND, message, 404, true, context);
  }
}

export class ApiError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(ErrorCode.API_ERROR, message, 502, true, context);
  }
}

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

export class ErrorHandler {
  private static sanitizeError(error: Error | AppError): ErrorResponse {
    if (error instanceof AppError) {
      // For known application errors, return structured error response
      const response: ErrorResponse = {
        error: {
          code: ErrorCode[error.code],
          message: error.message,
        },
      };

      // Only include safe context information in non-production environments
      if (process.env.NODE_ENV !== "production" && error.context) {
        response.error.details = error.context;
      }

      return response;
    }

    // For unknown errors, return a generic error message in production
    return {
      error: {
        code: ErrorCode[ErrorCode.INTERNAL_ERROR],
        message:
          process.env.NODE_ENV === "production" ? "An unexpected error occurred" : error.message,
      },
    };
  }

  public static async handleError(error: Error | AppError): Promise<ErrorResponse> {
    // Log the error with full context for debugging
    await logger.error(error.message, error, error instanceof AppError ? error.context : undefined);

    // Return sanitized error response
    return this.sanitizeError(error);
  }

  public static isTrustedError(error: Error): boolean {
    return error instanceof AppError && error.isOperational;
  }
}

// Example usage:
/*
try {
  // Some operation that might fail
  throw new ValidationError('Invalid email format', { email: 'test@' });
} catch (error) {
  const errorResponse = await ErrorHandler.handleError(error);
  // Use errorResponse in API response
}
*/
