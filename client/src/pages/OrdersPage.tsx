import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import { addToCart } from '@/lib/cartApi'
import { isLoggedIn } from '@/lib/authStorage'
import { fetchOrders, getOrderBuyerInfo, type Order } from '@/lib/ordersApi'
import {
  formatOrderDate,
  getOrderStatusHeadline,
  ORDER_STATUS_LABEL,
} from '@/lib/orderLabels'
import {
  countOrdersByTab,
  matchesOrderTab,
  ORDER_TABS,
  type OrderTabId,
} from '@/lib/orderTabTheme'
import { formatKrw } from '@/lib/productsApi'
import './OrdersPage.css'

export function OrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<OrderTabId>('all')
  const [search, setSearch] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [buyingId, setBuyingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!isLoggedIn()) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await fetchOrders({ limit: 50 })
      setOrders(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '주문 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const tabCounts = useMemo(() => countOrdersByTab(orders), [orders])

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return orders.filter((order) => {
      if (!matchesOrderTab(order, tab)) return false
      if (!q) return true
      return (
        order.orderNumber.toLowerCase().includes(q) ||
        order.contact?.email?.toLowerCase().includes(q) ||
        order.contact?.phone?.toLowerCase().includes(q) ||
        order.items.some(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            item.sku.toLowerCase().includes(q),
        )
      )
    })
  }, [orders, tab, searchQuery])

  async function handleBuyAgain(
    productId: string,
    quantity: number,
    size: string,
    color: string,
    key: string,
  ) {
    setBuyingId(key)
    try {
      await addToCart({ productId, quantity, size, color })
      navigate('/cart')
    } catch (err) {
      setError(err instanceof Error ? err.message : '장바구니에 담지 못했습니다.')
    } finally {
      setBuyingId(null)
    }
  }

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault()
    setSearchQuery(search)
  }

  if (!isLoggedIn()) {
    return (
      <div className="orders-page">
        <Navbar />
        <div className="orders-page__inner">
          <h1 className="orders-page__title">주문 내역</h1>
          <p className="orders-page__message">주문 내역을 보려면 로그인해 주세요.</p>
          <Link to="/login" state={{ from: '/orders' }} className="orders-page__empty-link">
            로그인하기
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="orders-page">
      <Navbar />
      <div className="orders-page__inner">
        <h1 className="orders-page__title">주문 내역</h1>

        <div className="orders-page__toolbar">
          <form className="orders-page__search" onSubmit={handleSearchSubmit}>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="주문번호, 상품명, SKU 검색"
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
                onClick={() => setTab(t.id)}
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
          최근 주문 {orders.length}건
          {filteredOrders.length !== orders.length &&
            ` · 표시 중 ${filteredOrders.length}건`}
        </p>

        {loading && <p className="orders-page__message" role="status">불러오는 중…</p>}
        {error && (
          <p className="orders-page__message orders-page__message--error" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && filteredOrders.length === 0 && (
          <div className="orders-page__empty">
            <p>표시할 주문이 없습니다.</p>
            <Link to="/" className="orders-page__empty-link">
              쇼핑하러 가기
            </Link>
          </div>
        )}

        {!loading &&
          filteredOrders.map((order) => {
            const buyer = getOrderBuyerInfo(order)
            return (
            <article key={order._id} className="orders-card">
              <header className="orders-card__header">
                <div className="orders-card__order-number-wrap">
                  <span className="orders-card__order-label">주문번호</span>
                  <strong className="orders-card__order-number">
                    {order.orderNumber}
                  </strong>
                  <Link
                    to={`/orders/${order._id}`}
                    className="orders-card__order-detail-link"
                  >
                    주문 상세
                  </Link>
                </div>
                <div className="orders-card__meta">
                  <div className="orders-card__meta-block">
                    <span>주문 일자</span>
                    <strong>{formatOrderDate(order.createdAt)}</strong>
                  </div>
                  <div className="orders-card__meta-block">
                    <span>총액</span>
                    <strong>{formatKrw(order.pricing.total)}</strong>
                  </div>
                  <div className="orders-card__meta-block">
                    <span>배송지</span>
                    <strong>{order.shippingAddress.recipientName}</strong>
                  </div>
                </div>
                <div className="orders-card__info">
                  <h3 className="orders-card__info-title">정보</h3>
                  <div className="orders-card__info-grid">
                    <div className="orders-card__info-item">
                      <span>아이디</span>
                      <strong>{buyer.loginId}</strong>
                    </div>
                    <div className="orders-card__info-item">
                      <span>이메일</span>
                      <strong>
                        {buyer.email !== '—' ? (
                          <a href={`mailto:${buyer.email}`}>{buyer.email}</a>
                        ) : (
                          buyer.email
                        )}
                      </strong>
                    </div>
                    <div className="orders-card__info-item">
                      <span>연락처</span>
                      <strong>
                        {buyer.phone !== '—' ? (
                          <a href={`tel:${buyer.phone.replace(/\s/g, '')}`}>
                            {buyer.phone}
                          </a>
                        ) : (
                          buyer.phone
                        )}
                      </strong>
                    </div>
                    <div className="orders-card__info-item">
                      <span>주문자</span>
                      <strong>{buyer.name}</strong>
                    </div>
                  </div>
                </div>
              </header>

              <div className="orders-card__body">
                <div className="orders-card__main">
                  <p className="orders-card__status">
                    {getOrderStatusHeadline(order.status, order.createdAt)}
                  </p>
                  <p className="orders-card__status-sub">
                    {ORDER_STATUS_LABEL[order.status]} · 결제 수단{' '}
                    {order.payment.method === 'test' ? '테스트' : order.payment.method}
                  </p>

                  {order.items.map((item, index) => {
                    const itemKey = `${order._id}-${item._id}`
                    return (
                      <div key={item._id} className="orders-card__item">
                        <div className="orders-card__thumb">
                          <img src={item.image} alt="" />
                        </div>
                        <div className="orders-card__item-info">
                          <h3 className="orders-card__product-name">
                            <Link
                              to={`/products/${item.product}`}
                              className="orders-card__product-link"
                            >
                              {item.name}
                            </Link>
                          </h3>
                          {item.sku && (
                            <p className="orders-card__sku">
                              <span className="orders-card__sku-label">SKU</span>
                              <code className="orders-card__sku-value">
                                {item.sku}
                              </code>
                            </p>
                          )}
                          <p className="orders-card__item-meta">
                            {item.size && `사이즈: ${item.size}`}
                            {item.size && item.color && ' · '}
                            {item.color && `색상: ${item.color}`}
                            {' · '}
                            수량 {item.quantity} · {formatKrw(item.lineTotal)}
                          </p>
                          {index === 0 && (
                            <div className="orders-card__item-actions">
                              <button
                                type="button"
                                className="orders-card__btn-buy"
                                disabled={buyingId === itemKey}
                                onClick={() =>
                                  void handleBuyAgain(
                                    item.product,
                                    item.quantity,
                                    item.size,
                                    item.color,
                                    itemKey,
                                  )
                                }
                              >
                                다시 구매하기
                              </button>
                              <Link
                                to={`/products/${item.product}`}
                                className="orders-card__btn-outline"
                              >
                                상품 보기
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <aside className="orders-card__aside">
                  <Link
                    to={`/orders/${order._id}`}
                    className="orders-card__aside-btn orders-card__aside-btn--primary"
                  >
                    주문 상세 보기
                  </Link>
                  <button
                    type="button"
                    className="orders-card__aside-btn"
                    disabled={!['shipped', 'delivered'].includes(order.status)}
                    title={
                      ['shipped', 'delivered'].includes(order.status)
                        ? undefined
                        : '배송 시작 후 이용 가능합니다'
                    }
                  >
                    배송 추적
                  </button>
                  <Link to={`/orders/${order._id}`} className="orders-card__aside-btn">
                    배송지 확인
                  </Link>
                </aside>
              </div>
            </article>
            )
          })}
      </div>
      <Footer />
    </div>
  )
}
