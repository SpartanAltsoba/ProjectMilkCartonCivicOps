// functions/nextApp.ts
import { onRequest } from "firebase-functions/v2/https";
import next from "next";
import { HttpsFunction } from "firebase-functions";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

export const nextApp: HttpsFunction = onRequest((req, res) => {
  return app.prepare().then(() => handle(req, res));
});
