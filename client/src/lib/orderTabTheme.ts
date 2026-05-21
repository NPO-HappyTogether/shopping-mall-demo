import { ORDER_STATUSES, type Order, type OrderStatus } from '@/lib/ordersApi'
import { ORDER_STATUS_LABEL } from '@/lib/orderLabels'

/** 전체 + order.js / ORDER_STATUSES 의 각 상태별 탭 */
export type OrderTabId = 'all' | OrderStatus

export type OrderTabTheme = {
  id: OrderTabId
  label: string
  color: string
  bg: string
  border: string
  badgeBg: string
  badgeColor: string
}

const STATUS_THEMES: Record<
  OrderStatus,
  Omit<OrderTabTheme, 'id' | 'label'>
> = {
  pending: {
    color: '#4b5563',
    bg: '#f3f4f6',
    border: '#9ca3af',
    badgeBg: '#6b7280',
    badgeColor: '#fff',
  },
  paid: {
    color: '#047857',
    bg: '#ecfdf5',
    border: '#10b981',
    badgeBg: '#059669',
    badgeColor: '#fff',
  },
  preparing: {
    color: '#0e7490',
    bg: '#ecfeff',
    border: '#22d3ee',
    badgeBg: '#0891b2',
    badgeColor: '#fff',
  },
  shipped: {
    color: '#b45309',
    bg: '#fffbeb',
    border: '#f59e0b',
    badgeBg: '#d97706',
    badgeColor: '#fff',
  },
  delivered: {
    color: '#6d28d9',
    bg: '#f5f3ff',
    border: '#8b5cf6',
    badgeBg: '#7c3aed',
    badgeColor: '#fff',
  },
  cancelled: {
    color: '#b91c1c',
    bg: '#fef2f2',
    border: '#ef4444',
    badgeBg: '#dc2626',
    badgeColor: '#fff',
  },
  refunded: {
    color: '#9d174d',
    bg: '#fdf2f8',
    border: '#ec4899',
    badgeBg: '#db2777',
    badgeColor: '#fff',
  },
}

export const ORDER_TABS: OrderTabTheme[] = [
  {
    id: 'all',
    label: '전체',
    color: '#1d4ed8',
    bg: '#eff6ff',
    border: '#3b82f6',
    badgeBg: '#2563eb',
    badgeColor: '#fff',
  },
  ...ORDER_STATUSES.map((status) => ({
    id: status,
    label: ORDER_STATUS_LABEL[status],
    ...STATUS_THEMES[status],
  })),
]

const THEME_BY_ID = Object.fromEntries(ORDER_TABS.map((t) => [t.id, t])) as Record<
  OrderTabId,
  OrderTabTheme
>

export function getTabTheme(tabId: OrderTabId): OrderTabTheme {
  return THEME_BY_ID[tabId]
}

/** 주문 상태 → 동일 id 탭 (1:1 매핑) */
export function statusToTabId(status: OrderStatus): OrderTabId {
  return status
}

export function matchesOrderTab(order: Order, tabId: OrderTabId): boolean {
  if (tabId === 'all') return true
  return order.status === tabId
}

export function countOrdersByTab(orders: Order[]): Record<OrderTabId, number> {
  const counts = Object.fromEntries(
    ORDER_TABS.map((t) => [t.id, 0]),
  ) as Record<OrderTabId, number>

  counts.all = orders.length
  for (const order of orders) {
    if (order.status in counts) {
      counts[order.status as OrderStatus] += 1
    }
  }
  return counts
}
