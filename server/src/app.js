import path from "node:path";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { createSessionMiddleware } from "../config/session.js";
import { registerRoutes } from "../routes/index.js";
import { clientDistReady, resolveClientDist } from "../utils/clientDist.js";

export function createApp() {
  const app = express();

  if (process.env.TRUST_PROXY === "1") {
    app.set("trust proxy", 1);
  }

  const origins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean)
    : null;

  app.use(
    cors(
      origins?.length
        ? { origin: origins, credentials: true }
        : { origin: true, credentials: true }
    )
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use(createSessionMiddleware());

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
