import bcrypt from "bcryptjs";
import { User } from "../models/user.js";

function getSaltRounds() {
  const n = Number(process.env.BCRYPT_SALT_ROUNDS);
  return Number.isFinite(n) && n >= 4 && n <= 20 ? n : 10;
}

export function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

export async function hashPassword(plainPassword) {
  return bcrypt.hash(String(plainPassword), getSaltRounds());
}

export async function verifyPassword(plainPassword, storedHash) {
  if (!storedHash || typeof storedHash !== "string") {
    return false;
  }

  const hash = storedHash.trim();
  if (!/^\$2[aby]\$\d{2}\$.{53}$/.test(hash)) {
    return false;
  }

  return bcrypt.compare(String(plainPassword), hash);
}

export async function findUserForLogin(email) {
  const normalizedEmail = normalizeEmail(email);
  return User.findOne({ email: normalizedEmail }).select("+password");
}
