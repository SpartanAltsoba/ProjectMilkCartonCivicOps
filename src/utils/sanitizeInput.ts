/**
 * Sanitizes user input to prevent injection attacks and normalize data
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  return input
    .trim()
    .replace(/[<>'"&]/g, "") // Remove potentially dangerous characters
    .replace(/\s+/g, " ") // Normalize whitespace
    .substring(0, 100); // Limit length
}

/**
 * Sanitizes and validates state code
 */
export function sanitizeStateCode(state: string): string {
  const sanitized = sanitizeInput(state).toUpperCase();

  // Validate it's a 2-letter state code
  if (!/^[A-Z]{2}$/.test(sanitized)) {
    throw new Error("Invalid state code format");
  }

  return sanitized;
}

/**
 * Sanitizes county name
 */
export function sanitizeCountyName(county: string): string {
  const sanitized = sanitizeInput(county);

  // Remove "county" suffix if present and normalize
  return sanitized
    .replace(/\s+county\s*$/i, "")
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
