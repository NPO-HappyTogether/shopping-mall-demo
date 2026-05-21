import dns from "dns";
import mongoose from "mongoose";

/**
 * Node on Windows often gets querySrv ECONNREFUSED with router/VPN DNS
 * while nslookup works. Public DNS fixes Atlas mongodb+srv resolution.
 * @param {string} uri
 */
function configureDnsForSrv(uri) {
  if (!uri.includes("mongodb+srv")) return;

  const servers = process.env.MONGODB_DNS_SERVERS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const fallback = ["8.8.8.8", "1.1.1.1"];

  if (servers?.length) {
    dns.setServers(servers);
    return;
  }

  if (process.platform === "win32") {
    dns.setServers(fallback);
  }
}

/**
 * @param {string} uri
 */
export async function connectDb(uri) {
  configureDnsForSrv(uri);
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000,
  });
  return mongoose.connection;
}
