# 배포 가이드 (Hapvi Together Mall)

## 배포에 포함할 것

| 경로 | 용도 |
|------|------|
| `client/src`, `client/public`, `client/package.json` | 프론트 소스 |
| `server/` (소스 전체) | API 서버 |
| `package.json` (루트) | 통합 빌드/실행 스크립트 |
| `*.env.example` | 환경 변수 템플릿 |

## 배포에 넣지 말 것

| 항목 | 이유 |
|------|------|
| `**/node_modules/` | `npm ci`로 설치 |
| `client/dist/` | 빌드 시 생성 (또는 CI에서 생성 후 서버에 배치) |
| `**/.env` | 비밀값 — 호스팅 환경 변수 사용 |
| `.cursor/` | IDE 전용 |

---

## 방식 A — 한 서버 (Express가 프론트+API)

권장: 소규모 VPS, Render, Railway 등 단일 프로세스.

```bash
# 루트
cp server/.env.example server/.env   # 값 직접 입력
cp client/.env.example client/.env # VITE_* 빌드 시 필요

cd client && npm ci && npm run build
cd ../server && npm ci --omit=dev

# server/.env 예시
# NODE_ENV=production
# PORT=5000
# MONGODB_URI=mongodb+srv://...
# JWT_SECRET=...
# SESSION_SECRET=...
# CORS_ORIGINS=https://your-domain.com
# TRUST_PROXY=1                    # HTTPS 리버스 프록시 뒤일 때
# SERVE_CLIENT=1                   # dist 서빙 (production이면 dist 있을 때 자동)

cd server && npm run start:prod
```

또는 루트에서:

```bash
npm run start:prod
```

- 브라우저: `http://localhost:5000` (또는 설정한 `PORT`)
- API: 같은 origin `/api/...` → `VITE_API_URL` **비우기** 권장

---

## 방식 B — 프론트/백 분리

| 구분 | 호스팅 | 설정 |
|------|--------|------|
| API | `server/` | `npm ci --omit=dev` → `npm run start:prod` |
| SPA | `client/dist` | Vercel/Netlify/S3 등에 업로드 |

`client/.env` (빌드 시):

```
VITE_API_URL=https://api.your-domain.com
VITE_PORTONE_STORE_ID=store-...
VITE_PORTONE_CHANNEL_KEY=channel-key-...
```

`server/.env`:

```
CORS_ORIGINS=https://www.your-domain.com
TRUST_PROXY=1
NODE_ENV=production
```

---

## 환경 변수 체크리스트

### Server (`server/.env`)

- [ ] `MONGODB_URI`
- [ ] `JWT_SECRET`, `SESSION_SECRET` (긴 랜덤 문자열)
- [ ] `PORTONE_IMP_KEY`, `PORTONE_IMP_SECRET` (결제 검증)
- [ ] `CORS_ORIGINS` (분리 배포 시 필수)
- [ ] `TRUST_PROXY=1` (Nginx/Cloudflare HTTPS 뒤)
- [ ] `SESSION_COOKIE_SECURE=1` (HTTPS, 필요 시)
- [ ] `SESSION_COOKIE_DOMAIN` (서브도메인 공유 시, 선택)

### Client (`client/.env` — **빌드 전**)

- [ ] `VITE_PORTONE_STORE_ID`, `VITE_PORTONE_CHANNEL_KEY`
- [ ] `VITE_API_URL` (분리 배포 시만)
- [ ] `VITE_CLOUDINARY_*` (상품 이미지 업로드)

### 에셋

- [ ] `client/public/logo.svg` — Navbar/Admin/로그인 로고

---

## Git 사용

```bash
git init
git add .
git commit -m "Initial commit"
```

`.gitignore`가 `node_modules`, `dist`, `.env`를 제외합니다.

---

## Vercel + Railway (웹 대시보드 배포)

CLI 없이 GitHub 연동만으로 배포할 때의 설정입니다.

### 사전: GitHub에 코드 push

Vercel·Railway 모두 저장소 연결 방식이므로 `git push`까지 완료해 두세요.

### 1) Railway (server 먼저)

| 대시보드 항목 | 값 |
|---------------|-----|
| Root Directory | `server` |
| Start Command | `npm run start:prod` |
| (Build) | 비워 두거나 `npm install` |

**Variables** (`server/.env.example` 참고):

- `NODE_ENV` = `production`
- `MONGODB_URI`, `JWT_SECRET`, `SESSION_SECRET`
- `CORS_ORIGINS` = `https://your-app.vercel.app` (Vercel URL 확정 후, 쉼표로 여러 개 가능)
- `TRUST_PROXY` = `1`
- `PORTONE_IMP_KEY`, `PORTONE_IMP_SECRET`

넣지 않을 것: `SERVE_CLIENT`, `CLIENT_DIST` (프론트는 Vercel)

배포 후 **Settings → Networking → Public URL** 복사 → `https://xxx.up.railway.app`

### 2) Vercel (client)

| 대시보드 항목 | 값 |
|---------------|-----|
| Root Directory | `client` |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

**Environment Variables** (Production):

- `VITE_API_URL` = Railway Public URL (끝 `/` 없음)
- `VITE_PORTONE_STORE_ID`, `VITE_PORTONE_CHANNEL_KEY`
- `VITE_CLOUDINARY_*` (사용 시)

`client/vercel.json` — SPA 새로고침용 rewrite (저장소에 포함됨)

변수 변경 후 **Deployments → Redeploy** (Vite는 빌드 시 env 고정)

### 3) PortOne

- 리다이렉트 URL: `https://<vercel-domain>/checkout/complete`
- (선택) Vercel에 `VITE_PORTONE_REDIRECT_URL` 동일 값

### 순서 요약

Railway 배포 → Public URL 확보 → Railway `CORS_ORIGINS`에 Vercel URL → Vercel 배포 → 로그인/결제 테스트

---

## 아키텍처

- 프론트: Vite + React (`client/`)
- 백엔드: Express + MongoDB (`server/`)
- 결제: PortOne V2 (`@portone/browser-sdk`)
