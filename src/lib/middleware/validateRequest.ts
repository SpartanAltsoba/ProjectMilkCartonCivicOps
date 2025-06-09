import { NextApiRequest, NextApiResponse } from "next";
import { logger } from "../logger";

type ValidationRuleType = "string" | "number" | "boolean" | "array" | "object" | "email" | "url";

interface ValidationRule {
  type: ValidationRuleType;
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => boolean;
  message?: string;
}

interface ValidationSchema {
  [key: string]: ValidationRule;
}

interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  data?: Record<string, unknown>;
}

export class RequestValidator {
  private schema: ValidationSchema;

  constructor(schema: ValidationSchema) {
    this.schema = schema;
  }

  private validateFieldValue(
    field: string,
    value: unknown,
    rule: ValidationRule
  ): ValidationError | null {
    const { type, required, min, max, pattern, custom, message } = rule;

    // Check if field is required
    if (required && (value === undefined || value === null || value === "")) {
      return {
        field,
        message: message || `${field} is required`,
        value,
      };
    }

    // Skip validation if field is not required and empty
    if (!required && (value === undefined || value === null || value === "")) {
      return null;
    }

    // Type validation
    switch (type) {
      case "string":
        if (typeof value !== "string") {
          return {
            field,
            message: message || `${field} must be a string`,
            value,
          };
        }
        if (min !== undefined && value.length < min) {
          return {
            field,
            message: message || `${field} must be at least ${min} characters long`,
            value,
          };
        }
        if (max !== undefined && value.length > max) {
          return {
            field,
            message: message || `${field} must be no more than ${max} characters long`,
            value,
          };
        }
        if (pattern && !pattern.test(value)) {
          return {
            field,
            message: message || `${field} format is invalid`,
            value,
          };
        }
        break;

      case "number": {
        const numValue = typeof value === "string" ? parseFloat(value) : value;
        if (typeof numValue !== "number" || isNaN(numValue)) {
          return {
            field,
            message: message || `${field} must be a valid number`,
            value,
          };
        }
        if (min !== undefined && numValue < min) {
          return {
            field,
            message: message || `${field} must be at least ${min}`,
            value,
          };
        }
        if (max !== undefined && numValue > max) {
          return {
            field,
            message: message || `${field} must be no more than ${max}`,
            value,
          };
        }
        break;
      }

      case "boolean":
        if (typeof value !== "boolean" && value !== "true" && value !== "false") {
          return {
            field,
            message: message || `${field} must be a boolean`,
            value,
          };
        }
        break;

      case "array":
        if (!Array.isArray(value)) {
          return {
            field,
            message: message || `${field} must be an array`,
            value,
          };
        }
        if (min !== undefined && value.length < min) {
          return {
            field,
            message: message || `${field} must have at least ${min} items`,
            value,
          };
        }
        if (max !== undefined && value.length > max) {
          return {
            field,
            message: message || `${field} must have no more than ${max} items`,
            value,
          };
        }
        break;

      case "object":
        if (typeof value !== "object" || Array.isArray(value)) {
          return {
            field,
            message: message || `${field} must be an object`,
            value,
          };
        }
        break;

      case "email": {
        if (typeof value !== "string") {
          return {
            field,
            message: message || `${field} must be a string`,
            value,
          };
        }
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(value)) {
          return {
            field,
            message: message || `${field} must be a valid email address`,
            value,
          };
        }
        break;
      }

      case "url":
        if (typeof value !== "string") {
          return {
            field,
            message: message || `${field} must be a string`,
            value,
          };
        }
        try {
          new URL(value);
        } catch {
          return {
            field,
            message: message || `${field} must be a valid URL`,
            value,
          };
        }
        break;
    }

    // Custom validation
    if (custom && !custom(value)) {
      return {
        field,
        message: message || `${field} failed custom validation`,
        value,
      };
    }

