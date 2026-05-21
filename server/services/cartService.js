import mongoose from "mongoose";
import { Cart } from "../models/cart.js";
import { Product } from "../models/product.js";

function normalizeOption(value) {
  return typeof value === "string" ? value.trim() : "";
}

function itemKey(productId, size, color) {
  return `${productId}|${normalizeOption(size)}|${normalizeOption(color)}`;
}

export async function findOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
}

export async function getPopulatedCart(userId) {
  const cart = await Cart.findOne({ user: userId })
    .populate({
      path: "items.product",
      select: "sku name price category image description",
    })
    .lean();

  if (!cart) {
    return {
      _id: null,
      user: userId,
      items: [],
      itemCount: 0,
      subtotal: 0,
    };
  }

  const items = (cart.items ?? []).map((entry) => {
    const product = entry.product;
    const price = entry.priceSnapshot ?? product?.price ?? 0;
    return {
      _id: entry._id,
      product: product ?? null,
      quantity: entry.quantity,
      size: entry.size ?? "",
      color: entry.color ?? "",
      priceSnapshot: entry.priceSnapshot,
      lineTotal: price * entry.quantity,
    };
  });

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);

  return {
    _id: cart._id,
    user: cart.user,
    items,
    itemCount,
    subtotal,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
}

export async function addItemToCart(userId, { productId, quantity, size, color }) {
  if (!productId || !mongoose.isValidObjectId(productId)) {
    const err = new Error("Valid productId is required");
    err.statusCode = 400;
    throw err;
  }

  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty < 1) {
    const err = new Error("Quantity must be at least 1");
    err.statusCode = 400;
    throw err;
  }

  const product = await Product.findById(productId).lean();
  if (!product) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }

  const sizeNorm = normalizeOption(size);
  const colorNorm = normalizeOption(color);
  const cart = await findOrCreateCart(userId);
  const key = itemKey(productId, sizeNorm, colorNorm);

  const existing = cart.items.find(
    (item) => itemKey(String(item.product), item.size, item.color) === key
  );

  if (existing) {
    existing.quantity += qty;
    if (existing.priceSnapshot == null) {
      existing.priceSnapshot = product.price;
    }
  } else {
    cart.items.push({
      product: product._id,
      quantity: qty,
      size: sizeNorm,
      color: colorNorm,
      priceSnapshot: product.price,
    });
  }

  await cart.save();
  return getPopulatedCart(userId);
}

export async function updateCartItemQuantity(userId, itemId, quantity) {
  if (!mongoose.isValidObjectId(itemId)) {
    const err = new Error("Invalid item id");
    err.statusCode = 400;
    throw err;
  }

  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty < 1) {
    const err = new Error("Quantity must be at least 1");
    err.statusCode = 400;
    throw err;
  }

  const cart = await findOrCreateCart(userId);
  const item = cart.items.id(itemId);
  if (!item) {
    const err = new Error("Cart item not found");
    err.statusCode = 404;
    throw err;
  }

  item.quantity = qty;
  await cart.save();
  return getPopulatedCart(userId);
}

export async function removeCartItemById(userId, itemId) {
  if (!mongoose.isValidObjectId(itemId)) {
    const err = new Error("Invalid item id");
    err.statusCode = 400;
    throw err;
  }

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    const err = new Error("Cart not found");
    err.statusCode = 404;
    throw err;
  }

  const item = cart.items.id(itemId);
  if (!item) {
    const err = new Error("Cart item not found");
    err.statusCode = 404;
    throw err;
  }

  item.deleteOne();
  await cart.save();
  return getPopulatedCart(userId);
}

export async function clearUserCart(userId) {
  const cart = await Cart.findOne({ user: userId });
  if (cart) {
    cart.items = [];
    await cart.save();
  }
  return getPopulatedCart(userId);
}
