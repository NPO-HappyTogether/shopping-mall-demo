import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import { clearCheckoutPending, loadCheckoutPending } from '@/lib/checkoutPending'
import { isLoggedIn } from '@/lib/authStorage'
import { OrderStatusPipeline } from '@/components/OrderStatusPipeline'
import { createOrder } from '@/lib/ordersApi'
import './CheckoutCompletePage.css'

export function CheckoutCompletePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [message, setMessage] = useState('결제 결과를 확인하는 중…')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoggedIn()) {
      setError('로그인이 필요합니다.')
      setMessage('')
      return
    }

    const errorCode = searchParams.get('error_code')
    const errorMsg = searchParams.get('error_msg')
    if (errorCode) {
      clearCheckoutPending()
      setError(errorMsg ?? `결제에 실패했습니다. (${errorCode})`)
      setMessage('')
      return
    }

    const impUid =
      searchParams.get('imp_uid') ??
      searchParams.get('tx_id') ??
      searchParams.get('txId')
    const merchantUid =
      searchParams.get('merchant_uid') ??
      searchParams.get('paymentId') ??
      searchParams.get('payment_id')
    if (!impUid && !merchantUid) {
      setError('결제 정보(imp_uid 또는 paymentId)가 없습니다.')
      setMessage('')
      return
    }

    const pending = loadCheckoutPending()
    if (!pending) {
      setError('주문 정보가 만료되었습니다. 장바구니에서 다시 결제해 주세요.')
      setMessage('')
      return
    }

    if (merchantUid && pending.merchantUid !== merchantUid) {
      setError('주문 번호가 일치하지 않습니다. 고객센터에 문의해 주세요.')
      setMessage('')
      return
    }

    let cancelled = false

    void (async () => {
      try {
        const order = await createOrder({
          ...pending.orderPayload,
          impUid: impUid ?? undefined,
          merchantUid: merchantUid ?? pending.merchantUid,
        })
        clearCheckoutPending()
        if (!cancelled) {
          navigate(`/orders/${order._id}`, { replace: true })
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '주문 생성에 실패했습니다.')
          setMessage('')
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [navigate, searchParams])

  return (
    <div className="checkout-complete-page">
      <Navbar />
      <div className="checkout-complete-page__inner">
        <h1 className="checkout-complete-page__title">결제 처리</h1>
        {message && (
          <>
            <p className="checkout-complete-page__status" role="status">
              {message}
            </p>
            <OrderStatusPipeline
              highlightUntil="paid"
              current="pending"
              className="checkout-complete-page__pipeline"
            />
          </>
        )}
        {error && (
          <>
            <p className="checkout-complete-page__error" role="alert">
              {error}
            </p>
            <Link to="/checkout" className="checkout-complete-page__link">
              주문 페이지로 돌아가기
            </Link>
          </>
        )}
      </div>
      <Footer />
    </div>
  )
}
