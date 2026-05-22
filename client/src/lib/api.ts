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

/** fetch 실패(네트워크·CORS·서버 다운) 시 안내 문구 */
export function getNetworkErrorMessage(): string {
  const base = getApiBaseUrl()
  if (base) {
    return `API 서버(${base})에 연결할 수 없습니다. Railway 배포 상태와 VITE_API_URL을 확인해 주세요.`
  }
  return 'API 서버에 연결할 수 없습니다. server 폴더에서 npm run dev 를 실행했는지 확인해 주세요.'
}
