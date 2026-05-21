import "dotenv/config";

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "production";
}

await import("../src/index.js");
