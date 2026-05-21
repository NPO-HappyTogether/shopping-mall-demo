import { apiUrl } from '@/lib/api'
import { notifyCartUpdated } from '@/lib/cartEvents'
import { getAccessToken } from '@/lib/authStorage'
import type { Product } from '@/lib/productsApi'

export type CartItem = {
  _id: string
  product: Product | null
  quantity: number
  size: string
  color: string
  priceSnapshot?: number
  lineTotal: number
}

export type Cart = {
  _id: string | null
  user: string
  items: CartItem[]
  itemCount: number
  subtotal: number
  createdAt?: string
  updatedAt?: string
}

function authHeaders(json = false): HeadersInit {
  const token = getAccessToken()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (json) headers['Content-Type'] = 'application/json'
  return headers
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string; details?: string[] }
    if (res.status === 401) return '로그인이 필요합니다.'
    if (data.details?.length) return data.details.join(', ')
    return data.error ?? res.statusText
  } catch {
    if (res.status === 401) return '로그인이 필요합니다.'
    return res.statusText || '요청에 실패했습니다.'
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), {
    ...init,
    headers: { ...authHeaders(init?.body != null), ...init?.headers },
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return (await res.json()) as T
}

export async function fetchCart(): Promise<Cart> {
  const data = await request<{ cart: Cart }>('/api/cart')
  return data.cart
}

export type AddToCartInput = {
  productId: string
  quantity?: number
  size?: string
  color?: string
}

export async function addToCart(input: AddToCartInput): Promise<Cart> {
  const data = await request<{ cart: Cart; message?: string }>('/api/cart/items', {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(input),
  })
  notifyCartUpdated()
  return data.cart
}

export async function updateCartItem(
  itemId: string,
  quantity: number,
): Promise<Cart> {
  const data = await request<{ cart: Cart }>(`/api/cart/items/${itemId}`, {
    method: 'PATCH',
    headers: authHeaders(true),
    body: JSON.stringify({ quantity }),
  })
  notifyCartUpdated()
  return data.cart
}

export async function removeCartItem(itemId: string): Promise<Cart> {
  const data = await request<{ cart: Cart }>(`/api/cart/items/${itemId}`, {
    method: 'DELETE',
  })
  notifyCartUpdated()
  return data.cart
}

export async function clearCart(): Promise<Cart> {
  const data = await request<{ cart: Cart }>('/api/cart', {
    method: 'DELETE',
  })
  notifyCartUpdated()
  return data.cart
}
