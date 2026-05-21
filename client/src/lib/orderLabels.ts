import type { OrderStatus } from '@/lib/ordersApi'

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: '결제 대기',
  paid: '결제 완료',
  preparing: '상품 준비 중',
  shipped: '배송 중',
  delivered: '배송 완료',
  cancelled: '주문 취소',
  refunded: '환불 완료',
}

export function formatOrderDate(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function getOrderStatusHeadline(status: OrderStatus, createdAt?: string): string {
  const date = formatOrderDate(createdAt)
  switch (status) {
    case 'delivered':
      return `${date} 배송 완료`
    case 'shipped':
      return '배송 중'
    case 'preparing':
      return '상품 준비 중'
    case 'paid':
      return '결제 완료 · 곧 출고 예정'
    case 'pending':
      return '결제 대기 중'
    case 'cancelled':
      return '주문이 취소되었습니다'
    case 'refunded':
      return '환불이 완료되었습니다'
    default:
      return ORDER_STATUS_LABEL[status] ?? status
  }
}
