import type { NextApiRequest, NextApiResponse } from "next";
import { logger } from "../../../lib/logger";
import { performGoogleSearch } from "../../../lib/search/googleSearch";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { location, scenario } = req.body;
    logger.info("Decision Graph API Request", { location, scenario });

    if (!location || !scenario) {
      logger.error("Missing required parameters", { location, scenario });
      return res.status(400).json({
        error: "Missing required parameters: location and scenario are required",
      });
    }

    // Test CSE Search for Legal Framework
    const legalQuery = `${location} CPS child removal process`;
    logger.info("Performing legal framework search", { query: legalQuery });

    const legalResults = await performGoogleSearch(legalQuery);
    logger.info("Legal framework search results", {
      resultCount: legalResults.results.length,
      results: legalResults.results,
    });

    // Test CSE Search for Agencies
    const agencyQuery = `${location} CPS agency`;
    logger.info("Performing agency search", { query: agencyQuery });

    const agencyResults = await performGoogleSearch(agencyQuery);
    logger.info("Agency search results", {
      resultCount: agencyResults.results.length,
      results: agencyResults.results,
    });

    // Test CSE Search for Contractors
    const contractorQuery = `${location} foster care contractor`;
    logger.info("Performing contractor search", { query: contractorQuery });

    const contractorResults = await performGoogleSearch(contractorQuery);
    logger.info("Contractor search results", {
      resultCount: contractorResults.results.length,
      results: contractorResults.results,
    });

    // Return raw search results for testing
    res.status(200).json({
      rawSearchResults: {
        legal: {
          query: legalQuery,
          results: legalResults.results,
        },
        agencies: {
          query: agencyQuery,
          results: agencyResults.results,
        },
        contractors: {
          query: contractorQuery,
          results: contractorResults.results,
        },
      },
      debug: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Decision Graph API Error", { error });

    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
      debug: { error },
    });
  }
}
