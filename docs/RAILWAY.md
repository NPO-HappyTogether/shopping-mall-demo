# Railway 환경설정 (API 서버)

GitHub: `NPO-HappyTogether/shopping-mall-demo` · Root Directory: **`server`**

## 서비스 설정 (대시보드)

| 항목 | 값 |
|------|-----|
| Root Directory | `server` (루트 `/` 이면 Railpack 오류) |
| Start Command | `npm run start:prod` |
| Build Command | `npm ci --omit=dev` |
| Healthcheck Path | `/health` |
| Healthcheck Timeout | 300 |
| Public Networking | 켜기 |

설정 파일: [`server/railway.json`](../server/railway.json)

---

## Variables — 필수

Railway → Service → **Variables**에 추가 (.env 파일 업로드 금지).  
전체 변수 표: [ENV.md](./ENV.md)

| 변수 | 값 예시 | 없을 때 |
|------|---------|---------|
| `NODE_ENV` | `production` | prod 동작·Secure 쿠키 |
| **`MONGODB_ATLAS_URL`** | `mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/` | DB/세션 실패 |
| `MONGODB_URI` | 로컬만: `mongodb://127.0.0.1:27017/shopping-mall-demo` | Atlas 없을 때만 |
| `JWT_SECRET` | 32자 이상 랜덤 | 인증 불가 |
| `SESSION_SECRET` | 32자 이상 랜덤 (또는 JWT와 동일 가능) | 세션 스토어 실패 |
| `TRUST_PROXY` | `1` | HTTPS 프록시 환경 권장 |

| 변수 | 설명 |
|------|------|
| `PORT` | Railway가 **자동 주입**. 직접 `5000` 고정하지 말 것 |
| `HOST` | 선택, 기본 `0.0.0.0` |

---

## Variables — Vercel 연동 + 결제

| 변수 | 값 예시 |
|------|---------|
| `CORS_ORIGINS` | `https://your-app.vercel.app` (쉼표로 여러 URL, 끝 `/` 없음) |
| `PORTONE_IMP_KEY` | PortOne REST API Key |
| `PORTONE_IMP_SECRET` | PortOne REST API Secret |

Vercel URL 확정 후 `CORS_ORIGINS`에 반드시 추가.

---

## Variables — 선택

| 변수 | 기본값 |
|------|--------|
| `JWT_ACCESS_EXPIRES_IN` | `1h` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `BCRYPT_SALT_ROUNDS` | `10` |
| `SESSION_COOKIE_SECURE` | production에서 자동 secure |
| `SESSION_COOKIE_SAMESITE` | 미설정 시 `CORS_ORIGINS` 있으면 `none`, 없으면 `lax` |

---

## Variables — 넣지 않기

| 변수 | 이유 |
|------|------|
| `SERVE_CLIENT` | 프론트는 Vercel |
| `CLIENT_DIST` | 프론트는 Vercel |

---

## API 확인 (배포 후)

Railway **Settings → Networking → Public URL** = API 베이스 (별도 env 없음).

| URL | 기대 응답 |
|-----|-----------|
| `https://<railway-url>/health` | `{"ok":true,"db":"connected"}` |
| `https://<railway-url>/api/health` | 동일 |
| `https://<railway-url>/api/products/public` | 상품 JSON 배열 |

### 등록된 API prefix

| 경로 | 용도 |
|------|------|
| `/api/health` | 헬스체크 |
| `/api/auth` | 로그인, refresh, logout, me |
| `/api/users` | 회원가입 |
| `/api/products` | 상품 (+ `/public`) |
| `/api/cart` | 장바구니 |
| `/api/orders` | 주문 (+ `/admin`) |

### 외부 API (서버 → PortOne)

코드 고정 URL:

- `https://api.iamport.kr/users/getToken`
- `https://api.iamport.kr/payments`

`PORTONE_IMP_KEY` / `PORTONE_IMP_SECRET` 없으면 결제 검증 503.

---

## Vercel 연동

Railway Public URL을 Vercel **Production** Variables에:

```
VITE_API_URL=https://<railway-public-url>
```

(끝 슬래시 없음) · 변경 후 Vercel **Redeploy** 필수.

---

## Healthcheck 실패 시

1. Variables: `MONGODB_ATLAS_URL`(또는 `MONGODB_URI`), `JWT_SECRET` 확인
2. Root Directory = `server`
3. Deploy Logs: `Server listening on http://0.0.0.0:...`
4. MongoDB Atlas → Network Access → `0.0.0.0/0` 허용
5. Redeploy 후 `/health` 브라우저 접속

---

## 배포 순서

1. Railway 배포 → Public URL 복사  
2. Railway `CORS_ORIGINS` = Vercel URL  
3. Vercel 배포 (`VITE_API_URL` = Railway URL)  
4. PortOne 리다이렉트 = `https://<vercel>/checkout/complete`  
5. 로그인 · 주문 · 결제 테스트  

템플릿: [`server/.env.example`](../server/.env.example)
