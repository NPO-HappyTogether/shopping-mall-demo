/** Vercel production/preview: https://project-name.vercel.app */
const VERCEL_APP_ORIGIN = /^https:\/\/[\w.-]+\.vercel\.app$/i;

/**
 * @param {string | undefined} origin
 * @param {string[] | null} allowed
 */
export function isCorsOriginAllowed(origin, allowed) {
  if (!origin) return true;
  if (!allowed?.length) return true;
  if (allowed.includes(origin)) return true;
  if (VERCEL_APP_ORIGIN.test(origin)) return true;
  return false;
}

export function createCorsOptions() {
  const allowed = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean)
    : null;

  return {
    origin(origin, callback) {
      if (isCorsOriginAllowed(origin, allowed)) {
        callback(null, origin || true);
        return;
      }
      console.warn("[cors] blocked origin:", origin);
      callback(null, false);
    },
    credentials: true,
  };
}
