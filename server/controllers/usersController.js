import mongoose from "mongoose";
import { User } from "../models/user.js";
import { hashPassword, normalizeEmail } from "../utils/credentials.js";
import { stripPassword } from "../utils/user.js";

function handleUserError(err, res) {
  if (err instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: "Validation failed", details: messages });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: "Duplicate email" });
  }
  throw err;
}

export async function listUsers(req, res, next) {
  try {
    const users = await User.find().sort({ createdAt: -1 }).select("-password").lean();
    res.json(users);
  } catch (err) {
    next(err);
  }
}

/** GET /api/users/me — JWT Bearer 토큰으로 로그인 사용자 정보 */
export function getCurrentUser(req, res) {
  res.status(200).json({
    ok: true,
    user: req.user,
  });
}

export async function getUserById(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    const user = await User.findById(id).select("-password").lean();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
}

/** 공개 회원가입 — user_type은 항상 customer (관리자 생성은 별도 보호 필요) */
export async function createUser(req, res, next) {
  try {
    const { email, name, password, address, phone } = req.body ?? {};
    if (!email || !name || !password) {
      return res
        .status(400)
        .json({ error: "email, name, and password are required" });
    }
    const hashed = await hashPassword(password);
    const doc = await User.create({
      email: normalizeEmail(email),
      name: String(name).trim(),
      password: hashed,
      user_type: "customer",
      address: address?.trim() || undefined,
      phone: phone?.trim() || undefined,
    });
    res.status(201).json(stripPassword(doc));
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError || err.code === 11000) {
      return handleUserError(err, res);
    }
    next(err);
  }
}

export async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    const { email, name, password, address, phone } = req.body ?? {};
    const updates = {};
    if (email !== undefined) updates.email = normalizeEmail(email);
    if (name !== undefined) updates.name = String(name).trim();
    if (address !== undefined) updates.address = address;
    if (phone !== undefined) updates.phone = phone;
    if (password !== undefined) {
      updates.password = await hashPassword(password);
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }
    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError || err.code === 11000) {
      return handleUserError(err, res);
    }
    next(err);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    const user = await User.findByIdAndDelete(id).select("-password").lean();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ ok: true, deleted: stripPassword(user) });
  } catch (err) {
    next(err);
  }
}
