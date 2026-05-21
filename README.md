# Hapvi Together Mall

React(Vite) + Express + MongoDB 쇼핑몰 데모입니다.

## 빠른 시작 (로컬 개발)

```bash
# 1. 환경 변수
# server/.env.example → server/.env
# client/.env.example → client/.env

# 2. API 서버
cd server && npm install && npm run dev

# 3. 프론트 (다른 터미널)
cd client && npm install && npm run dev
```

- 프론트: http://localhost:5173  
- API: http://localhost:5000  

## 프로덕션 (한 서버에서 API + 정적 파일)

```bash
# 루트에서
npm run start:prod
```

`client/dist` 빌드 후 `NODE_ENV=production`으로 서버가 API와 SPA를 함께 제공합니다.

자세한 배포·환경 변수·체크리스트는 [DEPLOY.md](./DEPLOY.md)를 참고하세요.

- **Railway (API):** [docs/RAILWAY.md](./docs/RAILWAY.md)
- **Vercel (프론트):** `VITE_API_URL` = Railway Public URL
