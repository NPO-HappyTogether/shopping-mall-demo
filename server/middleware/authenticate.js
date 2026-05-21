import mongoose from "mongoose";
import { User } from "../models/user.js";
import {
  attachJwtAuth,
  extractBearerToken,
  hasJwt,
  jwtErrorBody,
  resolveJwtFromRequest,
} from "../utils/jwtRequest.js";
import {
  attachRequestAuth,
  resolveRequestAuth,
} from "../utils/requestAuth.js";

export { hasJwt, extractBearerToken, resolveJwtFromRequest } from "../utils/jwtRequest.js";
export { resolveRequestAuth } from "../utils/requestAuth.js";

/**
 * JWT Bearer 토큰 필수. 성공 시 req.auth, req.userId 설정.
 */
export function authenticateJwt(req, res, next) {
  const result = resolveJwtFromRequest(req);
  if (!result.ok) {
    return res.status(result.status).json(jwtErrorBody(result));
  }
  attachJwtAuth(req, { payload: result.payload, userId: result.userId });
  next();
}

/**
 * JWT가 있으면 검증해 req에 부착, 없으면 그대로 통과 (선택 인증).
 */
export function optionalJwt(req, res, next) {
  if (!hasJwt(req)) return next();
  const result = resolveJwtFromRequest(req);
  if (!result.ok) {
    return res.status(result.status).json(jwtErrorBody(result));
  }
  attachJwtAuth(req, { payload: result.payload, userId: result.userId });
  next();
}

/**
 * express-session 쿠키 세션 필수.
 */
export function requireSession(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({
      ok: false,
      error: "Session not found. Please log in.",
      code: "NO_SESSION",
    });
  }
  req.sessionUserId = req.session.userId;
  next();
}

/**
 * JWT 또는 세션 중 하나 필수 (JWT 우선).
 */
export function authenticateJwtOrSession(req, res, next) {
  const auth = resolveRequestAuth(req);
  if (!auth) {
    return res.status(401).json({
      ok: false,
      error: "Authentication required",
      code: "UNAUTHORIZED",
    });
  }
  if (auth.error) {
    return res.status(auth.error.status).json(jwtErrorBody(auth.error));
  }
  attachRequestAuth(req, auth);
  next();
}

/** 관리자만 허용 (loadUser 이후) */
export function requireAdmin(req, res, next) {
  if (req.user?.user_type !== "admin") {
    return res.status(403).json({
      ok: false,
      error: "Admin access required",
      code: "FORBIDDEN",
    });
  }
  next();
}

/** 로그인 사용자 정보를 DB에서 조회해 req.user에 담음 */
export async function loadUser(req, res, next) {
  try {
    const id = req.userId ?? req.sessionUserId ?? req.session?.userId;
    if (!id || !mongoose.isValidObjectId(id)) {
      return res.status(401).json({ ok: false, error: "Invalid user" });
    }
    const user = await User.findById(id).select("-password").lean();
    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
