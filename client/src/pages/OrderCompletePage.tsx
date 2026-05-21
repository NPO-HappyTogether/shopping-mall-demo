import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import { fetchOrder, type Order } from '@/lib/ordersApi'
import { ORDER_STATUS_LABEL } from '@/lib/orderLabels'
import { formatKrw } from '@/lib/productsApi'
import { isLoggedIn } from '@/lib/authStorage'
import './OrderCompletePage.css'

export function OrderCompletePage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id || !isLoggedIn()) {
      setLoading(false)
      if (!isLoggedIn()) setError('로그인이 필요합니다.')
      return
    }

    let cancelled = false
    fetchOrder(id)
      .then((data) => {
        if (!cancelled) setOrder(data)
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

  return (
    <div className="order-complete">
      <Navbar />
      <div className="order-complete__inner">
        {loading && <p role="status">주문 정보를 불러오는 중…</p>}
        {error && (
          <p className="order-complete__error" role="alert">
            {error}
          </p>
        )}
        {order && (
          <>
            <h1 className="order-complete__title">주문이 완료되었습니다</h1>
            <p className="order-complete__number">
              주문번호 <strong>{order.orderNumber}</strong>
            </p>
            <p className="order-complete__status">
              상태: {ORDER_STATUS_LABEL[order.status] ?? order.status}
            </p>

            <section className="order-complete__section">
              <h2>주문 상품</h2>
              <ul className="order-complete__items">
                {order.items.map((item) => (
                  <li key={item._id}>
                    <img src={item.image} alt="" />
                    <div>
                      <span className="order-complete__item-name">{item.name}</span>
                      <span className="order-complete__item-meta">
                        {item.quantity}개 · {formatKrw(item.lineTotal)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="order-complete__section">
              <h2>결제 금액</h2>
              <dl className="order-complete__pricing">
                <div>
                  <dt>상품 합계</dt>
                  <dd>{formatKrw(order.pricing.subtotal)}</dd>
                </div>
                <div>
                  <dt>배송비</dt>
                  <dd>{formatKrw(order.pricing.shippingFee)}</dd>
                </div>
                <div className="order-complete__pricing-total">
                  <dt>총 결제</dt>
                  <dd>{formatKrw(order.pricing.total)}</dd>
                </div>
              </dl>
            </section>

            <section className="order-complete__section">
              <h2>배송지</h2>
              <p>
                {order.shippingAddress.recipientName} · {order.shippingAddress.phone}
                <br />
                [{order.shippingAddress.postalCode}]{' '}
                {order.shippingAddress.addressLine1}{' '}
                {order.shippingAddress.addressLine2}
              </p>
            </section>
          </>
        )}

        <div className="order-complete__actions">
          <Link to="/orders" className="order-complete__btn order-complete__btn--outline">
            주문 목록 보기
          </Link>
          <Link to="/" className="order-complete__btn">
            쇼핑 계속하기
          </Link>
          <Link to="/cart" className="order-complete__btn order-complete__btn--outline">
            장바구니
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  )
}
