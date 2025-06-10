import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { prisma } from "../../../lib/prisma";
import { JWTService } from "../../../lib/auth/jwt";
import { withErrorHandler } from "../../../lib/middleware/errorMiddleware";
import { ValidationError, AuthenticationError } from "../../../lib/errors";
import { logger } from "../../../lib/logger";

interface LoginRequest {
  email: string;
  password: string;
}

async function loginHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }

  const { email, password }: LoginRequest = req.body;

  // Validate input
  if (!email || !password) {
    throw new ValidationError("Email and password are required");
  }

  if (typeof email !== "string" || typeof password !== "string") {
    throw new ValidationError("Invalid input format");
  }

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    // Don't reveal whether user exists or not
    throw new AuthenticationError("Invalid credentials");
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    await logger.warn("Failed login attempt", { email, userId: user.id });
    throw new AuthenticationError("Invalid credentials");
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AuthenticationError("Account is deactivated");
  }

  // Generate tokens
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = JWTService.generateAccessToken(tokenPayload);
  const refreshToken = JWTService.generateRefreshToken(tokenPayload, user.tokenVersion);

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  // Log successful login
  await logger.logUserAction("LOGIN", user.id.toString(), {
    ip: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
    userAgent: req.headers["user-agent"],
  });

  // Return user data and tokens
  res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
    },
    token: accessToken,
    refreshToken,
  });
}

export default withErrorHandler(loginHandler);
