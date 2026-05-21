import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  clearAuth,
  clearSavedEmail,
  getAccessToken,
  getSavedEmail,
  setAccessToken,
  setSavedEmail,
  setStoredUser,
  type StoredUser,
} from '@/lib/authStorage'
import { fetchMe } from '@/lib/fetchMe'
import { BRAND_LOGO_SRC, BRAND_NAME } from '@/lib/brand'
import { loginUser } from '@/lib/loginUser'
import './LoginPage.css'

function IconLinkedIn() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#0A66C2"
        d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z"
      />
    </svg>
  )
}

function IconFacebook() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#1877F2"
        d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07c0 6.02 4.39 11.02 10.13 11.93v-8.44H7.08v-3.5h3.05V9.41c0-3.01 1.79-4.67 4.53-4.67 1.31 0 2.68.23 2.68.23v2.95h-1.51c-1.49 0-1.95.92-1.95 1.87v2.24h3.32l-.53 3.5h-2.79v8.44C19.61 23.09 24 18.09 24 12.07z"
      />
    </svg>
  )
}

function IconGoogle() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo =
    (location.state as { from?: string } | null)?.from ?? '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberId, setRememberId] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authGate, setAuthGate] = useState<'checking' | 'guest' | 'authenticated'>(
    () => (getAccessToken() ? 'checking' : 'guest'),
  )
  const [authenticatedUser, setAuthenticatedUser] = useState<StoredUser | null>(
    null,
  )

  useEffect(() => {
    const saved = getSavedEmail()
    if (saved) {
      setEmail(saved)
      setRememberId(true)
    }
  }, [])

  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      setAuthGate('guest')
      return
    }

    let cancelled = false

    ;(async () => {
      const me = await fetchMe(token)
      if (cancelled) return
      if (me) {
        setStoredUser(me)
        setAuthenticatedUser(me)
        setAuthGate('authenticated')
      } else {
        clearAuth()
        setAuthGate('guest')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError('이메일을 입력해 주세요.')
      return
    }
    if (!password) {
      setError('비밀번호를 입력해 주세요.')
      return
    }

    setSubmitting(true)
    try {
      const result = await loginUser({ email, password })
      if (result.ok === false) {
        setError(result.error)
        return
      }

      setAccessToken(result.accessToken)

      const me = await fetchMe(result.accessToken)
      const user = me ?? result.user
      setStoredUser(user)

      if (rememberId) {
        setSavedEmail(email.trim())
      } else {
        clearSavedEmail()
      }

      navigate(redirectTo, {
        replace: true,
        state: { loggedIn: true, user },
      })
    } catch {
      setError('네트워크 오류가 발생했습니다. 서버가 켜져 있는지 확인해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  if (authGate === 'authenticated' && authenticatedUser) {
    return <Navigate to="/" replace state={{ user: authenticatedUser }} />
  }

  if (authGate === 'checking') {
    return (
      <div className="login-page login-page--checking">
        <p className="login-page__checking" aria-live="polite">
          로그인 상태 확인 중…
        </p>
      </div>
    )
  }

  return (
    <div className="login-page">
      <header className="login-page__header">
        <Link className="login-page__brand" to="/">
          <img
            className="login-page__logo"
            src={BRAND_LOGO_SRC}
            alt={BRAND_NAME}
            width={40}
            height={40}
          />
          <span className="login-page__brand-name">{BRAND_NAME}</span>
        </Link>
        <button type="button" className="login-page__menu" aria-label="메뉴">
          <span />
          <span />
          <span />
          <span className="login-page__menu-label">메뉴</span>
        </button>
      </header>

      <main className="login-page__main">
        <div className="login-page__card">
          <h1 className="login-page__title">환영합니다!</h1>

          <form onSubmit={handleSubmit} noValidate>
            {error !== null && (
              <p className="login-page__error" role="alert">
                {error}
              </p>
            )}

            <div className="login-page__field">
              <label className="login-page__label" htmlFor="email">
                이메일
              </label>
              <input
                id="email"
                className="login-page__input"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="이메일"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
              />
            </div>

            <div className="login-page__field">
              <label className="login-page__label" htmlFor="password">
                비밀번호
              </label>
              <input
                id="password"
                className="login-page__input"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="비밀번호"
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
              />
            </div>

            <div className="login-page__row">
              <label className="login-page__remember">
                <input
                  type="checkbox"
                  checked={rememberId}
                  onChange={(ev) => setRememberId(ev.target.checked)}
                />
                ID 저장
              </label>
              <a className="login-page__forgot" href="#forgot">
                비밀번호를 잊으셨나요?
              </a>
            </div>

            <button
              type="submit"
              className="login-page__submit"
              disabled={submitting}
            >
              {submitting ? '로그인 중…' : '로그인'}
            </button>
          </form>

          <div className="login-page__divider" aria-hidden>
            외부 계정으로 로그인하기
          </div>

          <div className="login-page__social">
            <button
              type="button"
              className="login-page__social-btn"
              aria-label="LinkedIn으로 로그인"
            >
              <IconLinkedIn />
            </button>
            <button
              type="button"
              className="login-page__social-btn"
              aria-label="Facebook으로 로그인"
            >
              <IconFacebook />
            </button>
            <button
              type="button"
              className="login-page__social-btn"
              aria-label="Google로 로그인"
            >
              <IconGoogle />
            </button>
          </div>

          <Link className="login-page__signup" to="/signup">
            회원가입
          </Link>
        </div>
      </main>

      <footer className="login-page__footer">
        <nav className="login-page__footer-nav" aria-label="푸터">
          <Link to="/">HOME</Link>
          <a href="#courses">ALL COURSES</a>
          <a href="#terms">이용약관</a>
        </nav>
        <p className="login-page__footer-copy">
          © Copyright {BRAND_NAME} {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  )
}
