import { ORDER_STATUSES, type OrderStatus } from '@/lib/ordersApi'
import { ORDER_STATUS_LABEL } from '@/lib/orderLabels'
import './OrderStatusPipeline.css'

type OrderStatusPipelineProps = {
  /** 이 단계까지 활성(완료/진행)으로 표시 */
  highlightUntil?: OrderStatus
  /** 현재 강조 단계 (선택) */
  current?: OrderStatus
  className?: string
}

const STATUS_INDEX = Object.fromEntries(
  ORDER_STATUSES.map((s, i) => [s, i]),
) as Record<OrderStatus, number>

export function OrderStatusPipeline({
  highlightUntil,
  current,
  className = '',
}: OrderStatusPipelineProps) {
  const untilIndex =
    highlightUntil != null ? STATUS_INDEX[highlightUntil] : -1

  return (
    <ol
      className={`order-status-pipeline ${className}`.trim()}
      aria-label="주문 진행 단계"
    >
      {ORDER_STATUSES.map((status, index) => {
        const isDone = index <= untilIndex
        const isCurrent = status === current || index === untilIndex
        return (
          <li
            key={status}
            className={`order-status-pipeline__step order-status-pipeline__step--${status}${
              isDone ? ' order-status-pipeline__step--done' : ''
            }${isCurrent ? ' order-status-pipeline__step--current' : ''}`}
          >
            <span className="order-status-pipeline__dot" aria-hidden />
            <span className="order-status-pipeline__label">
              {ORDER_STATUS_LABEL[status]}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
