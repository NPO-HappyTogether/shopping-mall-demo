/**
 * API base URL. In development, leave `VITE_API_URL` unset to use the Vite
 * dev proxy (`/api` → `http://localhost:5000`).
 */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL?.trim() ?? ''
  return raw.replace(/\/$/, '')
}

/** Build an absolute or same-origin URL for an API path (e.g. `/api/health`). */
export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  const base = getApiBaseUrl()
  return base ? `${base}${p}` : p
}
