import crypto from "crypto";
import mongoose from "mongoose";
import {
  Order,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
} from "../models/order.js";
import { User } from "../models/user.js";
import { clearUserCart, getPopulatedCart } from "./cartService.js";
import { verifyPortOnePayment } from "./portonePaymentService.js";

const FREE_SHIPPING_THRESHOLD = 50_000;
const DEFAULT_SHIPPING_FEE = 3_000;
const DEFAULT_PAGE_SIZE = 20;

function assertValidObjectId(id, label = "id") {
  if (!mongoose.isValidObjectId(id)) {
    const err = new Error(`Invalid ${label}`);
    err.statusCode = 400;
    throw err;
  }
}

function parsePagination(query) {
  let page = Number.parseInt(String(query.page ?? "1"), 10);
  let limit = Number.parseInt(String(query.limit ?? String(DEFAULT_PAGE_SIZE)), 10);
  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(limit) || limit < 1) limit = DEFAULT_PAGE_SIZE;
  if (limit > 100) limit = 100;
  return { page, limit, skip: (page - 1) * limit };
}

export function generateOrderNumber() {
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `ORD-${ymd}-${rand}`;
}

export function calculateShippingFee(subtotal) {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_FEE;
}

function buildPricing(subtotal, discount = 0) {
  const shippingFee = calculateShippingFee(subtotal);
  const safeDiscount = Math.max(0, Number(discount) || 0);
  const total = Math.max(0, subtotal + shippingFee - safeDiscount);
  return { subtotal, shippingFee, discount: safeDiscount, total };
}

function normalizeShippingAddress(input = {}, user) {
  const recipientName = (input.recipientName ?? user?.name ?? "").trim();
  const phone = (input.phone ?? user?.phone ?? "").trim();
  const postalCode = (input.postalCode ?? "").trim();
  const addressLine1 = (input.addressLine1 ?? user?.address ?? "").trim();
  const addressLine2 = (input.addressLine2 ?? "").trim();
  const deliveryMemo = (input.deliveryMemo ?? "").trim();

  if (!recipientName || !phone || !postalCode || !addressLine1) {
    const err = new Error(
      "recipientName, phone, postalCode, and addressLine1 are required"
    );
    err.statusCode = 400;
    throw err;
  }

  return {
    recipientName,
    phone,
    postalCode,
    addressLine1,
    addressLine2,
    deliveryMemo,
  };
}

function mapCartItemsToOrderItems(cartItems) {
  return cartItems
    .filter((entry) => entry.product)
    .map((entry) => {
      const product = entry.product;
      const unitPrice = entry.priceSnapshot ?? product.price ?? 0;
      const quantity = entry.quantity;
      return {
        product: product._id,
        sku: product.sku,
        name: product.name,
        image: product.image,
        category: product.category,
        quantity,
        size: entry.size ?? "",
        color: entry.color ?? "",
        unitPrice,
        lineTotal: unitPrice * quantity,
      };
    });
}

async function resolveCartOrderDraft(userId, body = {}) {
  const user = await User.findById(userId).select("-password").lean();
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const cart = await getPopulatedCart(userId);
  if (!cart.items.length) {
    const err = new Error("Cart is empty");
    err.statusCode = 400;
    throw err;
  }

  const orderItems = mapCartItemsToOrderItems(cart.items);
  if (orderItems.length === 0) {
    const err = new Error("No valid products in cart");
    err.statusCode = 400;
    throw err;
  }

  const subtotal = orderItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const pricing = buildPricing(subtotal, body.discount);
  const shippingAddress = normalizeShippingAddress(body.shippingAddress, user);

  const paymentMethod = body.paymentMethod ?? "test";
  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    const err = new Error(`Invalid payment method. Allowed: ${PAYMENT_METHODS.join(", ")}`);
    err.statusCode = 400;
    throw err;
  }

  return {
    user,
    orderItems,
    pricing,
    shippingAddress,
    paymentMethod,
    impUid: typeof body.impUid === "string" ? body.impUid.trim() : "",
    merchantUid: typeof body.merchantUid === "string" ? body.merchantUid.trim() : "",
  };
}

/**
 * imp_uid / merchant_uid 기준 중복 주문 방지
 */
export async function assertNoDuplicateOrder({ impUid, merchantUid }) {
  const paymentIds = [...new Set([impUid, merchantUid].filter(Boolean))];
  if (paymentIds.length === 0) return;

  const existing = await Order.findOne({
    "payment.transactionId": { $in: paymentIds },
  })
    .select("orderNumber payment.transactionId user")
    .lean();

  if (existing) {
    const err = new Error(
      `Duplicate order: payment id "${existing.payment?.transactionId}" is already used (order ${existing.orderNumber})`
    );
    err.statusCode = 409;
    throw err;
  }
}

