import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import { fetchCart, type Cart } from '@/lib/cartApi'
import { getAccessToken, isLoggedIn } from '@/lib/authStorage'
import { fetchMe } from '@/lib/fetchMe'
import {
  calculateShippingFee,
  createOrder,
  FREE_SHIPPING_THRESHOLD,
  type CreateOrderInput,
} from '@/lib/ordersApi'
import { formatKrw } from '@/lib/productsApi'
import {
  clearCheckoutPending,
  saveCheckoutPending,
} from '@/lib/checkoutPending'
import {
  generatePaymentId,
  initPortOne,
  mapPaymentMethodToPayMethod,
  requestPortOnePay,
  validatePortOnePaymentConfig,
} from '@/lib/portone'
import './CheckoutPage.css'

type DeliveryMode = 'delivery' | 'store'
type PaymentMethod = NonNullable<CreateOrderInput['paymentMethod']>

type CheckoutForm = {
  firstName: string
  lastName: string
  phone: string
  email: string
  deliveryMode: DeliveryMode
  deliveryDate: string
  deliveryTime: string
  city: string
  addressLine1: string
  postalCode: string
  addressLine2: string
  deliveryMemo: string
  customerNote: string
  paymentMethod: PaymentMethod
}

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; logo?: string }[] = [
  { id: 'card', label: '카드', logo: 'VISA' },
  { id: 'transfer', label: '계좌이체', logo: 'BANK' },
  { id: 'kakao', label: '카카오페이', logo: 'KAKAO' },
  { id: 'test', label: '테스트(결제창 없음)', logo: 'TEST' },
]

const TIME_SLOTS = [
  '09:00–12:00',
  '12:00–15:00',
  '15:00–18:00',
  '18:00–21:00',
]

const emptyForm: CheckoutForm = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  deliveryMode: 'delivery',
  deliveryDate: '',
  deliveryTime: '',
  city: '',
  addressLine1: '',
  postalCode: '',
  addressLine2: '',
  deliveryMemo: '',
  customerNote: '',
  paymentMethod: 'card',
}

function splitName(fullName: string) {
  const trimmed = fullName.trim()
  if (!trimmed) return { firstName: '', lastName: '' }
  const space = trimmed.indexOf(' ')
  if (space === -1) return { firstName: trimmed, lastName: '' }
  return {
    firstName: trimmed.slice(0, space),
    lastName: trimmed.slice(space + 1),
  }
}

function IconStore() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M3 9l2-4h14l2 4M5 9v11h14V9M9 20v-6h6v6" />
    </svg>
  )
}

