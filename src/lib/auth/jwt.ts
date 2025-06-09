import jwt from "jsonwebtoken";
import { AuthenticationError } from "../errors";
import { logger } from "../logger";

// Load and validate JWT secrets from environment variables
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

if (!JWT_SECRET || !REFRESH_TOKEN_SECRET) {
  throw new Error("JWT secrets must be configured in environment variables");
}

interface TokenPayload {
  userId: number;
  email: string;
  role: string;
}

interface RefreshTokenPayload extends TokenPayload {
  version: string; // Used to invalidate all refresh tokens when needed
}

export class JWTService {
  // Generate access token (short-lived)
  static generateAccessToken(payload: TokenPayload): string {
    try {
      return jwt.sign(payload, JWT_SECRET!, {
        expiresIn: "15m", // Short lived
      });
    } catch (error) {
      logger.error("Failed to generate access token", error);
      throw new AuthenticationError("Failed to generate access token");
    }
  }

  // Generate refresh token (long-lived)
  static generateRefreshToken(payload: TokenPayload, tokenVersion: string): string {
    try {
      const refreshPayload: RefreshTokenPayload = {
        ...payload,
        version: tokenVersion,
      };

      return jwt.sign(refreshPayload, REFRESH_TOKEN_SECRET!, {
        expiresIn: "7d", // Longer lived
      });
    } catch (error) {
      logger.error("Failed to generate refresh token", error);
      throw new AuthenticationError("Failed to generate refresh token");
    }
  }

  // Verify access token
  static verifyAccessToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, JWT_SECRET!) as any;
      return {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError("Token has expired");
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError("Invalid token");
      }
      logger.error("Failed to verify access token", error);
      throw new AuthenticationError("Failed to verify token");
    }
  }

  // Verify refresh token
  static verifyRefreshToken(token: string, currentTokenVersion: string): RefreshTokenPayload {
    try {
      const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET!) as any;
      const payload: RefreshTokenPayload = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        version: decoded.version,
      };

      // Check if the token version matches the current version
      if (payload.version !== currentTokenVersion) {
        throw new AuthenticationError("Refresh token has been revoked");
      }

      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError("Refresh token has expired");
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError("Invalid refresh token");
      }
      logger.error("Failed to verify refresh token", error);
      throw new AuthenticationError("Failed to verify refresh token");
    }
  }

  // Extract token from authorization header
  static extractTokenFromHeader(authHeader?: string): string {
    if (!authHeader) {
      throw new AuthenticationError("No authorization header");
    }

    const [bearer, token] = authHeader.split(" ");

    if (bearer !== "Bearer" || !token) {
      throw new AuthenticationError("Invalid authorization header format");
    }

    return token;
  }
}
