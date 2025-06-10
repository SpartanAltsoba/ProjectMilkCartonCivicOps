import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { prisma } from "../../../lib/prisma";
import { withErrorHandler } from "../../../lib/middleware/errorMiddleware";
import { ValidationError } from "../../../lib/errors";
import { logger } from "../../../lib/logger";

interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  name?: string;
}

async function registerHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }

  const { email, password, username, name }: RegisterRequest = req.body;

  // Validate input
  if (!email || !password || !username) {
    throw new ValidationError("Email, password, and username are required");
  }

  if (typeof email !== "string" || typeof password !== "string" || typeof username !== "string") {
    throw new ValidationError("Invalid input format");
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError("Invalid email format");
  }

  // Validate password strength
  if (password.length < 8) {
    throw new ValidationError("Password must be at least 8 characters long");
  }

  // Validate username
  if (username.length < 3) {
    throw new ValidationError("Username must be at least 3 characters long");
  }

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    },
  });

  if (existingUser) {
    if (existingUser.email === email.toLowerCase()) {
      throw new ValidationError("Email already registered");
    }
    if (existingUser.username === username.toLowerCase()) {
      throw new ValidationError("Username already taken");
    }
  }

  // Hash password
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      name: name || null,
      passwordHash,
      role: "user",
      emailVerified: false,
      isActive: true,
      tokenVersion: "1",
    },
  });

  // Log user registration
  await logger.logUserAction("REGISTER", user.id.toString(), {
    email: user.email,
    username: user.username,
    ip: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
    userAgent: req.headers["user-agent"],
  });

  // TODO: Send email verification email
  // For now, we'll just return success

  res.status(201).json({
    message: "User registered successfully. Please check your email to verify your account.",
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      emailVerified: user.emailVerified,
    },
  });
}

export default withErrorHandler(registerHandler);
