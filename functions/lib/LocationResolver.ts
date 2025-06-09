import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import { logger } from "./logger";

type LogMetadata = { [key: string]: unknown };

export interface Representative {
  name: string;
  office: string;
  party: string;
  photoUrl?: string;
  urls?: string[];
  phones?: string[];
  emails?: string[];
}

export interface LocationResult {
  state: string;
  county: string;
  city: string;
  levels: string[];
  representatives: Representative[];
  zipCode?: string;
  fullAddress?: string;
}

interface CivicApiResponse {
  normalizedInput?: {
    locationName?: string;
    line1?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  divisions?: {
    [key: string]: {
      name: string;
      officeIndices?: number[];
    };
  };
  offices?: Array<{
    name: string;
    divisionId: string;
    levels?: string[];
    roles?: string[];
    officialIndices?: number[];
  }>;
  officials?: Array<{
    name: string;
    address?: Array<{
      line1?: string;
      city?: string;
      state?: string;
      zip?: string;
    }>;
    party?: string;
    phones?: string[];
    urls?: string[];
    photoUrl?: string;
    emails?: string[];
  }>;
}

interface LocationCache {
  [key: string]: LocationResult;
}

/**
 * Resolves location data from a ZIP code or full address using Google Civic Information API
 * @param input ZIP code or full address string
 * @returns Promise<LocationResult> with state, county, city, levels, and representatives
 */
export async function resolveLocation(input: string): Promise<LocationResult> {
  const apiKey = process.env.GOOGLE_CIVIC_API_KEY;

  if (!apiKey) {
    logger.error("GOOGLE_CIVIC_API_KEY environment variable is not set");
    throw new Error("Google Civic API key is required");
  }

  // Normalize input
  const normalizedInput = input.trim();

  // Check cache first
  const cachedResult = await getCachedLocation(normalizedInput);
  if (cachedResult) {
    logger.info(`Location resolved from cache for input: ${normalizedInput}`);
    return cachedResult;
  }

  try {
    logger.info(`Resolving location for input: ${normalizedInput}`);

    // Call Google Civic Information API
    const response = await axios.get<CivicApiResponse>(
      "https://www.googleapis.com/civicinfo/v2/representatives",
      {
        params: {
          key: apiKey,
          address: normalizedInput,
          includeOffices: true,
          levels: [
            "country",
            "administrativeArea1",
            "administrativeArea2",
            "locality",
            "subLocality1",
          ],
          roles: [
            "headOfGovernment",
            "deputyHeadOfGovernment",
            "headOfState",
            "legislatorUpperBody",
            "legislatorLowerBody",
          ],
        },
        timeout: 10000,
      }
    );

    const result = parseApiResponse(response.data, normalizedInput);

    // Cache the result
    await cacheLocation(normalizedInput, result);

    logger.info(
      `Location successfully resolved: ${result.city}, ${result.county}, ${result.state}`
    );
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Error calling Google Civic Information API:", {
      error: errorMessage,
    } as LogMetadata);

    // Try fallback cache
    const fallbackResult = await getFallbackLocation(normalizedInput);
    if (fallbackResult) {
      logger.info(`Location resolved from fallback cache for input: ${normalizedInput}`);
      return fallbackResult;
    }

