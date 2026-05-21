import { apiUrl } from '@/lib/api'
import { notifyCartUpdated } from '@/lib/cartEvents'
import { getAccessToken } from '@/lib/authStorage'

export const ORDER_STATUSES = [
  'pending',
  'paid',
  'preparing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export type OrderItem = {
  _id: string
  product: string
  sku: string
  name: string
  image: string
  category: string
  quantity: number
  size: string
  color: string
  unitPrice: number
  lineTotal: number
}

export type OrderUserRef = {
  _id: string
  name?: string
  email?: string
}

export type OrdersPagination = {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export type Order = {
  _id: string
  orderNumber: string
  user: string | OrderUserRef
  status: OrderStatus
  items: OrderItem[]
  shippingAddress: {
    recipientName: string
    phone: string
    postalCode: string
    addressLine1: string
    addressLine2?: string
    deliveryMemo?: string
  }
  contact: {
    name: string
    email: string
    phone: string
  }
  payment: {
    method: string
    status: string
    paidAt?: string
    transactionId?: string
  }
  pricing: {
    subtotal: number
    shippingFee: number
    discount: number
    total: number
  }
  customerNote?: string
  cancelledAt?: string
  cancelReason?: string
  createdAt?: string
  updatedAt?: string
}

export type CreateOrderInput = {
  shippingAddress: {
    recipientName: string
    phone: string
    postalCode: string
    addressLine1: string
    addressLine2?: string
    deliveryMemo?: string
  }
  paymentMethod?: 'test' | 'card' | 'transfer' | 'kakao' | 'naver'
  /** PortOne V2 txId */
  impUid?: string
  /** PortOne V2 paymentId (고객사 주문번호) */
  merchantUid?: string
  contact?: {
    name?: string
    email?: string
    phone?: string
  }
  customerNote?: string
  discount?: number
}

export const FREE_SHIPPING_THRESHOLD = 50_000
export const DEFAULT_SHIPPING_FEE = 3_000

export function calculateShippingFee(subtotal: number) {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_FEE
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

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const res = await fetch(apiUrl('/api/orders'), {
    method: 'POST',
    headers: authHeaders(true),
    credentials: 'include',
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(await parseError(res))
  const data = (await res.json()) as { order: Order }
  notifyCartUpdated()
  return data.order
}

export async function fetchOrders(options?: {
  status?: OrderStatus
  limit?: number
}): Promise<Order[]> {
  const params = new URLSearchParams()
  if (options?.status) params.set('status', options.status)
  if (options?.limit) params.set('limit', String(options.limit))
  const qs = params.toString()
  const res = await fetch(apiUrl(`/api/orders${qs ? `?${qs}` : ''}`), {
    headers: authHeaders(),
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
  const data = (await res.json()) as { orders: Order[] }
  return data.orders ?? []
}

export async function fetchOrder(id: string): Promise<Order> {
  const res = await fetch(apiUrl(`/api/orders/${id}`), {
    headers: authHeaders(),
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
  const data = (await res.json()) as { order: Order }
  return data.order
}

export async function cancelOrder(id: string, reason?: string): Promise<Order> {
  const res = await fetch(apiUrl(`/api/orders/${id}/cancel`), {
    method: 'PATCH',
    headers: authHeaders(true),
    credentials: 'include',
    body: JSON.stringify({ reason }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  const data = (await res.json()) as { order: Order }
  return data.order
}

export type AdminOrdersResult = {
  orders: Order[]
  pagination: OrdersPagination
}

export async function fetchAdminOrders(options?: {
  page?: number
  limit?: number
  status?: OrderStatus
}): Promise<AdminOrdersResult> {
  const params = new URLSearchParams()
  if (options?.page) params.set('page', String(options.page))
  if (options?.limit) params.set('limit', String(options.limit))
  if (options?.status) params.set('status', options.status)
  const qs = params.toString()
  const res = await fetch(apiUrl(`/api/orders/admin${qs ? `?${qs}` : ''}`), {
    headers: authHeaders(),
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
  const data = (await res.json()) as AdminOrdersResult & { ok?: boolean }
  return {
    orders: data.orders ?? [],
    pagination: data.pagination ?? {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
  }
}

export async function fetchAdminOrder(id: string): Promise<Order> {
  const res = await fetch(apiUrl(`/api/orders/admin/${id}`), {
    headers: authHeaders(),
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
  const data = (await res.json()) as { order: Order }
  return data.order
}

export async function updateAdminOrder(
  id: string,
  body: { status?: OrderStatus },
): Promise<Order> {
  const res = await fetch(apiUrl(`/api/orders/admin/${id}`), {
    method: 'PATCH',
    headers: authHeaders(true),
    credentials: 'include',
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await parseError(res))
  const data = (await res.json()) as { order: Order }
  return data.order
}

export function getOrderCustomerLabel(order: Order): string {
  const user = order.user
  if (user && typeof user === 'object') {
    return user.name?.trim() || user.email?.trim() || '—'
  }
  return order.contact?.name?.trim() || order.shippingAddress.recipientName || '—'
}

export type OrderBuyerInfo = {
  /** 로그인 아이디 (이 프로젝트는 이메일 로그인) */
  loginId: string
  email: string
  phone: string
  name: string
}

export function getOrderBuyerInfo(order: Order): OrderBuyerInfo {
  const user = typeof order.user === 'object' ? order.user : null
  const userId = typeof order.user === 'string' ? order.user : user?._id ?? ''

  const email =
    order.contact?.email?.trim() || user?.email?.trim() || '—'
  const loginId = user?.email?.trim() || order.contact?.email?.trim() || userId || '—'

  return {
    loginId,
    email,
    phone:
      order.contact?.phone?.trim() ||
      order.shippingAddress.phone?.trim() ||
      '—',
    name:
      order.contact?.name?.trim() ||
      order.shippingAddress.recipientName ||
      '—',
  }
}
