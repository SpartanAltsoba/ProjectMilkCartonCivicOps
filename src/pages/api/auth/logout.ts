import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { JWTService } from "../../../lib/auth/jwt";
import { withErrorHandler } from "../../../lib/middleware/errorMiddleware";
import { logger } from "../../../lib/logger";

async function logoutHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(200).json({ message: "Logged out successfully" });
    }

    const token = JWTService.extractTokenFromHeader(authHeader);
    const decoded = JWTService.verifyAccessToken(token);

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (user) {
      // Invalidate all refresh tokens by incrementing token version
      const newTokenVersion = (parseInt(user.tokenVersion || "1") + 1).toString();

      await prisma.user.update({
        where: { id: user.id },
        data: { tokenVersion: newTokenVersion },
      });

      // Log the logout
      await logger.logUserAction("LOGOUT", user.id.toString(), {
        ip: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
        userAgent: req.headers["user-agent"],
      });
    }

    res.status(200).json({ message: "Logged out successfully" });
  } catch (_error) {
    // Even if token verification fails, we still return success
    // This prevents information leakage about token validity
    res.status(200).json({ message: "Logged out successfully" });
  }
}

export default withErrorHandler(logoutHandler);
