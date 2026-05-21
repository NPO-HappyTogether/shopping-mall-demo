import { verifyAccessToken } from "./authTokens.js";

/** JWT 인증 실패 코드 (클라이언트·미들웨어 공통) */
export const JWT_ERROR_CODES = {
  NO_TOKEN: "NO_TOKEN",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  INVALID_TOKEN: "INVALID_TOKEN",
};

/**
 * Authorization 헤더에서 Bearer 토큰 문자열 추출.
 * @returns {string | null}
 */
export function extractBearerToken(req) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  return token || null;
}

/** 요청에 Bearer JWT가 포함되어 있는지 */
export function hasJwt(req) {
  return Boolean(extractBearerToken(req));
}

/**
 * JWT 문자열 검증.
 * @returns {{ ok: true, payload: object, userId: string } | { ok: false, status: number, error: string, code: string }}
 */
export function verifyBearerToken(token) {
  try {
    const payload = verifyAccessToken(token);
    const userId = payload?.sub;
    if (!userId) {
      return {
        ok: false,
        status: 401,
        error: "Invalid access token",
        code: JWT_ERROR_CODES.INVALID_TOKEN,
      };
    }
    return { ok: true, payload, userId: String(userId) };
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return {
        ok: false,
        status: 401,
        error: "Access token expired",
        code: JWT_ERROR_CODES.TOKEN_EXPIRED,
      };
    }
    return {
      ok: false,
      status: 401,
      error: "Invalid access token",
      code: JWT_ERROR_CODES.INVALID_TOKEN,
    };
  }
}

/**
 * 요청에서 JWT를 추출·검증.
 * @returns {{ ok: true, payload: object, userId: string, token: string } | { ok: false, status: number, error: string, code: string }}
 */
export function resolveJwtFromRequest(req) {
  const token = extractBearerToken(req);
  if (!token) {
    return {
      ok: false,
      status: 401,
      error: "Authorization token required",
      code: JWT_ERROR_CODES.NO_TOKEN,
    };
  }
  const result = verifyBearerToken(token);
  if (!result.ok) return result;
  return { ...result, token };
}

/**
 * JWT 검증 성공 시 req에 auth 정보 부착.
 */
export function attachJwtAuth(req, { payload, userId }) {
  req.auth = payload;
  req.userId = userId;
}

/** JWT 실패 응답 본문 */
export function jwtErrorBody(result) {
  return {
    ok: false,
    error: result.error,
    code: result.code,
  };
}
