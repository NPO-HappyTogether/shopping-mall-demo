import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** 프로덕션에서 서빙할 Vite 빌드 출력 경로 */
export function resolveClientDist() {
  const fromEnv = process.env.CLIENT_DIST?.trim();
  if (fromEnv) {
    return path.resolve(fromEnv);
  }
  return path.resolve(__dirname, "../../client/dist");
}

export function clientDistReady() {
  const dist = resolveClientDist();
  return fs.existsSync(path.join(dist, "index.html"));
}