/**
 * 주문 생성 전 — 중복 결제·PortOne 결제 검증
 */
export async function validateOrderBeforeCreate(userId, body = {}) {
  const draft = await resolveCartOrderDraft(userId, body);

  await assertNoDuplicateOrder({
    impUid: draft.impUid,
    merchantUid: draft.merchantUid,
  });

  const isTestPayment = draft.paymentMethod === "test";

  if (isTestPayment) {
    return draft;
  }

  if (!draft.impUid && !draft.merchantUid) {
    const err = new Error(
      "Payment verification required. Complete PortOne payment and send imp_uid or merchant_uid (paymentId)."
    );
    err.statusCode = 402;
    throw err;
  }

  await verifyPortOnePayment({
    impUid: draft.impUid || undefined,
    expectedAmount: draft.pricing.total,
    merchantUid: draft.merchantUid || undefined,
  });

  return draft;
}

/**
 * 장바구니 기반 주문 생성
 */
export async function createOrderFromCart(userId, body = {}) {
  const draft = await resolveCartOrderDraft(userId, body);
  const { user, orderItems, pricing, shippingAddress, paymentMethod, impUid, merchantUid } =
    draft;

  const isTestPayment = paymentMethod === "test";
  const isPortOnePaid = Boolean(impUid || merchantUid);
  const isPaid = isTestPayment || isPortOnePaid;
  const now = new Date();

  let order;
  try {
    order = await Order.create({
      orderNumber: generateOrderNumber(),
      user: userId,
      status: isPaid ? "paid" : "pending",
      items: orderItems,
      shippingAddress,
      contact: {
        name: (body.contact?.name ?? user.name ?? "").trim(),
        email: (body.contact?.email ?? user.email ?? "").trim().toLowerCase(),
        phone: (body.contact?.phone ?? user.phone ?? shippingAddress.phone).trim(),
      },
      payment: {
        method: paymentMethod,
        status: isPaid ? "paid" : "pending",
        paidAt: isPaid ? now : undefined,
        transactionId:
          impUid || (isTestPayment ? `TEST-${Date.now()}` : merchantUid || undefined),
      },
      pricing,
      customerNote: typeof body.customerNote === "string" ? body.customerNote.trim() : "",
    });
  } catch (err) {
    if (err?.code === 11000) {
      const duplicate = new Error("Duplicate order: payment transaction already exists");
      duplicate.statusCode = 409;
      throw duplicate;
    }
    throw err;
  }

  await clearUserCart(userId);

  return order.toObject();
}

export async function listOrdersForUser(userId, { limit = 20, status } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const filter = { user: userId };
  if (status && ORDER_STATUSES.includes(status)) {
    filter.status = status;
  }
  return Order.find(filter).sort({ createdAt: -1 }).limit(safeLimit).lean();
}

/** 관리자 — 전체 주문 목록 (페이지네이션·필터) */
export async function listAllOrders(query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};

  if (query.status && ORDER_STATUSES.includes(query.status)) {
    filter.status = query.status;
  }
  if (query.userId) {
    assertValidObjectId(query.userId, "userId");
    filter.user = query.userId;
  }

  const [total, orders] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "name email")
      .lean(),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

export async function getOrderForUser(userId, orderId) {
  assertValidObjectId(orderId, "order id");

  const order = await Order.findOne({ _id: orderId, user: userId }).lean();
  if (!order) {
    const err = new Error("Order not found");
    err.statusCode = 404;
    throw err;
  }
  return order;
}

export async function getOrderByNumberForUser(userId, orderNumber) {
  const number = String(orderNumber ?? "").trim();
  if (!number) {
    const err = new Error("Order number is required");
    err.statusCode = 400;
    throw err;
  }

  const order = await Order.findOne({ orderNumber: number, user: userId }).lean();
  if (!order) {
    const err = new Error("Order not found");
    err.statusCode = 404;
    throw err;
  }
  return order;
}

/** 관리자 — 주문 단건 */
export async function getOrderByIdAdmin(orderId) {
  assertValidObjectId(orderId, "order id");

  const order = await Order.findById(orderId)
    .populate("user", "name email phone")
    .lean();
  if (!order) {
    const err = new Error("Order not found");
    err.statusCode = 404;
    throw err;
  }
  return order;
}

