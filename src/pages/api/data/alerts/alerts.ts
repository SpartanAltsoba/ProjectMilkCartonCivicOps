import { NextApiRequest, NextApiResponse } from "next";
import { fetchRiskAlerts } from "../../../lib/api";
import withAuth from "../../../middleware/auth";

async function alertsHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const alerts = await fetchRiskAlerts();
    res.status(200).json(alerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
}

export default withAuth(alertsHandler);
