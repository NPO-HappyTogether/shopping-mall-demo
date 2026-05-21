import { apiUrl } from '@/lib/api'
import type { StoredUser } from '@/lib/authStorage'

/**
 * 서버 `GET /api/users/me` — JWT로 로그인 사용자 확인
 */
export async function fetchMe(
  accessToken: string,
): Promise<StoredUser | null> {
  const res = await fetch(apiUrl('/api/users/me'), {
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: 'include',
  })
  if (!res.ok) return null
  const data = (await res.json()) as { user?: StoredUser }
  return data.user ?? null
}
