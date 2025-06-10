import express from "express";
import bodyParser from "body-parser";
import type { NextApiRequest, NextApiResponse } from "next";
import riskScoresHandler from "../src/pages/api/data/risk-scores/risk-scores";
import searchHandler from "../src/pages/api/search";
import loginHandler from "../src/pages/api/auth/login";
import registerHandler from "../src/pages/api/auth/register";
import auditHandler from "../src/pages/api/logging/audit";

const app = express();
app.use(bodyParser.json());

// Adapter to convert Express req/res to Next.js API req/res
function toNextApiHandler(handler: (req: NextApiRequest, res: NextApiResponse) => void) {
  return (req: express.Request, res: express.Response) => {
    return handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
  };
}

// Mount API routes using adapter
app.get("/api/data/risk-scores", toNextApiHandler(riskScoresHandler));
app.get("/api/data/search", toNextApiHandler(searchHandler));
app.post("/api/auth/login", toNextApiHandler(loginHandler));
app.post("/api/auth/register", toNextApiHandler(registerHandler));
app.all("/api/logging/audit", toNextApiHandler(auditHandler));

export default app;