    // If all else fails, throw error
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Google Civic API error: ${error.response?.status} - ${error.response?.statusText}`
      );
    }

    throw new Error(`Failed to resolve location: ${errorMessage}`);
  }
}

/**
 * Parses the Google Civic Information API response into our LocationResult format
 */
function parseApiResponse(data: CivicApiResponse, originalInput: string): LocationResult {
  const normalizedInput = data.normalizedInput;
  const divisions = data.divisions || {};
  const offices = data.offices || [];
  const officials = data.officials || [];

  // Extract location components
  let state = "";
  let county = "";
  let city = "";
  const levels: string[] = [];

  // Parse divisions to extract state, county, city
  for (const [divisionId, division] of Object.entries(divisions)) {
    if (divisionId.includes("state:")) {
      const stateMatch = divisionId.match(/state:([a-z]{2})/);
      if (stateMatch) {
        state = getStateNameFromCode(stateMatch[1]);
      }
    }

    if (divisionId.includes("county:") || divisionId.includes("parish:")) {
      county = division.name;
    }

    if (divisionId.includes("place:")) {
      city = division.name;
    }
  }

  // If we couldn't parse from divisions, try normalized input
  if (!state && normalizedInput?.state) {
    state = getStateNameFromCode(normalizedInput.state) || normalizedInput.state;
  }
  if (!city && normalizedInput?.city) {
    city = normalizedInput.city;
  }

  // Extract representatives
  const representatives: Representative[] = [];

  offices.forEach(office => {
    if (office.officialIndices) {
      office.officialIndices.forEach(officialIndex => {
        const official = officials[officialIndex];
        if (official) {
          representatives.push({
            name: official.name,
            office: office.name,
            party: official.party || "Unknown",
            photoUrl: official.photoUrl,
            urls: official.urls,
            phones: official.phones,
            emails: official.emails,
          });
        }
      });
    }

    if (office.levels) {
      levels.push(...office.levels);
    }
  });

  // Remove duplicates from levels
  const uniqueLevels = Array.from(new Set(levels));

  return {
    state: state || "Unknown",
    county: county || "Unknown",
    city: city || "Unknown",
    levels: uniqueLevels,
    representatives,
    zipCode: normalizedInput?.zip,
    fullAddress: normalizedInput
      ? `${normalizedInput.line1 || ""} ${normalizedInput.city || ""} ${normalizedInput.state || ""} ${normalizedInput.zip || ""}`.trim()
      : originalInput,
  };
}

/**
 * Gets cached location result
 */
async function getCachedLocation(input: string): Promise<LocationResult | null> {
  try {
    const cacheFile = path.join(__dirname, "../data/locationCache.json");

    if (!fs.existsSync(cacheFile)) {
      return null;
    }

    const cacheData = fs.readFileSync(cacheFile, "utf8");
    const cache: LocationCache = JSON.parse(cacheData);

    return cache[input] || null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.warn("Error reading location cache:", { error: errorMessage } as LogMetadata);
    return null;
  }
}

/**
 * Caches location result
 */
async function cacheLocation(input: string, result: LocationResult): Promise<void> {
  try {
    const cacheDir = path.join(__dirname, "../data");
    const cacheFile = path.join(cacheDir, "locationCache.json");

    // Ensure directory exists
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    let cache: LocationCache = {};

    // Read existing cache
    if (fs.existsSync(cacheFile)) {
      const cacheData = fs.readFileSync(cacheFile, "utf8");
      cache = JSON.parse(cacheData);
    }

    // Add new entry
    cache[input] = result;

    // Write back to file
    fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.warn("Error writing to location cache:", { error: errorMessage } as LogMetadata);
  }
}

/**
 * Gets fallback location from static cache
 */
async function getFallbackLocation(input: string): Promise<LocationResult | null> {
  try {
    const fallbackFile = path.join(__dirname, "../data/fallbackLocations.json");

    if (!fs.existsSync(fallbackFile)) {
      return null;
    }

    const fallbackData = fs.readFileSync(fallbackFile, "utf8");
    const fallbackCache: LocationCache = JSON.parse(fallbackData);

    // Try exact match first
    if (fallbackCache[input]) {
      return fallbackCache[input];
    }

    // Try ZIP code match if input looks like a ZIP
    if (/^\d{5}(-\d{4})?$/.test(input)) {
      const zipMatch = Object.keys(fallbackCache).find(key => fallbackCache[key].zipCode === input);
      if (zipMatch) {
        return fallbackCache[zipMatch];
      }
    }

    return null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.warn("Error reading fallback location cache:", { error: errorMessage } as LogMetadata);
    return null;
  }
}

/**
 * Converts state code to full state name
 */
function getStateNameFromCode(code: string): string {
  const stateMap: { [key: string]: string } = {
    al: "Alabama",
    ak: "Alaska",
    az: "Arizona",
    ar: "Arkansas",
    ca: "California",
    co: "Colorado",
    ct: "Connecticut",
    de: "Delaware",
    fl: "Florida",
    ga: "Georgia",
    hi: "Hawaii",
    id: "Idaho",
    il: "Illinois",
    in: "Indiana",
    ia: "Iowa",
    ks: "Kansas",
    ky: "Kentucky",
    la: "Louisiana",
    me: "Maine",
    md: "Maryland",
    ma: "Massachusetts",
    mi: "Michigan",
    mn: "Minnesota",
    ms: "Mississippi",
    mo: "Missouri",
    mt: "Montana",
    ne: "Nebraska",
    nv: "Nevada",
    nh: "New Hampshire",
    nj: "New Jersey",
    nm: "New Mexico",
    ny: "New York",
    nc: "North Carolina",
    nd: "North Dakota",
    oh: "Ohio",
    ok: "Oklahoma",
    or: "Oregon",
    pa: "Pennsylvania",
    ri: "Rhode Island",
    sc: "South Carolina",
    sd: "South Dakota",
    tn: "Tennessee",
    tx: "Texas",
    ut: "Utah",
    vt: "Vermont",
    va: "Virginia",
    wa: "Washington",
    wv: "West Virginia",
    wi: "Wisconsin",
    wy: "Wyoming",
    dc: "District of Columbia",
  };

  return stateMap[code.toLowerCase()] || code.toUpperCase();
}

/**
 * Creates sample fallback data for common locations
 */
export async function createFallbackLocationData(): Promise<void> {
  const fallbackData: LocationCache = {
    "98101": {
      state: "Washington",
      county: "King County",
      city: "Seattle",
      levels: ["locality", "administrativeArea1"],
      representatives: [
        { name: "Jay Inslee", office: "Governor", party: "Democratic" },
        { name: "Dow Constantine", office: "County Executive", party: "Nonpartisan" },
      ],
      zipCode: "98101",
    },
    "90210": {
      state: "California",
      county: "Los Angeles County",
      city: "Beverly Hills",
      levels: ["locality", "administrativeArea1"],
      representatives: [
        { name: "Gavin Newsom", office: "Governor", party: "Democratic" },
        { name: "Hilda Solis", office: "County Supervisor", party: "Democratic" },
      ],
      zipCode: "90210",
    },
    "10001": {
      state: "New York",
      county: "New York County",
      city: "New York",
      levels: ["locality", "administrativeArea1"],
      representatives: [
        { name: "Kathy Hochul", office: "Governor", party: "Democratic" },
        { name: "Eric Adams", office: "Mayor", party: "Democratic" },
      ],
      zipCode: "10001",
    },
  };

  const fallbackDir = path.join(__dirname, "../data");
  const fallbackFile = path.join(fallbackDir, "fallbackLocations.json");

  // Ensure directory exists
  if (!fs.existsSync(fallbackDir)) {
    fs.mkdirSync(fallbackDir, { recursive: true });
  }

  fs.writeFileSync(fallbackFile, JSON.stringify(fallbackData, null, 2));
  logger.info("Fallback location data created");
}
