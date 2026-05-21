import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  fetchAdminOrder,
  getOrderCustomerLabel,
  updateAdminOrder,
  ORDER_STATUSES,
  type Order,
  type OrderStatus,
} from '@/lib/ordersApi'
import { formatOrderDate, ORDER_STATUS_LABEL } from '@/lib/orderLabels'
import { formatKrw } from '@/lib/productsApi'
import '@/pages/OrdersPage.css'
import './AdminOrdersPage.css'

export function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [status, setStatus] = useState<OrderStatus>('paid')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    let cancelled = false
    fetchAdminOrder(id)
      .then((data) => {
        if (!cancelled) {
          setOrder(data)
          setStatus(data.status)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '주문을 불러오지 못했습니다.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  async function handleSaveStatus() {
    if (!order) return
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const updated = await updateAdminOrder(order._id, { status })
      setOrder(updated)
      setStatus(updated.status)
      setMessage('주문 상태가 저장되었습니다.')
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="admin-main admin-orders-wrap">
      <p className="admin-breadcrumb">
        <Link to="/admin">Home</Link> &gt;{' '}
        <Link to="/admin/orders">주문 관리</Link> &gt; 상세
      </p>
      <div className="admin-orders-head">
        <h1 className="orders-page__title admin-title">주문 상세</h1>
        <Link to="/admin/orders" className="admin-btn">
          목록으로
        </Link>
      </div>

      {loading && <p className="orders-page__message">불러오는 중…</p>}
      {error && (
        <p className="orders-page__message orders-page__message--error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="orders-page__message" role="status">
          {message}
        </p>
      )}

      {order && (
        <article className="orders-card">
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
              <strong>{getOrderCustomerLabel(order)}</strong>
            </div>
            <div className="orders-card__meta-block">
              <span>주문 번호</span>
              <strong>{order.orderNumber}</strong>
            </div>
          </header>

          <div className="orders-card__body" style={{ gridTemplateColumns: '1fr' }}>
            <div className="orders-card__main">
              <p className="orders-card__status">
                {ORDER_STATUS_LABEL[order.status]}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OrderStatus)}
                  className="admin-orders-status-select"
                  style={{ maxWidth: '200px', borderRadius: '4px' }}
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {ORDER_STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="admin-btn admin-btn--primary"
                  disabled={saving || status === order.status}
                  onClick={() => void handleSaveStatus()}
                >
                  {saving ? '저장 중…' : '상태 저장'}
                </button>
              </div>

              <h2 style={{ fontSize: '1rem', margin: '0 0 0.75rem' }}>주문 상품</h2>
              {order.items.map((item) => (
                <div key={item._id} className="orders-card__item">
                  <div className="orders-card__thumb">
                    <img src={item.image} alt="" />
                  </div>
                  <div className="orders-card__item-info">
                    <Link to={`/products/${item.product}`} className="orders-card__product-link">
                      {item.name}
                    </Link>
                    <p className="orders-card__item-meta">
                      수량 {item.quantity} · {formatKrw(item.lineTotal)}
                    </p>
                  </div>
                </div>
              ))}

              <section id="shipping" style={{ marginTop: '1.5rem' }}>
                <h2 style={{ fontSize: '1rem', margin: '0 0 0.5rem' }}>배송지</h2>
                <p className="orders-card__status-sub" style={{ margin: 0 }}>
                  {order.shippingAddress.recipientName} · {order.shippingAddress.phone}
                  <br />
                  [{order.shippingAddress.postalCode}]{' '}
                  {order.shippingAddress.addressLine1}{' '}
                  {order.shippingAddress.addressLine2}
                  {order.shippingAddress.deliveryMemo && (
                    <>
                      <br />
                      메모: {order.shippingAddress.deliveryMemo}
                    </>
                  )}
                </p>
              </section>
            </div>
          </div>
        </article>
      )}
    </main>
  )
}
