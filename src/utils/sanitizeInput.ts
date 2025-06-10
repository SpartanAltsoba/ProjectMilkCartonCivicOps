/**
 * Sanitizes input strings to prevent XSS and SQL injection
 * @param input The string to sanitize
 * @returns The sanitized string
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  // Remove any HTML tags
  input = input.replace(/<[^>]*>/g, "");

  // Escape special characters
  input = input
    .replace(/&/g, "&amp;")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");

  // Remove potential SQL injection patterns
  input = input
    .replace(/(\b)(on\S+)(\s*)=/g, "$1_$2$3=") // Remove event handlers
    .replace(/(javascript|vbscript|expression|applet)/gi, "_$1") // Remove dangerous words
    .replace(/sql/gi, "_sql") // Basic SQL injection prevention
    .replace(/--/g, "_--") // SQL comment prevention
    .replace(/;/g, "_"); // Prevent multiple SQL statements

  return input.trim();
}

/**
 * Sanitizes an object by recursively sanitizing all string values
 * @param obj The object to sanitize
 * @returns A new object with all string values sanitized
 */
export function sanitizeObject<T extends object>(obj: T): T {
  const result = {} as T;

  for (const key in obj) {
    const value = obj[key];

    if (typeof value === "string") {
      result[key] = sanitizeInput(value) as T[typeof key];
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map(item =>
        typeof item === "string"
          ? sanitizeInput(item)
          : typeof item === "object"
            ? sanitizeObject(item)
            : item
      ) as T[typeof key];
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Sanitizes and normalizes a state code
 * @param stateCode The state code to sanitize
 * @returns The sanitized state code in uppercase
 */
export function sanitizeStateCode(stateCode: string): string {
  if (!stateCode) return "";

  // First sanitize the input
  const sanitized = sanitizeInput(stateCode);

  // Convert to uppercase and remove any non-alphabetic characters
  return sanitized
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 2);
}

/**
 * Sanitizes and normalizes a county name
 * @param countyName The county name to sanitize
 * @returns The sanitized county name
 */
export function sanitizeCountyName(countyName: string): string {
  if (!countyName) return "";

  // First sanitize the input
  const sanitized = sanitizeInput(countyName);

  // Remove 'County' suffix if present and trim
  return sanitized.replace(/\s+county$/i, "").trim();
}
