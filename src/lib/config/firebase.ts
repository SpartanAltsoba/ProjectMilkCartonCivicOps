import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";
import { logger } from "./logger";

// Initialize Firebase Admin SDK
let app: App;
let db: Firestore;
let auth: Auth;

try {
  // Check if Firebase app is already initialized
  if (getApps().length === 0) {
    // Initialize with service account credentials
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    };

    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
      throw new Error("Missing Firebase configuration. Please check environment variables.");
    }

    app = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId,
    });

    logger.info("Firebase Admin SDK initialized successfully");
  } else {
    app = getApps()[0];
    logger.info("Using existing Firebase Admin SDK instance");
  }

  // Initialize Firestore
  db = getFirestore(app);

  // Initialize Auth
  auth = getAuth(app);
} catch (error) {
  logger.error("Failed to initialize Firebase Admin SDK:", error);
  throw error;
}

export { db, auth };
export default app;

/**
 * Firestore collections helper
 */
export const collections = {
  users: "users",
  riskScores: "riskScores",
  foiaRequests: "foiaRequests",
  auditLogs: "auditLogs",
  searchHistory: "searchHistory",
  scoringSnapshots: "scoringSnapshots",
} as const;

/**
 * Helper function to get a Firestore collection reference
 */
export function getCollection(collectionName: string) {
  return db.collection(collectionName);
}

/**
 * Helper function to verify Firebase ID token
 */
export async function verifyIdToken(idToken: string) {
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    logger.error("Failed to verify ID token:", error);
    throw new Error("Invalid ID token");
  }
}

/**
 * Helper function to create custom token
 */
export async function createCustomToken(uid: string, additionalClaims?: object) {
  try {
    const customToken = await auth.createCustomToken(uid, additionalClaims);
    return customToken;
  } catch (error) {
    logger.error("Failed to create custom token:", error);
    throw new Error("Failed to create custom token");
  }
}
