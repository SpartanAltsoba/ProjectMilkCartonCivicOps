import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { withApiWrapper } from "../../../lib/api-wrapper";
import { SimpleCache } from "../../../lib/cache";
import { fetchRiskScores } from "../../../lib/api";

async function riskScoresHandler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res.status(405).json({ error: "Method not allowed" });
    }

    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { state, county } = req.query;

    if (!state || typeof state !== "string") {
      return res.status(400).json({ error: "State parameter is required" });
    }

    // County is optional
    if (county && typeof county !== "string") {
      return res.status(400).json({ error: "County parameter must be a string" });
    }

    const cacheKey = `risk-scores:${state}:${county || "all"}`;
    const cachedData = SimpleCache.get(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const scores = await fetchRiskScores(state, county);

    // Cache the results for 30 minutes
    SimpleCache.set(cacheKey, scores, 30 * 60);

    console.log("Risk scores calculated successfully", {
      state,
      county,
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json(scores);
  } catch (error: unknown) {
    console.error("Error calculating risk scores:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return res.status(500).json({ error: message });
  }
}

export default withApiWrapper(riskScoresHandler, {
  security: true,
  compression: true,
  cache: {
    enabled: true,
    ttl: 30 * 60, // 30 minutes
    keyGenerator: req => `risk-scores:${req.query.state}:${req.query.county || "all"}`,
  },
});
