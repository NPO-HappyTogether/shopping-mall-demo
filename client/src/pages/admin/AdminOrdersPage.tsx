import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
} from 'react'
import { Link } from 'react-router-dom'
import {
  fetchAdminOrders,
  getOrderCustomerLabel,
  updateAdminOrder,
  ORDER_STATUSES,
  type Order,
  type OrderStatus,
} from '@/lib/ordersApi'
import {
  formatOrderDate,
  getOrderStatusHeadline,
  ORDER_STATUS_LABEL,
} from '@/lib/orderLabels'
import {
  countOrdersByTab,
  matchesOrderTab,
  ORDER_TABS,
  statusToTabId,
  type OrderTabId,
} from '@/lib/orderTabTheme'
import { formatKrw } from '@/lib/productsApi'
import '@/pages/OrdersPage.css'
import './AdminOrdersPage.css'

const PAGE_SIZE = 20
const STATS_LIMIT = 200

function orderMatchesSearch(order: Order, q: string): boolean {
  if (!q) return true
  const customer = getOrderCustomerLabel(order).toLowerCase()
  const email =
    typeof order.user === 'object' && order.user?.email
      ? order.user.email.toLowerCase()
      : order.contact?.email?.toLowerCase() ?? ''
  return (
    order.orderNumber.toLowerCase().includes(q) ||
    customer.includes(q) ||
    email.includes(q) ||
    order.items.some((item) => item.name.toLowerCase().includes(q))
  )
}

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [statsOrders, setStatsOrders] = useState<Order[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<OrderTabId>('all')
  const [search, setSearch] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusSaving, setStatusSaving] = useState<string | null>(null)

  const loadStats = useCallback(async () => {
    try {
      const data = await fetchAdminOrders({ page: 1, limit: STATS_LIMIT })
      setStatsOrders(data.orders)
    } catch {
      /* 목록은 계속 표시 */
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const pageData = await fetchAdminOrders({ page, limit: PAGE_SIZE })
      void loadStats()
      setOrders(pageData.orders)
      setTotal(pageData.pagination.total)
      setTotalPages(pageData.pagination.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : '주문 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [page, loadStats])

  useEffect(() => {
    void load()
  }, [load])

  const searchedStatsOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return statsOrders.filter((o) => orderMatchesSearch(o, q))
  }, [statsOrders, searchQuery])

  const tabCounts = useMemo(
    () => countOrdersByTab(searchedStatsOrders),
    [searchedStatsOrders],
  )

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return orders.filter(
      (order) => matchesOrderTab(order, tab) && orderMatchesSearch(order, q),
    )
  }, [orders, tab, searchQuery])

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault()
    setSearchQuery(search)
    setPage(1)
  }

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    setStatusSaving(orderId)
    setError(null)
    try {
      const updated = await updateAdminOrder(orderId, { status })
      setOrders((prev) => prev.map((o) => (o._id === orderId ? updated : o)))
      setStatsOrders((prev) => prev.map((o) => (o._id === orderId ? updated : o)))
    } catch (err) {
      setError(err instanceof Error ? err.message : '상태 변경에 실패했습니다.')
    } finally {
      setStatusSaving(null)
    }
  }

  return (
    <main className="admin-main admin-orders-wrap">
      <p className="admin-breadcrumb">Home &gt; 주문 관리</p>
      <div className="admin-orders-head">
        <h1 className="orders-page__title admin-title">주문 관리</h1>
        <Link to="/admin" className="admin-btn">
          대시보드
        </Link>
      </div>

      <div className="orders-page__toolbar">
        <form className="orders-page__search" onSubmit={handleSearchSubmit}>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="모든 주문 검색 (주문번호, 고객명, 상품명)"
            aria-label="주문 검색"
          />
          <button type="submit" className="orders-page__search-btn">
            주문 검색
          </button>
        </form>
      </div>

      <div className="orders-status-tabs" role="tablist" aria-label="주문 필터">
        {ORDER_TABS.map((t) => {
          const count = tabCounts[t.id]
          const selected = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`orders-status-tab orders-status-tab--${t.id}${selected ? ' orders-status-tab--selected' : ''}`}
              style={
                {
                  '--tab-color': t.color,
                  '--tab-bg': t.bg,
                  '--tab-border': t.border,
                } as CSSProperties
              }
              onClick={() => {
                setTab(t.id)
                setPage(1)
              }}
            >
              <span className="orders-status-tab__label">{t.label}</span>
              <span
                className="orders-status-tab__count"
                style={{ background: t.badgeBg, color: t.badgeColor }}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      <p className="orders-page__summary">
        전체 {total}건 · {page} / {totalPages || 1} 페이지
        {filteredOrders.length !== orders.length &&
          ` · 표시 중 ${filteredOrders.length}건`}
        {searchQuery && ` · 검색: "${searchQuery}"`}
      </p>

      {loading && (
        <p className="orders-page__message" role="status">
          불러오는 중…
        </p>
      )}
      {error && (
        <p className="orders-page__message orders-page__message--error" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && filteredOrders.length === 0 && (
        <div className="orders-page__empty">
          <p>표시할 주문이 없습니다.</p>
        </div>
      )}

      {!loading &&
        filteredOrders.map((order) => {
          const themeId = statusToTabId(order.status)
          return (
            <article
              key={order._id}
              className={`orders-card orders-card--${themeId}`}
            >
              <header className="orders-card__meta">
                <div className="orders-card__meta-block">
                  <span>주문 일자</span>
                  <strong>{formatOrderDate(order.createdAt)}</strong>
                </div>
                <div className="orders-card__meta-block">
                  <span>총액</span>
                  <strong>{formatKrw(order.pricing.total)}</strong>
                </div>
                <div className="orders-card__meta-block">
                  <span>주문자</span>
                  <strong className="admin-orders-card__customer">
                    {getOrderCustomerLabel(order)}
                  </strong>
                </div>
                <div className="orders-card__meta-block">
                  <span>배송지</span>
                  <strong>{order.shippingAddress.recipientName}</strong>
                </div>
                <div className="orders-card__meta-block">
                  <span>주문 번호</span>
                  <strong>{order.orderNumber}</strong>
                </div>
                <div className="orders-card__meta-links">
                  <Link to={`/admin/orders/${order._id}`}>주문 상세 보기</Link>
                </div>
              </header>

              <div className="orders-card__body">
                <div className="orders-card__main">
                  <span
                    className={`orders-card__status-badge orders-card__status-badge--${themeId}`}
                  >
                    {ORDER_STATUS_LABEL[order.status]}
                  </span>
                  <p className="orders-card__status">
                    {getOrderStatusHeadline(order.status, order.createdAt)}
                  </p>
                  <p className="orders-card__status-sub">
                    결제 수단{' '}
                    {order.payment.method === 'test' ? '테스트' : order.payment.method}
                  </p>

                  {order.items.map((item) => (
                    <div key={item._id} className="orders-card__item">
                      <div className="orders-card__thumb">
                        <img src={item.image} alt="" />
                      </div>
                      <div className="orders-card__item-info">
                        <Link
                          to={`/products/${item.product}`}
                          className="orders-card__product-link"
                        >
                          {item.name}
                        </Link>
                        <p className="orders-card__item-meta">
                          {item.size && `사이즈: ${item.size}`}
                          {item.size && item.color && ' · '}
                          {item.color && `색상: ${item.color}`}
                          {' · '}
                          수량 {item.quantity} · {formatKrw(item.lineTotal)}
                        </p>
                        <div className="orders-card__item-actions">
                          <Link
                            to={`/products/${item.product}`}
                            className={`orders-card__btn-themed orders-card__btn-themed--${themeId}`}
                          >
                            상품 보기
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <aside className="orders-card__aside">
                  <Link
                    to={`/admin/orders/${order._id}`}
                    className={`orders-card__aside-btn-themed orders-card__aside-btn-themed--${themeId}`}
                  >
                    주문 상세 보기
                  </Link>
                  <label
                    className="orders-card__aside-btn-themed"
                    style={{ padding: 0, border: 'none', background: 'transparent' }}
                  >
                    <span className="visually-hidden">주문 상태 변경</span>
                    <select
                      className={`admin-orders-status-select admin-orders-status-select--${themeId}`}
                      value={order.status}
                      disabled={statusSaving === order._id}
                      onChange={(e) =>
                        void handleStatusChange(order._id, e.target.value as OrderStatus)
                      }
                      aria-label={`${order.orderNumber} 상태 변경`}
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {ORDER_STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Link
                    to={`/admin/orders/${order._id}#shipping`}
                    className={`orders-card__aside-btn-themed orders-card__aside-btn-themed--${themeId}`}
                  >
                    배송지 확인
                  </Link>
                </aside>
              </div>
            </article>
          )
        })}

      {totalPages > 1 && (
        <div className="admin-orders-pagination">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            이전
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            다음
          </button>
        </div>
      )}
    </main>
  )
}
