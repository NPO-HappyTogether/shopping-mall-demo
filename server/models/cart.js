import mongoose from "mongoose";

/**
 * 장바구니 스키마 (데이터 모델만 정의)
 * API 인증(JWT/세션): utils/jwtRequest.js, utils/requestAuth.js, middleware/authenticate.js
 */

/** 장바구니 항목 (Cart.items 하위 문서) */
export const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
},
quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
      default: 1,
    },
    size: {
      type: String,
      trim: true,
      default: "",
    },
    color: {
      type: String,
      trim: true,
      default: "",
    },
    /** 담을 당시 상품 가격 (가격 변동 대비 스냅샷) */
    priceSnapshot: {
      type: Number,
      min: [0, "Price snapshot must be 0 or greater"],
    },
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      unique: true,
      index: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export const Cart =
  mongoose.models.Cart ?? mongoose.model("Cart", cartSchema);
