import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { JWTService } from "../../../lib/auth/jwt";
import { withErrorHandler } from "../../../lib/middleware/errorMiddleware";
import { AuthenticationError } from "../../../lib/errors";
import { logger } from "../../../lib/logger";

async function verifyTokenHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new AuthenticationError("No authorization header");
    }

    const token = JWTService.extractTokenFromHeader(authHeader);
    const decoded = JWTService.verifyAccessToken(token);

    // Find the user to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      throw new AuthenticationError("User not found");
    }

    if (!user.isActive) {
      throw new AuthenticationError("Account is deactivated");
    }

    // Return user data
    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    // Log the verification failure
    await logger.warn("Token verification failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      ip: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
    });

    if (error instanceof AuthenticationError) {
      return res.status(401).json({ error: { message: error.message } });
    }

    return res.status(401).json({ error: { message: "Invalid token" } });
  }
}

export default withErrorHandler(verifyTokenHandler);
