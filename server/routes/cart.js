import { Router } from "express";
import * as cartController from "../controllers/cartController.js";
import {
  authenticateJwtOrSession,
  loadUser,
} from "../middleware/authenticate.js";
// JWT 확인·검증: utils/jwtRequest.js, utils/requestAuth.js

/**
 * 장바구니 API (JWT 또는 세션 인증)
 * @see ../controllers/cartController.js
 * @see ../services/cartService.js
 * @see ../models/cart.js
 */
export const cartRouter = Router();

/** JWT 있으면 Bearer 검증, 없으면 세션으로 인증 */
const cartAuth = [authenticateJwtOrSession, loadUser];

cartRouter.get("/", ...cartAuth, cartController.getCart);
cartRouter.post("/items", ...cartAuth, cartController.addCartItem);
cartRouter.patch("/items/:itemId", ...cartAuth, cartController.updateCartItem);
cartRouter.delete("/items/:itemId", ...cartAuth, cartController.removeCartItem);
cartRouter.delete("/", ...cartAuth, cartController.clearCart);
