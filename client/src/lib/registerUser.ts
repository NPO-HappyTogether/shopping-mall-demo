import { apiUrl } from '@/lib/api'

export type RegisterUserPayload = {
  email: string
  name: string
  password: string
  user_type?: string
}

export type RegisterUserSuccess = {
  ok: true
  status: number
  user: Record<string, unknown>
}

export type RegisterUserFailure = {
  ok: false
  status: number
  error: string
  details?: string[]
}

export type RegisterUserResult = RegisterUserSuccess | RegisterUserFailure

/**
 * `POST /api/users` — 서버 `createUser`와 동일한 본문으로 회원을 생성합니다.
 */
export async function registerUser(
  payload: RegisterUserPayload,
): Promise<RegisterUserResult> {
  const body = {
    email: payload.email.trim(),
    name: payload.name.trim(),
    password: payload.password,
    user_type: payload.user_type ?? 'customer',
  }

  const res = await fetch(apiUrl('/api/users'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>

  if (!res.ok) {
    const details = Array.isArray(data.details)
      ? (data.details as string[])
      : undefined
    const error =
      typeof data.error === 'string'
        ? data.error
        : `가입에 실패했습니다. (${res.status})`
    return { ok: false as const, status: res.status, error, details }
  }

  return { ok: true as const, status: res.status, user: data }
}
