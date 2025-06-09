import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { withApiWrapper } from "../../../src/lib/api-wrapper";
import {
  validateQuery,
  validateSession,
  sendErrorResponse,
  sendSuccessResponse,
  ValidationError,
} from "../../../src/lib/validation";
import {
  decisionChainSearchSchema,
  DecisionChainResult,
} from "../../../src/lib/validation/search-schemas";
import { cacheKeys, cacheTTL } from "../../../src/lib/cache";
import { Firestore } from "@google-cloud/firestore";
import { ResearchMonster } from "../../../src/lib/research-monster";

const firestore = new Firestore();
const researchMonster = new ResearchMonster();

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

    let validatedQuery;
    try {
      validatedQuery = validateQuery(decisionChainSearchSchema, req);
    } catch (error) {
      if (error instanceof ValidationError) {
        return sendErrorResponse(res, 400, error.message, error.details);
      }
      return sendErrorResponse(res, 400, "Invalid query parameters");
    }

    const caseData = await researchMonster.getCaseData(validatedQuery.caseId);
    const narrativeResult = await researchMonster.generateNarrative(caseData);

    const docRef = firestore.collection("decisionChains").doc(validatedQuery.caseId);
    await docRef.set(narrativeResult);

    console.log("Decision chain analysis completed", {
      caseId: validatedQuery.caseId,
      timelineEvents: narrativeResult.timeline.length,
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
    ttl: cacheTTL.long,
    keyGenerator: req => cacheKeys.decisionChain(req.query.caseId as string),
  },
});
