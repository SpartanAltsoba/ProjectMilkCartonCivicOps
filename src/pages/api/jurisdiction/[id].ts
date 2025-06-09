import { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "../../../middleware/withAuth";
import { withErrorHandler } from "../../../middleware/withErrorHandler";
import { getJurisdictionDetails } from "../../../lib/api/riskAlerts";
import { JurisdictionDetails } from "../../../types/jurisdiction";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: "Invalid jurisdiction ID" });
  }

  const jurisdictionId = parseInt(id as string, 10);

  if (isNaN(jurisdictionId)) {
    return res.status(400).json({ error: "Jurisdiction ID must be a number" });
  }

  try {
    const details: JurisdictionDetails = await getJurisdictionDetails(jurisdictionId);
    return res.status(200).json(details);
  } catch (error) {
    console.error(`Failed to get jurisdiction details for ID: ${jurisdictionId}`, error);
    return res.status(500).json({ error: "Failed to get jurisdiction details" });
  }
};

export default withAuth(withErrorHandler(handler));
