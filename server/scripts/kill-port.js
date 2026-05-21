import { execSync } from "node:child_process";

/**
 * 지정 포트를 LISTEN 중인 PID 목록 (Windows netstat)
 * @param {number} port
 * @returns {string[]}
 */
export function findListeningPids(port) {
  const p = Number(port);
  if (!Number.isFinite(p) || p <= 0) return [];

  try {
    const out = execSync(`netstat -ano | findstr :${p}`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    });

    const pids = new Set();
    for (const line of out.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed.toUpperCase().includes("LISTENING")) continue;
      const parts = trimmed.split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && /^\d+$/.test(pid) && pid !== "0") {
        pids.add(pid);
      }
    }
    return [...pids];
  } catch {
    return [];
  }
}

/**
 * 지정 포트를 LISTEN 중인 프로세스를 종료합니다 (Windows).
 * @param {number} port
 * @returns {{ freed: string[], failed: string[] }}
 */
export function killPort(port) {
  const pids = findListeningPids(port);
  const freed = [];
  const failed = [];

  for (const pid of pids) {
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
      freed.push(pid);
      console.log(`[kill-port] Port ${port} freed (PID ${pid})`);
    } catch {
      failed.push(pid);
      console.warn(
        `[kill-port] Could not stop PID ${pid} (Access denied). ` +
          `Close the other terminal or end node.exe in Task Manager, then retry.`
      );
    }
  }

  return { freed, failed };
}

const portArg = process.argv[2];
if (portArg) {
  killPort(portArg);
  const remaining = findListeningPids(portArg);
  if (remaining.length > 0) {
    console.error(
      `[kill-port] Port ${portArg} still in use by PID: ${remaining.join(", ")}`
    );
    process.exit(1);
  }
}
