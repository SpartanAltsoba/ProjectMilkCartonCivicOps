import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import { prisma } from "../../../lib/prisma";
import { withErrorHandler } from "../../../lib/middleware/errorMiddleware";
import { ValidationError, AuthenticationError } from "../../../lib/errors";
import { logger } from "../../../lib/logger";
import { JWTService } from "../../../lib/auth/jwt";

interface VerifyEmailRequest {
  token: string;
}

async function verifyEmailHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }

  const { token }: VerifyEmailRequest = req.body;

  if (!token) {
    throw new ValidationError("Verification token is required");
  }

  try {
    // Verify the token
    const decoded = JWTService.verifyAccessToken(token);

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      throw new AuthenticationError("User not found");
    }

    if (user.emailVerified) {
      return res.status(200).json({ message: "Email already verified" });
    }

    // Update user's email verification status
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    // Log the verification
    await logger.logUserAction("EMAIL_VERIFIED", user.id.toString(), {
      email: user.email,
    });

    res.status(200).json({
      message: "Email verified successfully",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        emailVerified: updatedUser.emailVerified,
      },
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError("Verification token has expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError("Invalid verification token");
    }
    throw error;
  }
}

export default withErrorHandler(verifyEmailHandler);
