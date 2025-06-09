import { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "../../middleware/withAuth";
import { withErrorHandler } from "../../middleware/withErrorHandler";
import { fetchRiskAlerts } from "../../lib/api/riskAlerts";
import { RiskAlertParams } from "../../lib/interfaces/RiskAlertParams";

const handler = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { regionId, startDate, endDate, threshold } = req.query;

  if (!regionId) {
    res.status(400).json({ error: "regionId is required" });
    return;
  }

  const params: RiskAlertParams = {
    regionId: parseInt(regionId as string),
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
    threshold: threshold ? parseFloat(threshold as string) : undefined,
  };

  try {
    const alerts = await fetchRiskAlerts(params);
    res.status(200).json({ alerts });
  } catch (error) {
    res.status(500).json({ error: "Error fetching risk alerts" });
  }
};

export default withAuth(withErrorHandler(handler));
