import { authRouter } from "./auth.js";
import { cartRouter } from "./cart.js";
import { healthRouter } from "./health.js";
import { ordersRouter } from "./orders.js";
import { productsRouter } from "./products.js";
import { usersRouter } from "./users.js";

/** Express app에 API 라우터 등록 */
export function registerRoutes(app) {
  app.use("/api", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/cart", cartRouter);
  app.use("/api/orders", ordersRouter);
}

export {
  authRouter,
  cartRouter,
  healthRouter,
  ordersRouter,
  productsRouter,
  usersRouter,
};
