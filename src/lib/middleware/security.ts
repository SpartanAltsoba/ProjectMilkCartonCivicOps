import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { sanitizeInput } from "../../utils/sanitizeInput";

function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => (typeof item === "string" ? sanitizeInput(item) : item));
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export async function securityMiddleware(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<boolean> {
  try {
    // Check authentication
    const session = await getSession({ req });
    if (!session) {
      res.status(401).json({ error: "Unauthorized" });
      return false;
    }

    // Apply security headers
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "same-origin");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
    );

    // Sanitize input
    try {
      if (req.body && typeof req.body === "object") {
        req.body = sanitizeObject(req.body);
      }
      if (req.query && typeof req.query === "object") {
        const sanitizedQuery = sanitizeObject(req.query);
        // Ensure we maintain the correct type for NextApiRequest query
        req.query = sanitizedQuery as typeof req.query;
      }
    } catch (sanitizeError) {
      console.warn("Input sanitization failed:", sanitizeError);
      // Continue without sanitization rather than failing
    }

    return true;
  } catch (error) {
    console.error("Security middleware error:", error);
    res.status(500).json({ error: "Internal server error" });
    return false;
  }
}

export default securityMiddleware;
