import { NextApiRequest, NextApiResponse } from "next";
import { fetchExportOptions } from "../../lib/api";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const options = await fetchExportOptions();
    return res.status(200).json(options);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch export options" });
  }
}

export default handler;
