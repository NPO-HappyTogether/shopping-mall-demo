import mongoose from "mongoose";

/** 카테고리별 상품 조회·필터용 */
export const PRODUCT_CATEGORIES = ["상의", "하의", "악세서리", "신발"];

const productSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price must be 0 or greater"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: PRODUCT_CATEGORIES,
        message: `Category must be one of: ${PRODUCT_CATEGORIES.join(", ")}`,
      },
      index: true,
    },
    image: {
      type: String,
      required: [true, "Image is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

/** 카테고리 + 생성일 정렬 등 목록 조회용 */
productSchema.index({ category: 1, createdAt: -1 });

productSchema.pre("validate", function normalizeSku(next) {
  if (typeof this.sku === "string") {
    this.sku = this.sku.trim().toUpperCase();
  }
  next();
});

export const Product =
  mongoose.models.Product ?? mongoose.model("Product", productSchema);
