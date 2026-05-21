import { Router } from "express";
import * as ordersController from "../controllers/ordersController.js";
import {
  authenticateJwt,
  authenticateJwtOrSession,
  loadUser,
  requireAdmin,
} from "../middleware/authenticate.js";

/**
 * 주문 CRUD API
 * @see ../controllers/ordersController.js
 * @see ../services/orderService.js
 * @see ../models/order.js
 */
export const ordersRouter = Router();

const orderAuth = [authenticateJwtOrSession, loadUser];
const adminAuth = [authenticateJwt, loadUser, requireAdmin];

/** 관리자 CRUD — /admin 경로를 /:id 보다 먼저 등록 */
ordersRouter.get("/admin", ...adminAuth, ordersController.listOrdersAdmin);
ordersRouter.get("/admin/:id", ...adminAuth, ordersController.getOrderAdmin);
ordersRouter.patch("/admin/:id", ...adminAuth, ordersController.updateOrderAdmin);
ordersRouter.delete("/admin/:id", ...adminAuth, ordersController.deleteOrderAdmin);

/** 회원 CRUD */
ordersRouter.post("/", ...orderAuth, ordersController.createOrder);
ordersRouter.get("/", ...orderAuth, ordersController.listOrders);
ordersRouter.get("/number/:orderNumber", ...orderAuth, ordersController.getOrderByNumber);
ordersRouter.patch("/:id/cancel", ...orderAuth, ordersController.cancelOrder);
ordersRouter.get("/:id", ...orderAuth, ordersController.getOrder);
ordersRouter.patch("/:id", ...orderAuth, ordersController.updateOrder);
ordersRouter.delete("/:id", ...orderAuth, ordersController.deleteOrder);
