import session from "express-session";
import MongoStore from "connect-mongo";

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function createSessionMiddleware() {
  const secret = process.env.SESSION_SECRET ?? process.env.JWT_SECRET;
  const mongoUrl = process.env.MONGODB_URI;

  if (!secret) {
    throw new Error("SESSION_SECRET or JWT_SECRET is required for sessions");
  }
  if (!mongoUrl) {
    throw new Error("MONGODB_URI is required for session store");
  }

  const crossSite = Boolean(process.env.CORS_ORIGINS?.trim());
  const prod = process.env.NODE_ENV === "production";
  const sameSite =
    process.env.SESSION_COOKIE_SAMESITE ??
    (crossSite && prod ? "none" : "lax");

  return session({
    name: "sid",
    secret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl,
      ttl: SESSION_MAX_AGE_MS / 1000,
    }),
    cookie: {
      httpOnly: true,
      secure:
        process.env.SESSION_COOKIE_SECURE === "1" ||
        process.env.NODE_ENV === "production",
      sameSite,
      maxAge: SESSION_MAX_AGE_MS,
      ...(process.env.SESSION_COOKIE_DOMAIN
        ? { domain: process.env.SESSION_COOKIE_DOMAIN }
        : {}),
    },
  });
}
