import { z } from "zod";
import { logger } from "../logger";

export class ValidationError extends Error {
  constructor(
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class ApiValidator {
  static validateResponse<T>(data: unknown, schema: z.ZodSchema<T>): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error("Response validation failed", error);
        throw new ValidationError("Invalid response format", error.errors);
      }
      throw error;
    }
  }

  static validateRequest<T>(data: unknown, schema: z.ZodSchema<T>): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error("Request validation failed", error);
        throw new ValidationError("Invalid request format", error.errors);
      }
      throw error;
    }
  }

  static createStringSchema(
    options: {
      minLength?: number;
      maxLength?: number;
      pattern?: RegExp;
      required?: boolean;
    } = {}
  ): z.ZodString {
    let schema = z.string();

    if (options.minLength) {
      schema = schema.min(options.minLength);
    }

    if (options.maxLength) {
      schema = schema.max(options.maxLength);
    }

    if (options.pattern) {
      schema = schema.regex(options.pattern);
    }

    return schema;
  }

  static createNumberSchema(
    options: {
      min?: number;
      max?: number;
      integer?: boolean;
      required?: boolean;
    } = {}
  ): z.ZodNumber {
    let schema = z.number();

    if (options.min !== undefined) {
      schema = schema.min(options.min);
    }

    if (options.max !== undefined) {
      schema = schema.max(options.max);
    }

    if (options.integer) {
      schema = schema.int();
    }

    return schema;
  }

  static createArraySchema<T>(
    itemSchema: z.ZodSchema<T>,
    options: {
      minLength?: number;
      maxLength?: number;
      required?: boolean;
    } = {}
  ): z.ZodArray<z.ZodSchema<T>> {
    let schema = z.array(itemSchema);

    if (options.minLength !== undefined) {
      schema = schema.min(options.minLength);
    }

    if (options.maxLength !== undefined) {
      schema = schema.max(options.maxLength);
    }

    return schema;
  }

  static createObjectSchema<T extends z.ZodRawShape>(shape: T) {
    return z.object(shape);
  }
}

// Common validation schemas
export const CommonSchemas = {
  stateCode: z.string().regex(/^[A-Z]{2}$/, "Must be a valid 2-letter state code"),
  email: z.string().email("Must be a valid email address"),
  url: z.string().url("Must be a valid URL"),
  phoneNumber: z.string().regex(/^[+]?[\d\s-()]+$/, "Must be a valid phone number"),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Must be a valid ZIP code"),
  year: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1),
  positiveInteger: z.number().int().positive(),
  nonEmptyString: z.string().min(1, "Cannot be empty"),

  // API response schemas
  apiResponse: <T>(dataSchema: z.ZodSchema<T>) =>
    z.object({
      data: dataSchema,
      metadata: z
        .object({
          timestamp: z.string(),
          requestId: z.string(),
          cached: z.boolean().optional(),
          responseTime: z.number().optional(),
        })
        .optional(),
    }),

  // Error response schema
  apiError: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
    metadata: z
      .object({
        requestId: z.string(),
        timestamp: z.string(),
        endpoint: z.string(),
        statusCode: z.number().optional(),
      })
      .optional(),
  }),
};
