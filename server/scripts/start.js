import "dotenv/config";
import { findListeningPids, killPort } from "./kill-port.js";

const port = Number(process.env.PORT) || 5000;
const isProd = process.env.NODE_ENV === "production";

/** 개발 시에만 포트 선점 해제 (프로덕션은 start:prod 사용) */
if (!isProd) {
  killPort(port);

  const remaining = findListeningPids(port);
  if (remaining.length > 0) {
    console.error(
      `\nPort ${port} is still in use (PID: ${remaining.join(", ")}).\n` +
        `Fix:\n` +
        `  1. Close the other terminal running the server (Ctrl+C), or\n` +
        `  2. Task Manager → end "Node.js JavaScript Runtime", or\n` +
        `  3. Admin PowerShell: taskkill /PID ${remaining[0]} /F\n` +
        `Then run: npm run dev\n`
    );
    process.exit(1);
  }
}

await import("../src/index.js");
