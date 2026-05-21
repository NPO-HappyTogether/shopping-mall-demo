import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  clearAuth,
  getAccessToken,
  getStoredUser,
  isLoggedIn,
  setStoredUser,
  type StoredUser,
} from '@/lib/authStorage'
import { fetchMe } from '@/lib/fetchMe'
import { logoutUser } from '@/lib/logoutUser'

export function useCurrentUser(initialUser?: StoredUser | null) {
  const [user, setUser] = useState<StoredUser | null>(
    () => initialUser ?? getStoredUser(),
  )
  const [loading, setLoading] = useState(() => Boolean(getAccessToken()))

  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      setLoading(false)
      if (!initialUser) setUser(null)
      return
    }

    let cancelled = false

    ;(async () => {
      setLoading(true)
      const me = await fetchMe(token)
      if (cancelled) return
      if (me) {
        setStoredUser(me)
        setUser(me)
      } else {
        clearAuth()
        setUser(null)
      }
      setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [initialUser])

  const displayName = useMemo(() => {
    const name = user?.name
    return typeof name === 'string' && name.trim() ? name.trim() : null
  }, [user?.name])

  const loggedIn = isLoggedIn() && Boolean(user)
  const isAdmin = loggedIn && user?.user_type === 'admin'

  const logout = useCallback(async () => {
    await logoutUser()
    setUser(null)
    setLoading(false)
  }, [])

  return { user, loading, loggedIn, displayName, isAdmin, logout }
}
