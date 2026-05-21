import { apiUrl } from '@/lib/api'
import { clearAuth } from '@/lib/authStorage'

/**
 * 서버 `POST /api/auth/logout` + 클라이언트 토큰·유저 정보 삭제
 */
export async function logoutUser(): Promise<void> {
  try {
    await fetch(apiUrl('/api/auth/logout'), {
      method: 'POST',
      credentials: 'include',
    })
  } catch {
    // 네트워크 실패해도 로컬은 정리
  }
  clearAuth()
}
