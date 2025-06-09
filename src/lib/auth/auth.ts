import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextApiRequest } from "next";
import crypto from "crypto";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

class AuthService {
  private readonly JWT_SECRET: string;
  private readonly SALT_ROUNDS = 12;

  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-development";
  }

  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Compare a plain password with a hashed password
   */
  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Generate a JWT token for a user
   */
  generateToken(user: Pick<User, "id" | "email" | "role">): string {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    // Use a simple approach to avoid type issues
    return jwt.sign(payload, this.JWT_SECRET, { expiresIn: "7d" });
  }

  /**
   * Verify and decode a JWT token
   */
  verifyToken(token: string): AuthTokenPayload {
    try {
      return jwt.verify(token, this.JWT_SECRET) as AuthTokenPayload;
    } catch {
      throw new Error("Invalid or expired token");
    }
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Get user from request (for middleware)
   */
  async getUserFromRequest(req: NextApiRequest): Promise<AuthTokenPayload | null> {
    try {
      const authHeader = req.headers.authorization;
      const token = this.extractTokenFromHeader(authHeader);

      if (!token) {
        return null;
      }

      return this.verifyToken(token);
    } catch {
      return null;
    }
  }

  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  isValidPassword(password: string): { valid: boolean; message?: string } {
    if (password.length < 8) {
      return { valid: false, message: "Password must be at least 8 characters long" };
    }

    if (!/(?=.*[a-z])/.test(password)) {
      return { valid: false, message: "Password must contain at least one lowercase letter" };
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      return { valid: false, message: "Password must contain at least one uppercase letter" };
    }

    if (!/(?=.*\d)/.test(password)) {
      return { valid: false, message: "Password must contain at least one number" };
    }

    return { valid: true };
  }

  /**
   * Generate a secure random token (for password reset, email verification, etc.)
   */
  generateSecureToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }
}

// Export singleton instance
export const authService = new AuthService();

// Export the class for testing
export { AuthService };
