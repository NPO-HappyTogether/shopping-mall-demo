import { Router } from "express";
import * as productsController from "../controllers/productsController.js";
import {
  authenticateJwt,
  loadUser,
  requireAdmin,
} from "../middleware/authenticate.js";

export const productsRouter = Router();

const adminAuth = [authenticateJwt, loadUser, requireAdmin];

/** 공개 API (인증 없음) — /public 을 /:id 보다 먼저 등록 */
productsRouter.get("/public", productsController.listPublicProducts);
productsRouter.get("/public/:id", productsController.getPublicProductById);
productsRouter.get("/categories", productsController.listCategories);

/** 관리자 API */
productsRouter.get("/", ...adminAuth, productsController.listProducts);
productsRouter.get("/sku/:sku", ...adminAuth, productsController.getProductBySku);
productsRouter.get("/:id", ...adminAuth, productsController.getProductById);
productsRouter.post("/", ...adminAuth, productsController.createProduct);
productsRouter.patch("/:id", ...adminAuth, productsController.updateProduct);
productsRouter.delete("/:id", ...adminAuth, productsController.deleteProduct);
