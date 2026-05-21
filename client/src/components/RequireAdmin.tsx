import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useCurrentUser } from '@/hooks/useCurrentUser'

type RequireAdminProps = {
  children: ReactNode
}

/** 관리자만 자식 라우트 접근 가능 — 그 외는 로그인 또는 메인으로 이동 */
export function RequireAdmin({ children }: RequireAdminProps) {
  const { loading, loggedIn, isAdmin } = useCurrentUser()

  if (loading) {
    return <p className="app-routes-fallback">로딩 중…</p>
  }

  if (!loggedIn) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}
