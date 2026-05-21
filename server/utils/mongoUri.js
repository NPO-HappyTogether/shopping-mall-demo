const LOCAL_DEFAULT = "mongodb://127.0.0.1:27017/shoping-mall";
const DEFAULT_DB = "shoping-mall";

/**
 * MongoDB connection URI resolution order:
 * 1. MONGODB_ATLAS_URL (cloud)
 * 2. MONGODB_URI (explicit override)
 * 3. local default
 */
export function getMongoUri() {
  const atlas = process.env.MONGODB_ATLAS_URL?.trim();
  if (atlas) return normalizeMongoUri(atlas);

  const uri = process.env.MONGODB_URI?.trim();
  if (uri) return normalizeMongoUri(uri);

  return LOCAL_DEFAULT;
}

/**
 * @param {string} uri
 */
function normalizeMongoUri(uri) {
  const trimmed = uri.trim();
  const match = trimmed.match(/^(mongodb(?:\+srv)?:\/\/[^/]+)(\/[^?]*)?(\?.*)?$/);
  if (!match) return trimmed;

  const [, base, path = "", query = ""] = match;
  const hasDb =
    path.length > 1 && path !== "/" && !path.slice(1).includes("/");
  const dbPath = hasDb ? path : `/${DEFAULT_DB}`;
  let result = `${base}${dbPath}`;

  if (!query && trimmed.includes("mongodb+srv")) {
    result += "?retryWrites=true&w=majority";
  } else if (query) {
    result += query;
  }

  return result;
}
