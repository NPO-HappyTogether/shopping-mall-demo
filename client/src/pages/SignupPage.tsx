import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser } from '@/lib/registerUser'
import './SignupPage.css'

function IconUser() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4ZM4 20a8 8 0 0 1 16 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconMail() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M3 7l9 6 9-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconLock() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="5"
        y="10"
        width="14"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 10V7a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconEye() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function IconEyeOff() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10.3 10.3 0 0 1 12 5c6 0 10 7 10 7a18.4 18.4 0 0 1-4.9 5.1M6.2 6.2C3.8 8.1 2 12 2 12s4 7 10 7a9.7 9.7 0 0 0 4.3-1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function isPasswordStrong(pw: string): boolean {
  if (pw.length < 8) return false
  const hasLetter = /[A-Za-z]/.test(pw)
  const hasDigit = /\d/.test(pw)
  const hasSpecial = /[^A-Za-z0-9\s]/.test(pw)
  return hasLetter && hasDigit && hasSpecial
}

export function SignupPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showPw2, setShowPw2] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [agreeMarketing, setAgreeMarketing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allAgreed = agreeTerms && agreePrivacy && agreeMarketing

  function toggleAgreeAll() {
    const next = !allAgreed
    setAgreeTerms(next)
    setAgreePrivacy(next)
    setAgreeMarketing(next)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('이름을 입력해 주세요.')
      return
    }
    if (!email.trim()) {
      setError('이메일을 입력해 주세요.')
      return
    }
    if (!isPasswordStrong(password)) {
      setError('비밀번호는 8자 이상이며 영문, 숫자, 특수문자를 포함해야 합니다.')
      return
    }
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    if (!agreeTerms || !agreePrivacy) {
      setError('필수 약관에 동의해 주세요.')
      return
    }

    setSubmitting(true)
    try {
      const result = await registerUser({
        email: email.trim(),
        name: name.trim(),
        password,
        user_type: 'customer',
      })
      if (result.ok === true) {
        navigate('/', { replace: true, state: { signedUp: true } })
      } else if (result.ok === false) {
        setError(result.details?.join(' ') ?? result.error)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="signup">
      <div className="signup__inner">
        <h1 className="signup__title">회원가입</h1>
        <p className="signup__subtitle">
          새로운 계정을 만들어 쇼핑을 시작하세요
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {error !== null && (
            <p className="signup__error" role="alert">
              {error}
            </p>
          )}

          <div className="signup__field">
            <label className="signup__label" htmlFor="name">
              이름
            </label>
            <div className="signup__input-wrap">
              <IconUser />
              <input
                id="name"
                className="signup__input"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="이름을 입력하세요"
                value={name}
                onChange={(ev) => setName(ev.target.value)}
              />
            </div>
          </div>

          <div className="signup__field">
            <label className="signup__label" htmlFor="email">
              이메일
            </label>
            <div className="signup__input-wrap">
              <IconMail />
              <input
                id="email"
                className="signup__input"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="your@email.com"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
              />
            </div>
          </div>

          <div className="signup__field">
            <label className="signup__label" htmlFor="password">
              비밀번호
            </label>
            <div className="signup__input-wrap">
              <IconLock />
              <input
                id="password"
                className="signup__input"
                name="password"
                type={showPw ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
              />
              <button
                type="button"
                className="signup__toggle"
                aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 보기'}
                onClick={() => setShowPw((v) => !v)}
              >
                {showPw ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
            <p className="signup__hint">
              8자 이상, 영문, 숫자, 특수문자 포함
            </p>
          </div>

          <div className="signup__field">
            <label className="signup__label" htmlFor="confirmPassword">
              비밀번호 확인
            </label>
            <div className="signup__input-wrap">
              <IconLock />
              <input
                id="confirmPassword"
                className="signup__input"
                name="confirmPassword"
                type={showPw2 ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="비밀번호를 다시 입력하세요"
                value={confirmPassword}
                onChange={(ev) => setConfirmPassword(ev.target.value)}
              />
              <button
                type="button"
                className="signup__toggle"
                aria-label={showPw2 ? '비밀번호 숨기기' : '비밀번호 보기'}
                onClick={() => setShowPw2((v) => !v)}
              >
                {showPw2 ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
          </div>

          <hr className="signup__divider" />

          <div
            className="signup__field signup__field--checks"
            role="group"
            aria-labelledby="signup-agreements-label"
          >
            <div className="signup__label" id="signup-agreements-label">
              약관 동의
            </div>
            <div className="signup__checks">
              <div className="signup__check-row">
                <label className="signup__check-label">
                  <input
                    type="checkbox"
                    checked={allAgreed}
                    onChange={toggleAgreeAll}
                  />
                  <strong>전체 동의</strong>
                </label>
              </div>
              <div className="signup__check-row signup__check-row--indent">
                <label className="signup__check-label">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(ev) => setAgreeTerms(ev.target.checked)}
                  />
                  이용약관 동의 (필수)
                </label>
                <button type="button" className="signup__link-btn">
                  보기
                </button>
              </div>
              <div className="signup__check-row signup__check-row--indent">
                <label className="signup__check-label">
                  <input
                    type="checkbox"
                    checked={agreePrivacy}
                    onChange={(ev) => setAgreePrivacy(ev.target.checked)}
                  />
                  개인정보처리방침 동의 (필수)
                </label>
                <button type="button" className="signup__link-btn">
                  보기
                </button>
              </div>
              <div className="signup__check-row signup__check-row--indent">
                <label className="signup__check-label">
                  <input
                    type="checkbox"
                    checked={agreeMarketing}
                    onChange={(ev) => setAgreeMarketing(ev.target.checked)}
                  />
                  마케팅 정보 수신 동의 (선택)
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="signup__submit"
            disabled={submitting}
          >
            {submitting ? '처리 중…' : '회원가입하기'}
          </button>
        </form>

        <Link className="signup__back" to="/">
          메인으로
        </Link>
      </div>
    </div>
  )
}
