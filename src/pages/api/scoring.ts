import { NextApiRequest, NextApiResponse } from "next";
import { runScoringAgent } from "../../../functions/agents/scoring_ai_agent/runScoringAgent";
import { logApiRequest, logError } from "../../middleware/logger";

interface ScoringApiRequest extends NextApiRequest {
  body: {
    location: string;
    metrics?: string[];
  };
}

export default async function handler(req: ScoringApiRequest, res: NextApiResponse) {
  // Log the API request
  logApiRequest(req, res);

  if (req.method !== "POST") {
    return res.status(405).json({
      code: "METHOD_NOT_ALLOWED",
      message: "Only POST method is allowed",
    });
  }

  const { location, metrics } = req.body;

  if (!location) {
    return res.status(400).json({
      code: "INVALID_REQUEST",
      message: "Location parameter is required",
    });
  }

  try {
    const scoringResponse = await runScoringAgent({
      location,
      metrics,
    });

    res.status(200).json(scoringResponse);
  } catch (error) {
    logError(error as Error, { location, metrics });

    const errorResponse = {
      code: "SCORING_FAILED",
      message: error instanceof Error ? error.message : "An unknown error occurred during scoring",
      details: process.env.NODE_ENV === "development" ? error : undefined,
    };

    res.status(500).json(errorResponse);
  }
}
