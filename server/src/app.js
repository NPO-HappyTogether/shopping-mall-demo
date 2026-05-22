import path from "node:path";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { createSessionMiddleware } from "../config/session.js";
import { registerRoutes } from "../routes/index.js";
import { createCorsOptions } from "../utils/corsOrigin.js";
import { clientDistReady, resolveClientDist } from "../utils/clientDist.js";

const DB_STATE = [
  "disconnected",
  "connected",
  "connecting",
  "disconnecting",
];

/** Railway 헬스체크용 — 세션/DB 설정 전에 응답 */
function mountHealthRoutes(app) {
  const handler = (_req, res) => {
    const db = DB_STATE[mongoose.connection.readyState] ?? "unknown";
    res.status(200).json({ ok: true, db });
  };
  app.get("/api/health", handler);
  app.get("/health", handler);
}

export function createApp() {
  const app = express();

  if (process.env.TRUST_PROXY === "1") {
    app.set("trust proxy", 1);
  }

  mountHealthRoutes(app);

  app.use(cors(createCorsOptions()));
  app.use(express.json());
  app.use(cookieParser());

  try {
    app.use(createSessionMiddleware());
  } catch (err) {
    console.error(
      "[session] disabled:",
      err instanceof Error ? err.message : err,
    );
  }

  registerRoutes(app);

  const serveClient =
    process.env.SERVE_CLIENT === "1" ||
    (process.env.NODE_ENV === "production" && clientDistReady());

  if (serveClient) {
    const dist = resolveClientDist();
    app.use(express.static(dist, { index: false }));

    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) {
        return next();
      }
      res.sendFile(path.join(dist, "index.html"), (err) => {
        if (err) next(err);
      });
    });
  }

  app.use((req, res) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ error: "Not found" });
    }
    res.status(404).send("Not found");
  });

  app.use((err, req, res, next) => {
    const status = err.statusCode ?? 500;
    const message = err.message ?? "Internal server error";
    if (status >= 500) {
      console.error(err);
    }
    res.status(status).json({ error: message });
  });

  return app;
}
