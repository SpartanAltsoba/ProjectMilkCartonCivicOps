/**
 * Sanitizes input strings to prevent XSS and injection attacks
 * @param input The input string to sanitize
 * @returns The sanitized string
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  // Remove any HTML tags
  let sanitized = input.replace(/<[^>]*>/g, "");

  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/[<>{}[\]\\]/g, "");

  // Trim whitespace
  sanitized = sanitized.trim();

  // Limit length
  const MAX_LENGTH = 256;
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH);
  }

  // Encode special characters
  sanitized = encodeURIComponent(sanitized);

  return sanitized;
}

/**
 * Validates if a string contains only safe characters
 * @param input The input string to validate
 * @returns True if the string is safe, false otherwise
 */
export function validateSafeString(input: string): boolean {
  if (!input || typeof input !== "string") {
    return false;
  }

  // Check for potentially dangerous characters
  const dangerousChars = /[<>{}[\]\\]/;
  if (dangerousChars.test(input)) {
    return false;
  }

  // Check length
  if (input.length > 256) {
    return false;
  }

  return true;
}
