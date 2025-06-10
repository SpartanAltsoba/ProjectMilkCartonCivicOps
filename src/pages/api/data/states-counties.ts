import { NextApiRequest, NextApiResponse } from "next";
import { fetchStatesAndCounties } from "../../../lib/api";
import { asyncHandler } from "../../../utils/asyncHandler";
import { logger } from "../../../lib/logger";
import { validateMethod } from "../../../utils/validateMethod";
import { Firestore } from "../../../services/firebase/firebase";
import { StatesAndCountiesResponse } from "../../../types/apiResponse";

const firestore = new Firestore();

const statesCountiesHandler = async (
  req: NextApiRequest,
  res: NextApiResponse<StatesAndCountiesResponse | { error: string }>
): Promise<void> => {
  if (!validateMethod(req, res, ["GET"])) return;

  try {
    const response = await fetchStatesAndCounties();
    logger.info("Successfully fetched states and counties data");

    // Store the scraped data in Firestore
    await firestore.storeStatesAndCounties(response.data);

    return res.status(200).json({ data: response.data });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error fetching states and counties", err);
    return res.status(500).json({ error: "Failed to fetch states and counties" });
  }
};

export default asyncHandler(statesCountiesHandler);
