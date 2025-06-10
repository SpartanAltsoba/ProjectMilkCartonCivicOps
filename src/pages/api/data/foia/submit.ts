import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../../lib/prisma";
import { withErrorHandler } from "../../../../lib/middleware/errorMiddleware";
import { ValidationError } from "../../../../lib/errors";
import { logger } from "../../../../lib/logger";
import { JWTService } from "../../../../lib/auth/jwt";

interface FOIARequestBody {
  regionId: number;
  requestType: string;
  description: string;
}

async function submitFOIAHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }

  // Verify authentication
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw new ValidationError("Authentication required");
  }

  const token = JWTService.extractTokenFromHeader(authHeader);
  const decoded = JWTService.verifyAccessToken(token);

  const { regionId, requestType, description }: FOIARequestBody = req.body;

  // Validate input
  if (!regionId || !requestType || !description) {
    throw new ValidationError("Region ID, request type, and description are required");
  }

  // Validate region exists
  const region = await prisma.region.findUnique({
    where: { id: regionId },
  });

  if (!region) {
    throw new ValidationError("Invalid region ID");
  }

  // Create FOIA request
  const foiaRequest = await prisma.foiaRequest.create({
    data: {
      userId: decoded.userId,
      regionId,
      requestType,
      description,
      status: "pending",
    },
    include: {
      region: true,
    },
  });

  // Log the FOIA request creation
  await logger.logUserAction("FOIA_REQUEST_CREATED", decoded.userId.toString(), {
    foiaRequestId: foiaRequest.id,
    regionId,
    requestType,
  });

  res.status(201).json({
    message: "FOIA request submitted successfully",
    request: {
      id: foiaRequest.id,
      requestType: foiaRequest.requestType,
      description: foiaRequest.description,
      status: foiaRequest.status,
      region: {
        id: foiaRequest.region.id,
        stateName: foiaRequest.region.stateName,
        countyName: foiaRequest.region.countyName,
      },
      createdAt: foiaRequest.createdAt,
    },
  });
}

export default withErrorHandler(submitFOIAHandler);
