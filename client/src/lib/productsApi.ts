import type { Product as HomeProduct } from '@/data/homeCatalog'
import { apiUrl } from '@/lib/api'
import { getAccessToken } from '@/lib/authStorage'

export const PRODUCT_CATEGORIES = ['상의', '하의', '악세서리', '신발'] as const
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]

export type Product = {
  _id: string
  sku: string
  name: string
  price: number
  category: ProductCategory
  image: string
  description?: string
  createdAt?: string
  updatedAt?: string
}

export type ProductInput = {
  sku: string
  name: string
  price: number
  category: ProductCategory
  image: string
  description?: string
}

export type RegisterProductResult = {
  ok: boolean
  message?: string
  product: Product
}

function authHeaders(json = false): HeadersInit {
  const token = getAccessToken()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (json) headers['Content-Type'] = 'application/json'
  return headers
}

export function formatKrw(price: number): string {
  return `${new Intl.NumberFormat('ko-KR').format(price)}원`
}

export function mapProductToHome(product: Product, badge?: string): HomeProduct {
  return {
    id: product._id,
    name: product.name,
    price: formatKrw(product.price),
    image: product.image,
    category: product.category,
    badge,
  }
}

/** GET /api/products/public — 메인 페이지용 전체 목록 (인증 불필요) */
export async function fetchPublicProducts(
  category?: ProductCategory,
): Promise<Product[]> {
  const search = new URLSearchParams()
  if (category) search.set('category', category)
  const qs = search.toString()
  const res = await fetch(apiUrl(`/api/products/public${qs ? `?${qs}` : ''}`))
  if (!res.ok) throw new Error(await parseError(res))
  const data = (await res.json()) as { products: Product[] }
  return data.products ?? []
}

/** GET /api/products/public/:id — 상품 상세 (인증 불필요) */
export async function fetchPublicProduct(id: string): Promise<Product> {
  const res = await fetch(apiUrl(`/api/products/public/${id}`))
  if (!res.ok) throw new Error(await parseError(res))
  const data = (await res.json()) as { product: Product }
  if (!data.product) throw new Error('상품을 찾을 수 없습니다.')
  return data.product
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as {
      error?: string
      details?: string[]
      code?: string
    }
    if (res.status === 401) {
      return '로그인이 필요합니다. 관리자 계정으로 다시 로그인해 주세요.'
    }
    if (res.status === 403) {
      return '관리자만 상품을 등록할 수 있습니다.'
    }
    if (data.details?.length) return data.details.join(', ')
    return data.error ?? res.statusText
  } catch {
    if (res.status === 401) return '로그인이 필요합니다.'
    if (res.status === 403) return '관리자 권한이 필요합니다.'
    return res.statusText || '요청에 실패했습니다.'
  }
}

export type ProductSortKey = 'sku' | 'name' | 'price' | 'category' | 'createdAt'
export type ProductSortOrder = 'asc' | 'desc'

export type ProductsPagination = {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export type FetchProductsParams = {
  category?: string
  page?: number
  limit?: number
  sortBy?: ProductSortKey
  sortOrder?: ProductSortOrder
}

export type FetchProductsResult = {
  products: Product[]
  pagination: ProductsPagination
}

export async function fetchProducts(
  params: FetchProductsParams = {},
): Promise<FetchProductsResult> {
  const search = new URLSearchParams()
  if (params.category && params.category !== 'all') {
    search.set('category', params.category)
  }
  if (params.page != null) search.set('page', String(params.page))
  if (params.limit != null) search.set('limit', String(params.limit))
  if (params.sortBy) search.set('sortBy', params.sortBy)
  if (params.sortOrder) search.set('sortOrder', params.sortOrder)

  const qs = search.toString()
  const res = await fetch(apiUrl(`/api/products${qs ? `?${qs}` : ''}`), {
    headers: authHeaders(),
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
  const data = (await res.json()) as {
    products: Product[]
    pagination: ProductsPagination
  }
  return {
    products: data.products ?? [],
    pagination: data.pagination ?? {
      page: 1,
      limit: 4,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
  }
}

export async function fetchProduct(id: string): Promise<Product> {
  const res = await fetch(apiUrl(`/api/products/${id}`), {
    headers: authHeaders(),
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
  const data = (await res.json()) as { product: Product }
  return data.product
}

/**
 * 상품 등록 — POST /api/products (관리자 JWT 필요)
 * @see server/routes/products.js → productsController.createProduct
 */
export async function registerProduct(input: ProductInput): Promise<RegisterProductResult> {
  if (!getAccessToken()) {
    throw new Error('로그인이 필요합니다. 관리자 계정으로 로그인해 주세요.')
  }

  const res = await fetch(apiUrl('/api/products'), {
    method: 'POST',
    headers: authHeaders(true),
    credentials: 'include',
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    throw new Error(await parseError(res))
  }

  const data = (await res.json()) as RegisterProductResult
  if (!data.product) {
    throw new Error('서버 응답에 상품 정보가 없습니다.')
  }
  return data
}

/** @deprecated registerProduct 사용 권장 */
export async function createProduct(input: ProductInput): Promise<Product> {
  const result = await registerProduct(input)
  return result.product
}

export async function updateProduct(
  id: string,
  input: Partial<ProductInput>,
): Promise<Product> {
  if (!getAccessToken()) {
    throw new Error('로그인이 필요합니다.')
  }

  const res = await fetch(apiUrl(`/api/products/${id}`), {
    method: 'PATCH',
    headers: authHeaders(true),
    credentials: 'include',
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(await parseError(res))
  const data = (await res.json()) as { product: Product }
  return data.product
}

export async function deleteProduct(id: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/products/${id}`), {
    method: 'DELETE',
    headers: authHeaders(),
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
}
