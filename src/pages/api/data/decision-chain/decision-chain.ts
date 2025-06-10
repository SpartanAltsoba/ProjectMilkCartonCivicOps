import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { withApiWrapper } from "../../../../lib/api/api-wrapper";
import { validateRequest, validateSession } from "../../../../lib/validation";
import { z } from "zod";
import { Firestore } from "@google-cloud/firestore";

const firestore = new Firestore();

// Define the schema here since we don't have search-schemas
const decisionChainSearchSchema = z.object({
  caseId: z.string().min(1),
});

function sendErrorResponse(res: NextApiResponse, status: number, message: string, details?: any[]) {
  return res.status(status).json({ error: message, details });
}

function sendSuccessResponse(res: NextApiResponse, data: any, message?: string) {
  return res.status(200).json({ data, message });
}

async function decisionChainHandler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return sendErrorResponse(res, 405, "Method not allowed", ["Only GET requests are allowed"]);
    }

    const session = await getSession({ req });
    if (!validateSession(session, res)) {
      return;
    }

    const validatedQuery = validateRequest(decisionChainSearchSchema, req.query, res);
    if (!validatedQuery) {
      return;
    }

    // Get data from Firestore
    const docRef = firestore.collection("decisionChains").doc(validatedQuery.caseId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return sendErrorResponse(res, 404, "Decision chain not found");
    }

    const narrativeResult = doc.data();

    console.log("Decision chain analysis completed", {
      caseId: validatedQuery.caseId,
      timelineEvents: narrativeResult?.timeline?.length ?? 0,
      userEmail: session?.user?.email,
      timestamp: new Date().toISOString(),
    });

    return sendSuccessResponse(
      res,
      narrativeResult,
      "Decision chain analysis completed successfully"
    );
  } catch (error: unknown) {
    console.error("Decision chain analysis error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return sendErrorResponse(res, 500, message);
  }
}

export default withApiWrapper(decisionChainHandler, {
  security: true,
  compression: true,
  cache: {
    enabled: true,
    ttl: 3600, // 1 hour cache
    keyGenerator: req => `decision-chain:${req.query.caseId}`,
  },
});
