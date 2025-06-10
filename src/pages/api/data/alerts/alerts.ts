import { NextApiRequest, NextApiResponse } from "next";
import { fetchRiskAlerts } from "../../../../lib/api";
import withAuth from "../../../../lib/middleware/auth";

async function alertsHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Extract query parameters
    const regionId = parseInt(req.query.regionId as string);
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const threshold = req.query.threshold ? parseFloat(req.query.threshold as string) : undefined;

    if (!regionId || isNaN(regionId)) {
      return res.status(400).json({ error: "Valid regionId is required" });
    }

    const alerts = await fetchRiskAlerts({
      regionId,
      startDate,
      endDate,
      threshold,
    });
    res.status(200).json(alerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
}

export default withAuth(alertsHandler);
