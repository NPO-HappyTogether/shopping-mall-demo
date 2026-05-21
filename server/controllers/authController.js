import { RefreshSession } from "../models/refreshSession.js";
import { User } from "../models/user.js";
import { findUserForLogin, verifyPassword } from "../utils/credentials.js";
import {
  generateRefreshToken,
  getRefreshExpiresAt,
  hashRefreshToken,
  signAccessToken,
} from "../utils/authTokens.js";
import { stripPassword } from "../utils/user.js";

const INVALID_CREDENTIALS = "Invalid email or password";
const REFRESH_COOKIE = "refreshToken";

/** Vercel + Railway 등 프론트/백 분리 배포 시 refresh 쿠키용 */
function refreshCookieOptions() {
  const crossSite = Boolean(process.env.CORS_ORIGINS?.trim());
  const prod = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: prod || crossSite,
    sameSite: crossSite && prod ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  };
}

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE, token, refreshCookieOptions());
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
}

async function createRefreshSession(userId) {
  const refreshToken = generateRefreshToken();
  await RefreshSession.create({
    userId,
    tokenHash: hashRefreshToken(refreshToken),
    expiresAt: getRefreshExpiresAt(),
  });
  return refreshToken;
}

async function revokeRefreshToken(rawToken) {
  if (!rawToken) return;
  await RefreshSession.deleteOne({ tokenHash: hashRefreshToken(rawToken) });
}

function getRefreshTokenFromRequest(req) {
  return req.cookies?.[REFRESH_COOKIE] ?? req.body?.refreshToken ?? null;
}

/**
 * POST /api/auth/login
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        error: "email and password are required",
      });
    }

    const user = await findUserForLogin(email);

    if (!user) {
      return res.status(401).json({
        ok: false,
        error: INVALID_CREDENTIALS,
      });
    }

    if (!user.password) {
      console.error("Login failed: password field missing for", user.email);
      return res.status(401).json({
        ok: false,
        error: INVALID_CREDENTIALS,
      });
    }

    const passwordMatch = await verifyPassword(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        ok: false,
        error: INVALID_CREDENTIALS,
      });
    }

    let accessToken;
    try {
      accessToken = signAccessToken(user);
    } catch {
      console.error("Missing JWT_SECRET");
      return res.status(500).json({
        ok: false,
        error: "Server configuration error",
      });
    }

    const refreshToken = await createRefreshSession(user._id);
    setRefreshCookie(res, refreshToken);

    req.session.userId = user._id.toString();
    req.session.email = user.email;

    res.status(200).json({
      ok: true,
      message: "Login successful",
      accessToken,
      token: accessToken,
      refreshToken,
      user: stripPassword(user),
      session: { active: true },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/refresh — 액세스 토큰 재발급 (리프레시 토큰 로테이션)
 */
export async function refresh(req, res, next) {
  try {
    const rawToken = getRefreshTokenFromRequest(req);
    if (!rawToken) {
      return res.status(401).json({
        ok: false,
        error: "Refresh token required",
        code: "NO_REFRESH_TOKEN",
      });
    }

    const session = await RefreshSession.findOne({
      tokenHash: hashRefreshToken(rawToken),
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      clearRefreshCookie(res);
      return res.status(401).json({
        ok: false,
        error: "Invalid or expired refresh token",
        code: "INVALID_REFRESH_TOKEN",
      });
    }

    const user = await User.findById(session.userId);
    if (!user) {
      await RefreshSession.deleteOne({ _id: session._id });
      clearRefreshCookie(res);
      return res.status(401).json({
        ok: false,
        error: "User not found",
      });
    }

    await RefreshSession.deleteOne({ _id: session._id });
    const newRefreshToken = await createRefreshSession(user._id);
    setRefreshCookie(res, newRefreshToken);

    let accessToken;
    try {
      accessToken = signAccessToken(user);
    } catch {
      return res.status(500).json({
        ok: false,
        error: "Server configuration error",
      });
    }

    req.session.userId = user._id.toString();
    req.session.email = user.email;

    res.status(200).json({
      ok: true,
      message: "Token refreshed",
      accessToken,
      token: accessToken,
      refreshToken: newRefreshToken,
      user: stripPassword(user),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 */
export async function logout(req, res, next) {
  try {
    const rawToken = getRefreshTokenFromRequest(req);
    await revokeRefreshToken(rawToken);
    clearRefreshCookie(res);

    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }
      res.clearCookie("sid");
      res.status(200).json({
        ok: true,
        message: "Logged out successfully",
      });
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me — JWT 필요 (Authorization: Bearer)
 */
export async function me(req, res) {
  res.status(200).json({
    ok: true,
    user: req.user,
    auth: {
      sub: req.auth?.sub,
      email: req.auth?.email,
      user_type: req.auth?.user_type,
    },
  });
}

/**
 * GET /api/auth/session — 쿠키 세션 상태
 */
export function sessionStatus(req, res) {
  if (!req.session?.userId) {
    return res.status(401).json({
      ok: false,
      error: "No active session",
      session: { active: false },
    });
  }

  res.status(200).json({
    ok: true,
    session: {
      active: true,
      userId: req.session.userId,
      email: req.session.email,
    },
  });
}
