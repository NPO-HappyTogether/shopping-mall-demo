import mongoose from "mongoose";

export const ORDER_STATUSES = [
  "pending",
  "paid",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

export const PAYMENT_METHODS = ["card", "transfer", "kakao", "naver", "test"];
export const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"];

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    image: {
      type: String,
      required: [true, "Image is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
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
    unitPrice: {
      type: Number,
      required: [true, "Unit price is required"],
      min: [0, "Unit price must be 0 or greater"],
    },
    lineTotal: {
      type: Number,
      required: [true, "Line total is required"],
      min: [0, "Line total must be 0 or greater"],
    },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: [true, "Order number is required"],
      unique: true,
      trim: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ORDER_STATUSES,
        message: `Status must be one of: ${ORDER_STATUSES.join(", ")}`,
      },
      default: "pending",
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator(items) {
          return Array.isArray(items) && items.length > 0;
        },
        message: "Order must have at least one item",
      },
    },
    shippingAddress: {
      recipientName: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      postalCode: { type: String, required: true, trim: true },
      addressLine1: { type: String, required: true, trim: true },
      addressLine2: { type: String, trim: true, default: "" },
      deliveryMemo: { type: String, trim: true, default: "" },
    },
    contact: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
      phone: { type: String, required: true, trim: true },
    },
    payment: {
      method: {
        type: String,
        required: true,
        enum: {
          values: PAYMENT_METHODS,
          message: `Payment method must be one of: ${PAYMENT_METHODS.join(", ")}`,
        },
      },
      status: {
        type: String,
        required: true,
        enum: {
          values: PAYMENT_STATUSES,
          message: `Payment status must be one of: ${PAYMENT_STATUSES.join(", ")}`,
        },
        default: "pending",
      },
      paidAt: { type: Date },
      transactionId: { type: String, trim: true },
      failureReason: { type: String, trim: true },
    },
    pricing: {
      subtotal: { type: Number, required: true, min: 0 },
      shippingFee: { type: Number, required: true, min: 0, default: 0 },
      discount: { type: Number, min: 0, default: 0 },
      total: { type: Number, required: true, min: 0 },
    },
    customerNote: {
      type: String,
      trim: true,
      default: "",
    },
    cancelledAt: { type: Date },
    cancelReason: { type: String, trim: true },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index(
  { "payment.transactionId": 1 },
  { unique: true, sparse: true, name: "payment_transactionId_unique" }
);

export const Order =
  mongoose.models.Order ?? mongoose.model("Order", orderSchema);

export { orderItemSchema };