    return null;
  }

  validateBody(data: Record<string, unknown>): ValidationResult {
    const errors: ValidationError[] = [];
    const validatedData: Record<string, unknown> = {};

    for (const [field, rule] of Object.entries(this.schema)) {
      const value = data[field];
      const error = this.validateFieldValue(field, value, rule);

      if (error) {
        errors.push(error);
      } else {
        // Convert types as needed
        if (rule.type === "number" && typeof value === "string") {
          validatedData[field] = parseFloat(value);
        } else if (rule.type === "boolean" && typeof value === "string") {
          validatedData[field] = value === "true";
        } else {
          validatedData[field] = value;
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      data: errors.length === 0 ? validatedData : undefined,
    };
  }

  validateQuery(query: Record<string, string | string[]>): ValidationResult {
    const errors: ValidationError[] = [];
    const validatedData: Record<string, unknown> = {};

    for (const [field, rule] of Object.entries(this.schema)) {
      let value: unknown = query[field];

      // Handle array query parameters
      if (Array.isArray(value)) {
        value = rule.type === "array" ? value : value[0];
      }

      const error = this.validateFieldValue(field, value, rule);

      if (error) {
        errors.push(error);
      } else {
        // Convert types as needed
        if (rule.type === "number" && typeof value === "string") {
          validatedData[field] = parseFloat(value);
        } else if (rule.type === "boolean" && typeof value === "string") {
          validatedData[field] = value === "true";
        } else if (rule.type === "array" && typeof value === "string") {
          validatedData[field] = [value];
        } else {
          validatedData[field] = value;
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      data: errors.length === 0 ? validatedData : undefined,
    };
  }

  middleware = (source: "body" | "query" = "body") => {
    return async (req: NextApiRequest, res: NextApiResponse, next: () => Promise<void>) => {
      try {
        const data = source === "body" ? req.body : req.query;
        const result = source === "body" ? this.validateBody(data) : this.validateQuery(data);

        if (!result.isValid) {
          logger.warn("Request validation failed", {
            method: req.method,
            url: req.url,
            errors: result.errors,
            source,
          });

          return res.status(400).json({
            error: "Validation failed",
            message: "Request data is invalid",
            details: result.errors,
          });
        }

        // Attach validated data to request
        if (source === "body") {
          req.body = result.data;
        } else {
          req.query = result.data as Record<string, string | string[]>;
        }

        await next();
      } catch (error) {
        logger.error("Validation middleware error:", error as Error);
        return res.status(500).json({
          error: "Internal server error",
          message: "Validation failed due to server error",
        });
      }
    };
  };
}

// Utility functions for common validation patterns
export const createValidator = (schema: ValidationSchema) => {
  return new RequestValidator(schema);
};

export const validateRequest = (schema: ValidationSchema, source: "body" | "query" = "body") => {
  const validator = new RequestValidator(schema);
  return validator.middleware(source);
};

// Common validation schemas
export const commonSchemas = {
  pagination: {
    page: { type: "number" as const, min: 1, message: "Page must be a positive number" },
    limit: {
      type: "number" as const,
      min: 1,
      max: 100,
      message: "Limit must be between 1 and 100",
    },
  },
  search: {
    q: {
      type: "string" as const,
      required: true,
      min: 1,
      max: 500,
      message: "Search query is required and must be 1-500 characters",
    },
    sort: {
      type: "string" as const,
      pattern: /^(asc|desc)$/,
      message: 'Sort must be "asc" or "desc"',
    },
  },
  auth: {
    email: { type: "email" as const, required: true, message: "Valid email is required" },
    password: {
      type: "string" as const,
      required: true,
      min: 8,
      message: "Password must be at least 8 characters",
    },
  },
};

// Helper function to combine schemas
export const combineSchemas = (...schemas: ValidationSchema[]): ValidationSchema => {
  return schemas.reduce((combined, schema) => ({ ...combined, ...schema }), {});
};
