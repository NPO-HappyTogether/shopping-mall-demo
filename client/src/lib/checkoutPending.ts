import type { CreateOrderInput } from '@/lib/ordersApi'

const STORAGE_KEY = 'hapvi_checkout_pending'

export type CheckoutPending = {
  orderPayload: CreateOrderInput
  merchantUid: string
  amount: number
}

export function saveCheckoutPending(data: CheckoutPending): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function loadCheckoutPending(): CheckoutPending | null {
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as CheckoutPending
  } catch {
    return null
  }
}

export function clearCheckoutPending(): void {
  sessionStorage.removeItem(STORAGE_KEY)
}
