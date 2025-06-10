import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { withErrorHandler } from "../../../middleware/errorHandler";
import { logger } from "../../../lib/logger";
import { db } from "../../../lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";

type AuditLogEntry = {
  userId: string;
  action: string;
  timestamp: string;
  details?: Record<string, unknown>;
};

const auditHandler = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  try {
    const session = await getSession({ req });

    if (!session || !session.user?.email) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userId = session.user.email;

    switch (req.method) {
      case "GET": {
        try {
          const logsQuery = query(collection(db, "audit_logs"), where("userId", "==", userId));
          const logsSnapshot = await getDocs(logsQuery);
          const logs = logsSnapshot.docs.map(doc => doc.data());
          logger.info("Fetched audit logs for user", { userId });
          res.status(200).json(logs);
          return;
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          logger.error("Error fetching audit logs", { error: err, userId });
          res.status(500).json({ error: "Internal Server Error" });
          return;
        }
      }

      case "POST": {
        const { action, details } = req.body as Pick<AuditLogEntry, "action" | "details">;

        if (!action) {
          res.status(400).json({ error: "Missing action in request body" });
          return;
        }

        try {
          const newLogEntry: AuditLogEntry = {
            userId,
            action,
            timestamp: new Date().toISOString(), // Use current date since serverTimestamp() is only set after write
            details: details || {},
          };

          await addDoc(collection(db, "audit_logs"), {
            ...newLogEntry,
            timestamp: serverTimestamp(), // This will be set on the server
          });

          logger.info("Created audit log entry", { userId, action });
          res.status(201).json({ message: "Log entry created" });
          return;
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          logger.error("Error creating audit log", { error: err, userId, action });
          res.status(500).json({ error: "Internal Server Error" });
          return;
        }
      }

      default:
        res.setHeader("Allow", ["GET", "POST"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
        return;
    }
  } catch (error) {
    logger.error("Audit handler error", { error });
    throw error; // Let the error handler middleware handle this
  }
};

export default withErrorHandler(auditHandler);
