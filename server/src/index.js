import "dotenv/config";
import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";

const port = Number(process.env.PORT) || 5000;
const host = process.env.HOST ?? "0.0.0.0";
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error(
    "Missing MONGODB_URI — server will start for healthcheck but DB/API will fail. Set MONGODB_URI in Railway Variables.",
  );
}

if (!process.env.SESSION_SECRET && !process.env.JWT_SECRET) {
  console.error(
    "Missing SESSION_SECRET or JWT_SECRET — set in Railway Variables.",
  );
}

const app = createApp();
const isProd = process.env.NODE_ENV === "production";
const server = app.listen(port, host, () => {
  console.log(`Server listening on http://${host}:${port}`);
  if (isProd || process.env.SERVE_CLIENT === "1") {
    console.log(`SPA: same origin (client/dist) when built`);
  }
  console.log(`Health check: http://localhost:${port}/api/health`);
  console.log(`Users API: POST http://localhost:${port}/api/users (회원가입)`);
  console.log(`Auth API: POST http://localhost:${port}/api/auth/login (로그인)`);
  console.log(`         POST http://localhost:${port}/api/auth/refresh (토큰 갱신)`);
  console.log(`         POST http://localhost:${port}/api/auth/logout (로그아웃)`);
  console.log(`         GET  http://localhost:${port}/api/auth/me (JWT 사용자)`);
  console.log(`         GET  http://localhost:${port}/api/auth/session (쿠키 세션)`);
  console.log(`Products API: http://localhost:${port}/api/products`);
  console.log(`         GET  http://localhost:${port}/api/products/public (공개 전체 목록)`);
  console.log(`         GET  http://localhost:${port}/api/products/public/:id (공개 상품 상세)`);
  console.log(`         GET  http://localhost:${port}/api/products (관리자 목록·페이지당 4개)`);
  console.log(`         POST http://localhost:${port}/api/products (상품 등록)`);
  console.log(`         PATCH http://localhost:${port}/api/products/:id (상품 수정)`);
  console.log(`         DELETE http://localhost:${port}/api/products/:id (상품 삭제)`);
  console.log(`Cart API (로그인 필요): http://localhost:${port}/api/cart`);
  console.log(`         GET    http://localhost:${port}/api/cart`);
  console.log(`         POST   http://localhost:${port}/api/cart/items (담기)`);
  console.log(`         PATCH  http://localhost:${port}/api/cart/items/:itemId (수량 변경)`);
  console.log(`         DELETE http://localhost:${port}/api/cart/items/:itemId (항목 삭제)`);
  console.log(`Orders API (로그인 필요): http://localhost:${port}/api/orders`);
  console.log(`         POST   http://localhost:${port}/api/orders (Create — 장바구니 주문)`);
  console.log(`         GET    http://localhost:${port}/api/orders (Read — 내 목록)`);
  console.log(`         GET    http://localhost:${port}/api/orders/number/:orderNumber`);
  console.log(`         GET    http://localhost:${port}/api/orders/:id (Read — 상세)`);
  console.log(`         PATCH  http://localhost:${port}/api/orders/:id (Update — pending)`);
  console.log(`         PATCH  http://localhost:${port}/api/orders/:id/cancel`);
  console.log(`         DELETE http://localhost:${port}/api/orders/:id (Delete — pending)`);
  console.log(`         GET    http://localhost:${port}/api/orders/admin (관리자 목록)`);
  console.log(`         GET    http://localhost:${port}/api/orders/admin/:id`);
  console.log(`         PATCH  http://localhost:${port}/api/orders/admin/:id`);
  console.log(`         DELETE http://localhost:${port}/api/orders/admin/:id`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${port} is already in use. Close the other server or set PORT in .env.`
    );
    console.error(`Check: netstat -ano | findstr :${port}`);
    process.exit(1);
  }
  throw err;
});

if (mongoUri) {
  connectDb(mongoUri)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => {
      console.error(
        "MongoDB connection failed — API is still running; fix MongoDB or MONGODB_URI and restart.",
      );
      console.error(err?.message ?? err);
    });
}
