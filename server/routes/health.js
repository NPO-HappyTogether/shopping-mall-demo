import { Router } from "express";
import mongoose from "mongoose";

export const healthRouter = Router();

const readyLabels = [
  "disconnected",
  "connected",
  "connecting",
  "disconnecting",
];

healthRouter.get("/health", (req, res) => {
  const db = readyLabels[mongoose.connection.readyState] ?? "unknown";
  res.json({ ok: true, db });
});