/** 회원 — pending 주문 배송지·메모 수정 */
export async function updateOrderForUser(userId, orderId, body = {}) {
  assertValidObjectId(orderId, "order id");

  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) {
    const err = new Error("Order not found");
    err.statusCode = 404;
    throw err;
  }

  if (order.status !== "pending") {
    const err = new Error("Only pending orders can be updated");
    err.statusCode = 400;
    throw err;
  }

  if (body.shippingAddress && typeof body.shippingAddress === "object") {
    const addr = body.shippingAddress;
    if (addr.recipientName !== undefined) {
      order.shippingAddress.recipientName = String(addr.recipientName).trim();
    }
    if (addr.phone !== undefined) {
      order.shippingAddress.phone = String(addr.phone).trim();
    }
    if (addr.postalCode !== undefined) {
      order.shippingAddress.postalCode = String(addr.postalCode).trim();
    }
    if (addr.addressLine1 !== undefined) {
      order.shippingAddress.addressLine1 = String(addr.addressLine1).trim();
    }
    if (addr.addressLine2 !== undefined) {
      order.shippingAddress.addressLine2 = String(addr.addressLine2).trim();
    }
    if (addr.deliveryMemo !== undefined) {
      order.shippingAddress.deliveryMemo = String(addr.deliveryMemo).trim();
    }
  }

  if (body.customerNote !== undefined) {
    order.customerNote = String(body.customerNote).trim();
  }

  await order.save();
  return order.toObject();
}

/** 관리자 — 상태·결제·배송 정보 수정 */
export async function updateOrderAdmin(orderId, body = {}) {
  assertValidObjectId(orderId, "order id");

  const order = await Order.findById(orderId);
  if (!order) {
    const err = new Error("Order not found");
    err.statusCode = 404;
    throw err;
  }

  if (body.status !== undefined) {
    if (!ORDER_STATUSES.includes(body.status)) {
      const err = new Error(`Invalid status. Allowed: ${ORDER_STATUSES.join(", ")}`);
      err.statusCode = 400;
      throw err;
    }
    order.status = body.status;
    if (body.status === "cancelled" && !order.cancelledAt) {
      order.cancelledAt = new Date();
    }
  }

  if (body.payment?.status !== undefined) {
    if (!PAYMENT_STATUSES.includes(body.payment.status)) {
      const err = new Error(
        `Invalid payment status. Allowed: ${PAYMENT_STATUSES.join(", ")}`
      );
      err.statusCode = 400;
      throw err;
    }
    order.payment.status = body.payment.status;
    if (body.payment.status === "paid" && !order.payment.paidAt) {
      order.payment.paidAt = new Date();
    }
  }

  if (body.payment?.transactionId !== undefined) {
    order.payment.transactionId = String(body.payment.transactionId).trim();
  }

  if (body.shippingAddress && typeof body.shippingAddress === "object") {
    Object.assign(order.shippingAddress, body.shippingAddress);
  }

  if (body.customerNote !== undefined) {
    order.customerNote = String(body.customerNote).trim();
  }

  if (body.cancelReason !== undefined) {
    order.cancelReason = String(body.cancelReason).trim();
  }

  await order.save();
  return order.toObject();
}

export async function cancelOrderForUser(userId, orderId, reason = "") {
  assertValidObjectId(orderId, "order id");

  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) {
    const err = new Error("Order not found");
    err.statusCode = 404;
    throw err;
  }

  if (!["pending", "paid"].includes(order.status)) {
    const err = new Error("This order cannot be cancelled");
    err.statusCode = 400;
    throw err;
  }

  order.status = "cancelled";
  order.cancelledAt = new Date();
  order.cancelReason = typeof reason === "string" ? reason.trim() : "";
  if (order.payment?.status === "paid") {
    order.payment.status = "refunded";
  }
  await order.save();
  return order.toObject();
}

/** 회원 — pending 주문 삭제 */
export async function deleteOrderForUser(userId, orderId) {
  assertValidObjectId(orderId, "order id");

  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) {
    const err = new Error("Order not found");
    err.statusCode = 404;
    throw err;
  }

  if (order.status !== "pending") {
    const err = new Error("Only pending orders can be deleted");
    err.statusCode = 400;
    throw err;
  }

  await order.deleteOne();
  return { ok: true, deletedId: orderId };
}

/** 관리자 — cancelled/refunded 주문 삭제 */
export async function deleteOrderAdmin(orderId) {
  assertValidObjectId(orderId, "order id");

  const order = await Order.findById(orderId);
  if (!order) {
    const err = new Error("Order not found");
    err.statusCode = 404;
    throw err;
  }

  if (!["cancelled", "refunded"].includes(order.status)) {
    const err = new Error("Only cancelled or refunded orders can be deleted");
    err.statusCode = 400;
    throw err;
  }

  await order.deleteOne();
  return { ok: true, deletedId: orderId };
}
