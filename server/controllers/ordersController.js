import mongoose from "mongoose";
import * as orderService from "../services/orderService.js";

function handleOrderError(err, res) {
  if (err instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ ok: false, error: "Validation failed", details: messages });
  }
  throw err;
}

function sendServiceError(err, res) {
  if (!err.statusCode) return false;
  res.status(err.statusCode).json({ ok: false, error: err.message });
  return true;
}

/** POST /api/orders — 장바구니에서 주문 생성 */
export async function createOrder(req, res, next) {
  try {
    const body = req.body ?? {};

    // 1) imp_uid / merchant_uid 중복 여부
    // 2) PortOne API 결제 금액·상태 검증 (test 결제 제외)
    await orderService.validateOrderBeforeCreate(req.user._id, body);

    const order = await orderService.createOrderFromCart(req.user._id, body);
    res.status(201).json({ ok: true, message: "Order created", order });
  } catch (err) {
    if (handleOrderError(err, res)) return;
    if (sendServiceError(err, res)) return;
    next(err);
  }
}

/** GET /api/orders — 내 주문 목록 (?status=&limit=) */
export async function listOrders(req, res, next) {
  try {
    const { limit, status } = req.query;
    const orders = await orderService.listOrdersForUser(req.user._id, { limit, status });
    res.json({ ok: true, orders, count: orders.length });
  } catch (err) {
    next(err);
  }
}

/** GET /api/orders/number/:orderNumber — 주문번호로 조회 */
export async function getOrderByNumber(req, res, next) {
  try {
    const order = await orderService.getOrderByNumberForUser(
      req.user._id,
      req.params.orderNumber
    );
    res.json({ ok: true, order });
  } catch (err) {
    if (sendServiceError(err, res)) return;
    next(err);
  }
}

/** GET /api/orders/:id — 주문 상세 */
export async function getOrder(req, res, next) {
  try {
    const order = await orderService.getOrderForUser(req.user._id, req.params.id);
    res.json({ ok: true, order });
  } catch (err) {
    if (sendServiceError(err, res)) return;
    next(err);
  }
}

/** PATCH /api/orders/:id — pending 주문 수정 (배송지·메모) */
export async function updateOrder(req, res, next) {
  try {
    const order = await orderService.updateOrderForUser(
      req.user._id,
      req.params.id,
      req.body ?? {}
    );
    res.json({ ok: true, order });
  } catch (err) {
    if (handleOrderError(err, res)) return;
    if (sendServiceError(err, res)) return;
    next(err);
  }
}

/** PATCH /api/orders/:id/cancel — 주문 취소 */
export async function cancelOrder(req, res, next) {
  try {
    const order = await orderService.cancelOrderForUser(
      req.user._id,
      req.params.id,
      req.body?.reason
    );
    res.json({ ok: true, message: "Order cancelled", order });
  } catch (err) {
    if (sendServiceError(err, res)) return;
    next(err);
  }
}

/** DELETE /api/orders/:id — pending 주문 삭제 */
export async function deleteOrder(req, res, next) {
  try {
    const result = await orderService.deleteOrderForUser(req.user._id, req.params.id);
    res.json(result);
  } catch (err) {
    if (sendServiceError(err, res)) return;
    next(err);
  }
}

/** GET /api/orders/admin — 관리자 전체 목록 */
export async function listOrdersAdmin(req, res, next) {
  try {
    const result = await orderService.listAllOrders(req.query);
    res.json({ ok: true, ...result });
  } catch (err) {
    if (sendServiceError(err, res)) return;
    next(err);
  }
}

/** GET /api/orders/admin/:id — 관리자 주문 상세 */
export async function getOrderAdmin(req, res, next) {
  try {
    const order = await orderService.getOrderByIdAdmin(req.params.id);
    res.json({ ok: true, order });
  } catch (err) {
    if (sendServiceError(err, res)) return;
    next(err);
  }
}

/** PATCH /api/orders/admin/:id — 관리자 주문 수정 */
export async function updateOrderAdmin(req, res, next) {
  try {
    const order = await orderService.updateOrderAdmin(req.params.id, req.body ?? {});
    res.json({ ok: true, order });
  } catch (err) {
    if (handleOrderError(err, res)) return;
    if (sendServiceError(err, res)) return;
    next(err);
  }
}

/** DELETE /api/orders/admin/:id — 관리자 주문 삭제 */
export async function deleteOrderAdmin(req, res, next) {
  try {
    const result = await orderService.deleteOrderAdmin(req.params.id);
    res.json(result);
  } catch (err) {
    if (sendServiceError(err, res)) return;
    next(err);
  }
}
