import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { JWTService } from "../../../lib/auth/jwt";
import { withErrorHandler } from "../../../lib/middleware/errorMiddleware";
import { ValidationError, AuthenticationError } from "../../../lib/errors";
import { logger } from "../../../lib/logger";

interface RefreshTokenRequest {
  refreshToken: string;
}

async function refreshTokenHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }

  const { refreshToken }: RefreshTokenRequest = req.body;

  if (!refreshToken) {
    throw new ValidationError("Refresh token is required");
  }

  try {
    // Get user ID from token payload without verification
    const tokenParts = refreshToken.split(".");
    if (tokenParts.length !== 3) {
      throw new AuthenticationError("Invalid refresh token format");
    }

    const payload = JSON.parse(Buffer.from(tokenParts[1], "base64").toString());
    if (!payload.userId) {
      throw new AuthenticationError("Invalid token payload");
    }

    // Get user from database to check token version
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new AuthenticationError("User not found");
    }

    if (!user.isActive) {
      throw new AuthenticationError("Account is deactivated");
    }

    // Verify the refresh token with the current token version
    JWTService.verifyRefreshToken(refreshToken, user.tokenVersion);

    // Generate new tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const newAccessToken = JWTService.generateAccessToken(tokenPayload);
    const newRefreshToken = JWTService.generateRefreshToken(tokenPayload, user.tokenVersion);

    // Log token refresh
    await logger.logUserAction("TOKEN_REFRESH", user.id.toString(), {
      ip: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      token: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    // Log the error but don't expose details
    await logger.error("Token refresh failed", error);
    throw new AuthenticationError("Invalid or expired refresh token");
  }
}

export default withErrorHandler(refreshTokenHandler);
