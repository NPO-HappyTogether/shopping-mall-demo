import mongoose from "mongoose";
import { Product, PRODUCT_CATEGORIES } from "../models/product.js";

function handleProductError(err, res) {
  if (err instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: "Validation failed", details: messages });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: "Duplicate SKU" });
  }
  throw err;
}

function normalizeSkuInput(sku) {
  return String(sku).trim().toUpperCase();
}

const SORTABLE_FIELDS = {
  sku: "sku",
  name: "name",
  price: "price",
  category: "category",
  createdAt: "createdAt",
};

const DEFAULT_PAGE_SIZE = 4;

function parsePagination(query) {
  let page = Number.parseInt(String(query.page ?? "1"), 10);
  let limit = Number.parseInt(String(query.limit ?? String(DEFAULT_PAGE_SIZE)), 10);

  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(limit) || limit < 1) limit = DEFAULT_PAGE_SIZE;
  if (limit > 100) limit = 100;

  return { page, limit, skip: (page - 1) * limit };
}

function parseSort(query) {
  const field = SORTABLE_FIELDS[query.sortBy] ?? "createdAt";
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;
  return { [field]: sortOrder };
}

/** GET /api/products — 목록 (?category=상의&page=1&limit=4&sortBy=sku&sortOrder=asc) */
export async function listProducts(req, res, next) {
  try {
    const { category } = req.query;
    const filter = {};

    if (category !== undefined && category !== "") {
      if (!PRODUCT_CATEGORIES.includes(category)) {
        return res.status(400).json({
          ok: false,
          error: "Invalid category",
          allowed: PRODUCT_CATEGORIES,
        });
      }
      filter.category = category;
    }

    const { page, limit, skip } = parsePagination(req.query);
    const sort = parseSort(req.query);

    const [total, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    res.json({
      ok: true,
      products,
      count: products.length,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/products/public — 메인 등 공개 목록 (전체, 인증 불필요) */
export async function listPublicProducts(req, res, next) {
  try {
    const { category } = req.query;
    const filter = {};

    if (category !== undefined && category !== "") {
      if (!PRODUCT_CATEGORIES.includes(category)) {
        return res.status(400).json({
          ok: false,
          error: "Invalid category",
          allowed: PRODUCT_CATEGORIES,
        });
      }
      filter.category = category;
    }

    const products = await Product.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ ok: true, products, count: products.length });
  } catch (err) {
    next(err);
  }
}

/** GET /api/products/public/:id — 공개 상품 상세 (인증 불필요) */
export async function getPublicProductById(req, res, next) {
  return getProductById(req, res, next);
}

/** GET /api/products/categories */
export function listCategories(req, res) {
  res.json({ ok: true, categories: PRODUCT_CATEGORIES });
}

/** GET /api/products/sku/:sku */
export async function getProductBySku(req, res, next) {
  try {
    const sku = normalizeSkuInput(req.params.sku);
    const product = await Product.findOne({ sku }).lean();
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json({ ok: true, product });
  } catch (err) {
    next(err);
  }
}

/** GET /api/products/:id */
export async function getProductById(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid product id" });
    }
    const product = await Product.findById(id).lean();
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json({ ok: true, product });
  } catch (err) {
    next(err);
  }
}

/** POST /api/products */
export async function createProduct(req, res, next) {
  try {
    const { sku, name, price, category, image, description } = req.body ?? {};

    if (!sku || !name || price === undefined || !category || !image) {
      return res.status(400).json({
        ok: false,
        error: "sku, name, price, category, and image are required",
      });
    }

    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      return res.status(400).json({
        ok: false,
        error: "price must be a number 0 or greater",
      });
    }

    if (!PRODUCT_CATEGORIES.includes(category)) {
      return res.status(400).json({
        error: "Invalid category",
        allowed: PRODUCT_CATEGORIES,
      });
    }

    const doc = await Product.create({
      sku: normalizeSkuInput(sku),
      name: String(name).trim(),
      price: priceNum,
      category,
      image: String(image).trim(),
      description: description != null ? String(description).trim() : "",
    });

    res.status(201).json({ ok: true, message: "Product created", product: doc });
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError || err.code === 11000) {
      return handleProductError(err, res);
    }
    next(err);
  }
}

/** PATCH /api/products/:id */
export async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid product id" });
    }

    const { sku, name, price, category, image, description } = req.body ?? {};
    const updates = {};

    if (sku !== undefined) updates.sku = normalizeSkuInput(sku);
    if (name !== undefined) updates.name = String(name).trim();
    if (price !== undefined) updates.price = Number(price);
    if (category !== undefined) {
      if (!PRODUCT_CATEGORIES.includes(category)) {
        return res.status(400).json({
          error: "Invalid category",
          allowed: PRODUCT_CATEGORIES,
        });
      }
      updates.category = category;
    }
    if (image !== undefined) updates.image = String(image).trim();
    if (description !== undefined) updates.description = String(description).trim();

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const product = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).lean();

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ ok: true, product });
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError || err.code === 11000) {
      return handleProductError(err, res);
    }
    next(err);
  }
}

/** DELETE /api/products/:id */
export async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid product id" });
    }

    const product = await Product.findByIdAndDelete(id).lean();
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ ok: true, deleted: product });
  } catch (err) {
    next(err);
  }
}
