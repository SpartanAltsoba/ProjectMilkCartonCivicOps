import { https } from "firebase-functions";
import express, { Request, Response } from "express";
import cors from "cors";

const app = express();
app.use(cors({ origin: true }));

interface AuthRequest {
  email: string;
  password: string;
}

// Auth endpoints
app.post("/auth/login", async (req: Request<{}, {}, AuthRequest>, res: Response) => {
  try {
    const { email, password } = req.body;
    // Add Firebase Auth implementation
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Authentication failed" });
  }
});

// Data endpoints
app.get("/data/risk-scores", async (req: Request, res: Response) => {
  try {
    const { state, county } = req.query;
    // Implementation will be moved to Firebase Functions
    res.json({
      data: {
        scores: [],
        message: "Risk scores endpoint moved to Firebase Functions",
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch risk scores" });
  }
});

app.get("/data/states-counties", async (req: Request, res: Response) => {
  try {
    // Implementation will be moved to Firebase Functions
    res.json({
      data: {
        states: [],
        counties: [],
        message: "States and counties endpoint moved to Firebase Functions",
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch states and counties" });
  }
});

app.get("/data/search", async (req: Request, res: Response) => {
  try {
    const { term } = req.query;
    if (!term || typeof term !== "string") {
      res.status(400).json({ error: "Search term is required" });
      return;
    }
    // Implementation will be moved to Firebase Functions
    res.json({
      data: {
        results: [],
        message: "Search endpoint moved to Firebase Functions",
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Search failed" });
  }
});

// External API proxies
app.get("/api/court-listener/search", async (req: Request, res: Response) => {
  try {
    const { state, county } = req.query;
    if (!state || typeof state !== "string") {
      res.status(400).json({ error: "State is required" });
      return;
    }
    // Implementation will be moved to Firebase Functions
    res.json({
      cases: [],
      message: "Court Listener endpoint moved to Firebase Functions",
    });
  } catch (error) {
    res.status(500).json({ error: "Court Listener search failed" });
  }
});

app.get("/api/data-gov/child-welfare", async (req: Request, res: Response) => {
  try {
    const { state } = req.query;
    // Implementation will be moved to Firebase Functions
    res.json({
      data: {
        message: "Data.gov endpoint moved to Firebase Functions",
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Data.gov request failed" });
  }
});

// Export the Express app as a Firebase Function
export const api = https.onRequest(app);
