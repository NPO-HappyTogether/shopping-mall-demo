import {
  attachJwtAuth,
  hasJwt,
  resolveJwtFromRequest,
} from "./jwtRequest.js";

/**
 * 요청 인증 수단 해석: JWT 우선, 없으면 express-session.
 * @returns {{ type: 'jwt', userId: string, auth: object } | { type: 'session', userId: string } | null}
 */
export function resolveRequestAuth(req) {
  if (hasJwt(req)) {
    const jwt = resolveJwtFromRequest(req);
    if (!jwt.ok) {
      return { error: jwt };
    }
    return { type: "jwt", userId: jwt.userId, auth: jwt.payload };
  }

  const sessionUserId = req.session?.userId;
  if (sessionUserId) {
    return { type: "session", userId: String(sessionUserId) };
  }

  return null;
}

/**
 * resolveRequestAuth 결과를 req에 반영.
 */
export function attachRequestAuth(req, auth) {
  if (auth.type === "jwt") {
    attachJwtAuth(req, { payload: auth.auth, userId: auth.userId });
    return;
  }
  req.sessionUserId = auth.userId;
  req.userId = auth.userId;
}
