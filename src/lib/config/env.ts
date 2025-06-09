import { logger } from "../logger";

// Load environment variables with validation
export const getEnvVar = (name: string, required: boolean = true): string => {
  const value = process.env[name];

  if (!value && required) {
    const error = `Missing required environment variable: ${name}`;
    logger.error(error);
    throw new Error(error);
  }

  return value || "";
};

// Search API Configuration
export const GOOGLE_SEARCH_API_KEY = getEnvVar("GOOGLE_SEARCH_API_KEY");
export const GOOGLE_CSE_ID = getEnvVar("GOOGLE_CSE_ID");

// Validate search configuration
export const validateSearchConfig = (): boolean => {
  try {
    if (!GOOGLE_SEARCH_API_KEY || !GOOGLE_CSE_ID) {
      logger.error("Missing Google Search API configuration");
      return false;
    }
    return true;
  } catch (error) {
    logger.error("Error validating search configuration", { error });
    return false;
  }
};