function IconDelivery() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M1 6h13v9H1zM14 8h4l3 3v4h-7V8zM6 18a2 2 0 104 0M16 18a2 2 0 104 0" />
    </svg>
  )
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<CheckoutForm>(emptyForm)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [ordering, setOrdering] = useState(false)
  const [portoneReady, setPortoneReady] = useState(false)
  const [portoneError, setPortoneError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    initPortOne()
      .then(() => {
        if (cancelled) return
        setPortoneReady(true)
        setPortoneError(null)
      })
      .catch((err) => {
        console.error('[PortOne V2] init failed:', err)
        if (!cancelled) {
          setPortoneReady(true)
          const config = validatePortOnePaymentConfig()
          if (!config.ready) {
            setPortoneError(config.message ?? '결제 설정이 완료되지 않았습니다.')
          }
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const needsPortOne = form.paymentMethod !== 'test'
  const paymentConfig = validatePortOnePaymentConfig()
  const canSubmitPayment =
    termsAccepted &&
    (form.paymentMethod === 'test' || (portoneReady && paymentConfig.ready))

  const load = useCallback(async () => {
    if (!isLoggedIn()) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await fetchCart()
      setCart(data)
      if (!data.items.length) return

      const token = getAccessToken()
      if (token) {
        const user = await fetchMe(token)
        if (user) {
          const { firstName, lastName } = splitName(user.name ?? '')
          setForm((prev) => ({
            ...prev,
            firstName: firstName || prev.firstName,
            lastName: lastName || prev.lastName,
            phone: user.phone ?? prev.phone,
            email: user.email ?? prev.email,
            addressLine1: user.address ?? prev.addressLine1,
          }))
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '장바구니를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!loading && isLoggedIn() && cart && cart.items.length === 0) {
      navigate('/cart', { replace: true })
    }
  }, [loading, cart, navigate])

  const shippingFee = useMemo(
    () => (cart ? calculateShippingFee(cart.subtotal) : 0),
    [cart],
  )

  const orderTotal = useMemo(
    () => (cart ? cart.subtotal + shippingFee : 0),
    [cart, shippingFee],
  )

  const phoneValid = form.phone.replace(/\D/g, '').length >= 10

  function updateField<K extends keyof CheckoutForm>(key: K, value: CheckoutForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!cart?.items.length || !canSubmitPayment) return
    if (needsPortOne && !portoneReady) return

    const recipientName = [form.firstName, form.lastName].filter(Boolean).join(' ').trim()
    if (!recipientName || !form.phone || !form.postalCode || !form.addressLine1) {
      setError('연락처와 배송 주소를 모두 입력해 주세요.')
      return
    }

    setOrdering(true)
    setError(null)

    const memoParts = [
      form.deliveryMemo,
      form.deliveryMode === 'store' ? '[매장 픽업]' : null,
      form.deliveryDate ? `희망 배송일: ${form.deliveryDate}` : null,
      form.deliveryTime ? `시간: ${form.deliveryTime}` : null,
      form.city ? `도시: ${form.city}` : null,
    ].filter(Boolean)

    const orderPayload: CreateOrderInput = {
      shippingAddress: {
        recipientName,
        phone: form.phone,
        postalCode: form.postalCode,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2 || undefined,
        deliveryMemo: memoParts.length ? memoParts.join(' / ') : undefined,
      },
      paymentMethod: form.paymentMethod,
      contact: {
        name: recipientName,
        email: form.email || undefined,
        phone: form.phone,
      },
      customerNote: form.customerNote || undefined,
    }

    const firstProductName =
      cart.items.find((item) => item.product)?.product?.name ?? 'Hapvi Together Mall 주문'
    const orderName =
      cart.items.length > 1
        ? `${firstProductName} 외 ${cart.items.length - 1}건`
        : firstProductName

    try {
      if (form.paymentMethod === 'test') {
        const order = await createOrder({
          ...orderPayload,
          paymentMethod: 'test',
        })
        navigate(`/orders/${order._id}`, { replace: true })
        return
      }

      const paymentId = generatePaymentId()
      const payOrderName = `주문명:${orderName}`

      saveCheckoutPending({
        orderPayload,
        merchantUid: paymentId,
        amount: orderTotal,
      })

      const payResponse = await requestPortOnePay({
        payMethod: mapPaymentMethodToPayMethod(form.paymentMethod),
        paymentId,
        orderName: payOrderName,
        amount: orderTotal,
        buyer: {
          name: recipientName,
          tel: form.phone,
          email: form.email || undefined,
          addr: [form.addressLine1, form.addressLine2].filter(Boolean).join(' '),
          postcode: form.postalCode,
        },
      })

      const order = await createOrder({
        ...orderPayload,
        impUid: payResponse.txId,
        merchantUid: payResponse.paymentId,
      })
      clearCheckoutPending()
      navigate(`/orders/${order._id}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '주문에 실패했습니다.')
    } finally {
      setOrdering(false)
    }
  }

  if (!isLoggedIn()) {
    return (
      <div className="checkout-page">
        <Navbar />
        <div className="checkout-page__inner">
          <h1 className="checkout-page__title">주문하기</h1>
          <p className="checkout-page__message">주문하려면 로그인해 주세요.</p>
          <Link to="/login" state={{ from: '/checkout' }} className="checkout-page__cta">
            로그인하기
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="checkout-page">
      <Navbar />
      <div className="checkout-page__inner">
        <div className="checkout-page__head">
          <Link to="/cart" className="checkout-page__back" aria-label="장바구니로 돌아가기">
            ←
          </Link>
          <h1 className="checkout-page__title">주문하기</h1>
        </div>

        {loading && (
          <p className="checkout-page__message" role="status">
            불러오는 중…
          </p>
        )}

        {error && (
          <p className="checkout-page__message checkout-page__message--error" role="alert">
            {error}
          </p>
        )}

        {!loading && cart && cart.items.length > 0 && (
          <form className="checkout-layout" onSubmit={(e) => void handleSubmit(e)}>
            <div className="checkout-form">
              <section className="checkout-section">
                <div className="checkout-section__head">
                  <span className="checkout-section__num">1</span>
                  <h2 className="checkout-section__title">연락처 정보</h2>
                </div>
                <div className="checkout-fields checkout-fields--2">
                  <label className="checkout-field">
                    <span>이름</span>
                    <input
                      required
                      value={form.firstName}
                      onChange={(e) => updateField('firstName', e.target.value)}
                      placeholder="길동"
                      autoComplete="given-name"
                    />
                  </label>
                  <label className="checkout-field">
                    <span>성</span>
                    <input
                      value={form.lastName}
                      onChange={(e) => updateField('lastName', e.target.value)}
                      placeholder="홍"
                      autoComplete="family-name"
                    />
                  </label>
                </div>
                <div className="checkout-fields checkout-fields--2">
                  <label
                    className={`checkout-field${phoneValid ? ' checkout-field--valid' : ''}`}
                  >
                    <span>연락처</span>
                    <input
                      required
                      type="tel"
                      value={form.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="010-0000-0000"
                      autoComplete="tel"
                    />
                    {phoneValid && <span className="checkout-field__valid">✓ 확인됨</span>}
                  </label>
                  <label className="checkout-field">
                    <span>이메일</span>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </label>
                </div>
              </section>

              <section className="checkout-section">
                <div className="checkout-section__head">
                  <span className="checkout-section__num">2</span>
                  <h2 className="checkout-section__title">배송 방법</h2>
                </div>
                <div className="checkout-delivery-toggle">
                  <button
                    type="button"
                    className={`checkout-delivery-btn${form.deliveryMode === 'store' ? ' checkout-delivery-btn--active' : ''}`}
                    onClick={() => updateField('deliveryMode', 'store')}
                  >
                    <IconStore />
                    매장 픽업
                  </button>
                  <button
                    type="button"
                    className={`checkout-delivery-btn${form.deliveryMode === 'delivery' ? ' checkout-delivery-btn--active' : ''}`}
                    onClick={() => updateField('deliveryMode', 'delivery')}
                  >
                    <IconDelivery />
                    택배 배송
                  </button>
                </div>
                <div className="checkout-fields checkout-fields--2">
                  <label className="checkout-field">
                    <span>배송 희망일</span>
                    <input
                      type="date"
                      value={form.deliveryDate}
                      onChange={(e) => updateField('deliveryDate', e.target.value)}
                      min={new Date().toISOString().slice(0, 10)}
                    />
                  </label>
                  <label className="checkout-field">
                    <span>배송 시간대</span>
                    <select
                      value={form.deliveryTime}
                      onChange={(e) => updateField('deliveryTime', e.target.value)}
                    >
                      <option value="">선택</option>
                      {TIME_SLOTS.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="checkout-fields checkout-fields--2">
                  <label className="checkout-field">
                    <span>시/도</span>
                    <input
                      value={form.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      placeholder="서울"
                    />
                  </label>
                  <label className="checkout-field">
                    <span>우편번호</span>
                    <input
                      required
                      value={form.postalCode}
                      onChange={(e) => updateField('postalCode', e.target.value)}
                      placeholder="12345"
                    />
                  </label>
                </div>
                <div className="checkout-fields">
                  <label className="checkout-field">
                    <span>주소</span>
                    <input
                      required
                      value={form.addressLine1}
                      onChange={(e) => updateField('addressLine1', e.target.value)}
                      placeholder="도로명 주소"
                    />
                  </label>
                </div>
                <div className="checkout-fields">
                  <label className="checkout-field">
                    <span>상세 주소</span>
                    <input
                      value={form.addressLine2}
                      onChange={(e) => updateField('addressLine2', e.target.value)}
                      placeholder="동/호수"
                    />
                  </label>
                  <label className="checkout-field">
                    <span>배송 메모</span>
                    <input
                      value={form.deliveryMemo}
                      onChange={(e) => updateField('deliveryMemo', e.target.value)}
                      placeholder="문 앞에 놔주세요"
                    />
                  </label>
                </div>
              </section>

              <section className="checkout-section">
                <div className="checkout-section__head">
                  <span className="checkout-section__num">3</span>
                  <h2 className="checkout-section__title">결제 수단</h2>
                </div>
                <div className="checkout-payment-grid">
                  {PAYMENT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`checkout-payment-btn${form.paymentMethod === opt.id ? ' checkout-payment-btn--active' : ''}`}
                      onClick={() => updateField('paymentMethod', opt.id)}
                    >
                      <span
                        className={`checkout-payment-btn__logo${opt.id === 'card' ? ' checkout-payment-btn__logo--visa' : ''}${opt.id === 'kakao' ? ' checkout-payment-btn__logo--kakao' : ''}`}
                      >
                        {opt.logo}
                      </span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <aside className="checkout-aside">
              <div className="checkout-order">
                <h2 className="checkout-order__title">주문 요약</h2>
                <ul className="checkout-order__items">
                  {cart.items.map((item) => {
                    const p = item.product
                    if (!p) return null
                    return (
                      <li key={item._id} className="checkout-order__item">
                        <div className="checkout-order__thumb">
                          <img src={p.image} alt="" />
                        </div>
                        <div className="checkout-order__info">
                          <span className="checkout-order__name">{p.name}</span>
                          <p className="checkout-order__meta">
                            {item.size && `Size: ${item.size}`}
                            {item.size && item.color && ' · '}
                            {item.color && `Color: ${item.color}`}
                            {' · '}
                            {item.quantity}개
                          </p>
                          <p className="checkout-order__price">{formatKrw(item.lineTotal)}</p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
                <div className="checkout-order__rows">
                  <p className="checkout-order__row">
                    <span>상품 합계</span>
                    <span>{formatKrw(cart.subtotal)}</span>
                  </p>
                  <p className="checkout-order__row">
                    <span>배송비</span>
                    <span>{shippingFee === 0 ? '무료' : formatKrw(shippingFee)}</span>
                  </p>
                  {cart.subtotal < FREE_SHIPPING_THRESHOLD && (
                    <p className="checkout-order__row checkout-order__row--discount">
                      <span>무료배송 안내</span>
                      <span>
                        {formatKrw(FREE_SHIPPING_THRESHOLD - cart.subtotal)} 더 담기
                      </span>
                    </p>
                  )}
                </div>
                <p className="checkout-order__total">
                  <span>총 결제</span>
                  <span>{formatKrw(orderTotal)}</span>
                </p>
                {portoneError && needsPortOne && (
                  <p className="checkout-page__message checkout-page__message--error" role="alert">
                    {portoneError}
                  </p>
                )}
                <button
                  type="submit"
                  className="checkout-order__submit"
                  disabled={ordering || !canSubmitPayment}
                >
                  {ordering ? '주문 처리 중…' : `${formatKrw(orderTotal)} 결제하기 →`}
                </button>
                <label className="checkout-order__terms">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                  />
                  <span>
                    주문을 확인함으로써 이용약관 및 개인정보 처리방침에 동의합니다.
                  </span>
                </label>
              </div>
            </aside>
          </form>
        )}
      </div>
      <Footer />
    </div>
  )
}
