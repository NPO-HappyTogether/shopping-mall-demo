import { apiUrl } from '@/lib/api'
import type { StoredUser } from '@/lib/authStorage'

export type LoginPayload = {
  email: string
  password: string
}

export type LoginSuccess = {
  ok: true
  accessToken: string
  user: StoredUser
}

export type LoginFailure = {
  ok: false
  error: string
  status: number
}

export type LoginResult = LoginSuccess | LoginFailure

/** 서버 authController 응답 메시지 → 한글 */
function mapLoginError(status: number, serverError?: string): string {
  if (status === 502 || status === 503) {
    return '서버에 연결할 수 없습니다. server 폴더에서 npm run dev 가 실행 중인지 확인해 주세요.'
  }
  if (serverError === 'email and password are required') {
    return '이메일과 비밀번호를 입력해 주세요.'
  }
  if (serverError === 'Invalid email or password') {
    return '이메일 또는 비밀번호가 올바르지 않습니다.'
  }
  if (serverError === 'Server configuration error') {
    return '서버 설정 오류입니다. JWT_SECRET을 확인해 주세요.'
  }
  return serverError ?? `로그인에 실패했습니다. (${status})`
}

/**
 * 회원가입(`POST /api/users`)으로 만든 계정으로 로그인합니다.
 * 서버: `POST /api/auth/login` → User 조회 + bcrypt 검증 + JWT 발급
 */
export async function loginUser(payload: LoginPayload): Promise<LoginResult> {
  let res: Response
  try {
    res = await fetch(apiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
      }),
    })
  } catch {
    return {
      ok: false,
      status: 0,
      error: '네트워크 오류가 발생했습니다. 서버가 켜져 있는지 확인해 주세요.',
    }
  }

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>

  if (!res.ok) {
    const serverError =
      typeof data.error === 'string' ? data.error : undefined
    return {
      ok: false,
      status: res.status,
      error: mapLoginError(res.status, serverError),
    }
  }

  const accessToken =
    (typeof data.accessToken === 'string' && data.accessToken) ||
    (typeof data.token === 'string' && data.token) ||
    ''

  if (!accessToken) {
    return {
      ok: false,
      status: res.status,
      error: '토큰을 받지 못했습니다.',
    }
  }

  const user =
    data.user && typeof data.user === 'object'
      ? (data.user as StoredUser)
      : {}

  return { ok: true, accessToken, user }
}
