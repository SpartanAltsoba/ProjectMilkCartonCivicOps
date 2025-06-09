/**
 * Custom application error class for better error handling
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date();
    this.context = context;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to JSON for logging or API responses
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      timestamp: this.timestamp,
      context: this.context,
      stack: this.stack,
    };
  }
}

/**
 * Validation error for input validation failures
 */
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 400, true, context);
  }
}

/**
 * Authentication error for auth failures
 */
export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication failed", context?: Record<string, any>) {
    super(message, 401, true, context);
  }
}

/**
 * Authorization error for permission failures
 */
export class AuthorizationError extends AppError {
  constructor(message: string = "Access denied", context?: Record<string, any>) {
    super(message, 403, true, context);
  }
}

/**
 * Not found error for missing resources
 */
export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found", context?: Record<string, any>) {
    super(message, 404, true, context);
  }
}

/**
 * Rate limit error for too many requests
 */
export class RateLimitError extends AppError {
  constructor(message: string = "Rate limit exceeded", context?: Record<string, any>) {
    super(message, 429, true, context);
  }
}

/**
 * External API error for third-party service failures
 */
export class ExternalAPIError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 502, true, context);
  }
}

/**
 * Database error for database operation failures
 */
export class DatabaseError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 500, true, context);
  }
}
