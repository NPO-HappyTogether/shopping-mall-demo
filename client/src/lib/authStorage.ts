const ACCESS_TOKEN_KEY = 'accessToken'
const SAVED_EMAIL_KEY = 'savedEmail'
const USER_KEY = 'user'

export type StoredUser = {
  _id?: string
  email?: string
  name?: string
  user_type?: string
  phone?: string
  address?: string
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export function clearAccessToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
}

export function getSavedEmail(): string | null {
  return localStorage.getItem(SAVED_EMAIL_KEY)
}

export function setSavedEmail(email: string): void {
  localStorage.setItem(SAVED_EMAIL_KEY, email)
}

export function clearSavedEmail(): void {
  localStorage.removeItem(SAVED_EMAIL_KEY)
}

export function getStoredUser(): StoredUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredUser
  } catch {
    return null
  }
}

export function setStoredUser(user: StoredUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearStoredUser(): void {
  localStorage.removeItem(USER_KEY)
}

export function clearAuth(): void {
  clearAccessToken()
  clearStoredUser()
}

export function isLoggedIn(): boolean {
  return Boolean(getAccessToken())
}
