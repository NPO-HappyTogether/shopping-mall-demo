# 환경 변수 정리

비밀값은 **`.env` 파일을 Git에 올리지 않습니다.** 각 호스팅 대시보드 또는 로컬 `server/.env`, `client/.env`에 직접 입력하세요.

---

## 어디에 넣나요?

| 변수 그룹 | 로컬 파일 | Railway (server) | Vercel (client) |
|-----------|-----------|------------------|-----------------|
| MongoDB | `server/.env` | **Variables** | 넣지 않음 |
| JWT / 세션 / CORS | `server/.env` | **Variables** | 넣지 않음 |
| PortOne REST (결제 검증) | `server/.env` | **Variables** | 넣지 않음 |
| API URL | (비움, Vite proxy) | (Public URL 자동) | **`VITE_API_URL`** |
| PortOne V2 (결제 UI) | `client/.env` | 넣지 않음 | **Variables** |
| Cloudinary (이미지) | `client/.env` | 넣지 않음 | **Variables** |

---

## Server — `server/.env` / Railway Variables

템플릿: [`server/.env.example`](../server/.env.example)

### MongoDB (연결 우선순위)

1. **`MONGODB_ATLAS_URL`** — Atlas 사용 시 (권장, Railway·로컬 공통)
2. **`MONGODB_URI`** — 위가 없을 때만 (로컬 Mongo 등)
3. 둘 다 없으면 → `mongodb://127.0.0.1:27017/shoping-mall`

```
# Railway / 로컬 (Atlas)
MONGODB_ATLAS_URL=mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/

# 로컬 Mongo만 쓸 때 (Atlas 줄 비우기)
# MONGODB_URI=mongodb://127.0.0.1:27017/shoping-mall
```

- DB 이름이 URI에 없으면 코드가 **`shoping-mall`** 을 붙입니다.
- **`MONGODB_ATLAS_URL`은 `client/.env`에 넣지 마세요.** 서버만 읽습니다.

### 필수 (배포)

| 변수 | 예시 | 설명 |
|------|------|------|
| `NODE_ENV` | `production` | Railway 필수 |
| `JWT_SECRET` | 긴 랜덤 문자열 | JWT 서명 |
| `SESSION_SECRET` | 긴 랜덤 문자열 | 세션 (없으면 JWT 사용) |
| `TRUST_PROXY` | `1` | Railway HTTPS |

### Vercel + Railway 분리 시 추가

| 변수 | 예시 |
|------|------|
| `CORS_ORIGINS` | `https://your-app.vercel.app` |
| `PORTONE_IMP_KEY` | PortOne REST API Key |
| `PORTONE_IMP_SECRET` | PortOne REST Secret |

### 선택 / 넣지 않기

| 변수 | 비고 |
|------|------|
| `PORT` | Railway 자동 주입 (5000 고정 X) |
| `JWT_ACCESS_EXPIRES_IN` 등 | 기본값 있음 |
| `SERVE_CLIENT`, `CLIENT_DIST` | Vercel 사용 시 **넣지 않음** |

---

## Client — `client/.env` / Vercel Variables

템플릿: [`client/.env.example`](../client/.env.example)

빌드 시점에 `VITE_*`만 번들에 포함됩니다.

| 변수 | 필수 | 설명 |
|------|------|------|
| `VITE_API_URL` | Vercel+Railway 시 **예** | Railway Public URL (끝 `/` 없음) |
| `VITE_PORTONE_STORE_ID` | 결제 시 | PortOne V2 Store ID |
| `VITE_PORTONE_CHANNEL_KEY` | 결제 시 | PortOne V2 채널 키 |
| `VITE_PORTONE_REDIRECT_URL` | 선택 | `https://<vercel>/checkout/complete` |
| `VITE_CLOUDINARY_CLOUD_NAME` | 이미지 업로드 시 | |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | 이미지 업로드 시 | |
| `VITE_CLOUDINARY_API_KEY` | 선택 | |
| `VITE_CLOUDINARY_FOLDER` | 선택 | 기본 `products` |

로컬 개발(Vite만): `VITE_API_URL` 비워 두면 `/api` → `localhost:5000` 프록시.

---

## Railway 변수 이름 (복사용)

```
NODE_ENV=production
MONGODB_ATLAS_URL=mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/
JWT_SECRET=<랜덤>
SESSION_SECRET=<랜덤>
TRUST_PROXY=1
CORS_ORIGINS=https://your-app.vercel.app
PORTONE_IMP_KEY=<키>
PORTONE_IMP_SECRET=<시크릿>
```

## Vercel 변수 이름 (복사용)

```
VITE_API_URL=https://<railway-public-url>
VITE_PORTONE_STORE_ID=store-...
VITE_PORTONE_CHANNEL_KEY=channel-key-...
VITE_CLOUDINARY_CLOUD_NAME=...
VITE_CLOUDINARY_UPLOAD_PRESET=...
```

---

## 로컬 오류: `querySrv ECONNREFUSED`

`mongodb+srv://` 연결 시 Windows에서 **Node DNS**가 SRV 조회에 실패할 수 있습니다 (nslookup은 되는데 Node만 실패).

**해결 (택1):**

1. 서버 재시작 — Windows에서는 코드가 `8.8.8.8` / `1.1.1.1` DNS를 자동 사용합니다.
2. `server/.env`에 `MONGODB_DNS_SERVERS=8.8.8.8,1.1.1.1` 추가
3. Atlas → Connect → **Standard connection string**을 복사해 `MONGODB_URI`에 넣고 `MONGODB_ATLAS_URL`은 비우기

---

## 배포 후 확인

1. Railway: `https://<railway>/health` → `"db":"connected"`
2. Vercel: 로그인·상품 목록·결제 테스트
3. 서버 로그: `MongoDB connected (Atlas (MONGODB_ATLAS_URL))`

관련 문서: [DEPLOY.md](../DEPLOY.md) · [RAILWAY.md](./RAILWAY.md)
