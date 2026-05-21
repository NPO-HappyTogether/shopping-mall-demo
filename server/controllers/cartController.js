import mongoose from "mongoose";
import * as cartService from "../services/cartService.js";

function handleCartError(err, res) {
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

/** GET /api/cart */
export async function getCart(req, res, next) {
  try {
    const cart = await cartService.getPopulatedCart(req.user._id);
    res.json({ ok: true, cart });
  } catch (err) {
    next(err);
  }
}

/** POST /api/cart/items — body: { productId, quantity?, size?, color? } */
export async function addCartItem(req, res, next) {
  try {
    const { productId, quantity = 1, size, color } = req.body ?? {};
    const cart = await cartService.addItemToCart(req.user._id, {
      productId,
      quantity,
      size,
      color,
    });
    res.status(201).json({ ok: true, message: "Added to cart", cart });
  } catch (err) {
    if (handleCartError(err, res)) return;
    if (sendServiceError(err, res)) return;
    next(err);
  }
}

/** PATCH /api/cart/items/:itemId — body: { quantity } */
export async function updateCartItem(req, res, next) {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body ?? {};
    const cart = await cartService.updateCartItemQuantity(
      req.user._id,
      itemId,
      quantity
    );
    res.json({ ok: true, cart });
  } catch (err) {
    if (handleCartError(err, res)) return;
    if (sendServiceError(err, res)) return;
    next(err);
  }
}

/** DELETE /api/cart/items/:itemId */
export async function removeCartItem(req, res, next) {
  try {
    const { itemId } = req.params;
    const cart = await cartService.removeCartItemById(req.user._id, itemId);
    res.json({ ok: true, cart });
  } catch (err) {
    if (sendServiceError(err, res)) return;
    next(err);
  }
}

/** DELETE /api/cart */
export async function clearCart(req, res, next) {
  try {
    const cart = await cartService.clearUserCart(req.user._id);
    res.json({ ok: true, message: "Cart cleared", cart });
  } catch (err) {
    next(err);
  }
}
