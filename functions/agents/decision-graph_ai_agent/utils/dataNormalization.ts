import { logger } from "../../../lib/logger";

interface NormalizedLocation {
  state: string;
  county: string;
  full: string;
}

class LocationParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LocationParseError";
  }
}

// Map of full state names to abbreviations
const STATE_ABBREVIATIONS: Record<string, string> = {
  alabama: "AL",
  alaska: "AK",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  florida: "FL",
  georgia: "GA",
  hawaii: "HI",
  idaho: "ID",
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  kansas: "KS",
  kentucky: "KY",
  louisiana: "LA",
  maine: "ME",
  maryland: "MD",
  massachusetts: "MA",
  michigan: "MI",
  minnesota: "MN",
  mississippi: "MS",
  missouri: "MO",
  montana: "MT",
  nebraska: "NE",
  nevada: "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  ohio: "OH",
  oklahoma: "OK",
  oregon: "OR",
  pennsylvania: "PA",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  tennessee: "TN",
  texas: "TX",
  utah: "UT",
  vermont: "VT",
  virginia: "VA",
  washington: "WA",
  "west virginia": "WV",
  wisconsin: "WI",
  wyoming: "WY",
};

/**
 * Normalizes a location string into a structured object
 * @param location Raw location string (e.g. "king county, wa" or "King County, Washington")
 * @returns Normalized location object with state abbreviation, county name, and full string
 * @throws LocationParseError if location cannot be parsed
 */
export async function normalizeLocation(location: string): Promise<NormalizedLocation> {
  try {
    if (!location || typeof location !== "string") {
      throw new LocationParseError("Location input is required and must be a string");
    }

    // Sanitize input: remove extra whitespace, convert to lowercase
    const sanitized = location
      .toLowerCase()
      .replace(/[^\w\s,]/g, "") // Remove punctuation except commas
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();

    // Match pattern: "<county> county, <state>"
    const match = sanitized.match(/^(.+?)\s*county,?\s*(.+)$/);
    if (!match) {
      throw new LocationParseError(
        'Invalid location format. Expected format: "<county> county, <state>"'
      );
    }

    const [, countyRaw, stateRaw] = match;

    // Normalize county name: capitalize first letter of each word
    const county = countyRaw
      .trim()
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    // Resolve state abbreviation
    const stateNormalized = stateRaw.trim();
    let stateAbbr: string;

    // Check if it's already a valid 2-letter abbreviation
    if (/^[A-Za-z]{2}$/.test(stateNormalized)) {
      stateAbbr = stateNormalized.toUpperCase();
    } else {
      stateAbbr = STATE_ABBREVIATIONS[stateNormalized];
    }

    if (!stateAbbr) {
      throw new LocationParseError(`Could not resolve state abbreviation for: ${stateRaw}`);
    }

    // Validate state abbreviation exists in our map (as a value)
    if (!Object.values(STATE_ABBREVIATIONS).includes(stateAbbr)) {
      throw new LocationParseError(`Invalid state abbreviation: ${stateAbbr}`);
    }

    const normalized: NormalizedLocation = {
      state: stateAbbr,
      county,
      full: `${county} County, ${stateAbbr}`,
    };

    logger.info("Location normalized successfully", {
      input: location,
      normalized,
    });

    return normalized;
  } catch (error) {
    if (error instanceof LocationParseError) {
      // Re-throw LocationParseError as is
      throw error;
    }

    // Log unexpected errors but throw normalized error
    logger.error("Unexpected error in location normalization", {
      input: location,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    throw new LocationParseError("Failed to parse location. Please check format and try again.");
  }
}

export { NormalizedLocation, LocationParseError };
