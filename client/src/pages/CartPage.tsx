import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import {
  clearCart,
  fetchCart,
  removeCartItem,
  updateCartItem,
  type Cart,
} from '@/lib/cartApi'
import { isLoggedIn } from '@/lib/authStorage'
import {
  calculateShippingFee,
  FREE_SHIPPING_THRESHOLD,
} from '@/lib/ordersApi'
import { formatKrw } from '@/lib/productsApi'
import './CartPage.css'

export function CartPage() {
  const navigate = useNavigate()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

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
    } catch (err) {
      setError(err instanceof Error ? err.message : '장바구니를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const shippingFee = useMemo(
    () => (cart ? calculateShippingFee(cart.subtotal) : 0),
    [cart],
  )

  const orderTotal = useMemo(
    () => (cart ? cart.subtotal + shippingFee : 0),
    [cart, shippingFee],
  )

  async function handleQuantityChange(itemId: string, quantity: number) {
    setUpdatingId(itemId)
    try {
      const data = await updateCartItem(itemId, quantity)
      setCart(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '수량 변경에 실패했습니다.')
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleRemove(itemId: string) {
    setUpdatingId(itemId)
    try {
      const data = await removeCartItem(itemId)
      setCart(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제에 실패했습니다.')
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleClear() {
    if (!window.confirm('장바구니를 비우시겠습니까?')) return
    try {
      const data = await clearCart()
      setCart(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '비우기에 실패했습니다.')
    }
  }

  function handleCheckout() {
    if (!cart?.items.length) return
    navigate('/checkout')
  }

  if (!isLoggedIn()) {
    return (
      <div className="cart-page">
        <Navbar />
        <div className="cart-page__inner">
          <h1 className="cart-page__title">장바구니</h1>
          <p className="cart-page__message">
            장바구니를 이용하려면 로그인해 주세요.
          </p>
          <Link to="/login" state={{ from: '/cart' }} className="cart-page__cta">
            로그인하기
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="cart-page">
      <Navbar />
      <div className="cart-page__inner">
        <div className="cart-page__head">
          <h1 className="cart-page__title">장바구니</h1>
          {cart && cart.items.length > 0 && (
            <button
              type="button"
              className="cart-page__clear"
              onClick={() => void handleClear()}
            >
              전체 삭제
            </button>
          )}
        </div>

        {loading && (
          <p className="cart-page__message" role="status">
            불러오는 중…
          </p>
        )}

        {error && (
          <p className="cart-page__message cart-page__message--error" role="alert">
            {error}
          </p>
        )}

        {!loading && cart && cart.items.length === 0 && (
          <p className="cart-page__message">장바구니가 비어 있습니다.</p>
        )}

        {!loading && cart && cart.items.length > 0 && (
          <div className="cart-layout">
            <ul className="cart-list">
              {cart.items.map((item) => {
                const p = item.product
                if (!p) return null
                return (
                  <li key={item._id} className="cart-item">
                    <Link
                      to={`/products/${p._id}`}
                      className="cart-item__image"
                    >
                      <img src={p.image} alt={p.name} />
                    </Link>
                    <div className="cart-item__body">
                      <Link to={`/products/${p._id}`} className="cart-item__name">
                        {p.name}
                      </Link>
                      <p className="cart-item__meta">
                        {item.size ? <span>Size: {item.size}</span> : null}
                        {item.color ? (
                          <span
                            className="cart-item__color"
                            style={{ backgroundColor: item.color }}
                            title={item.color}
                          />
                        ) : null}
                      </p>
                      <p className="cart-item__price">{formatKrw(p.price)}</p>
                      <div className="cart-item__actions">
                        <label className="cart-item__qty-label">
                          수량
                          <input
                            type="number"
                            min={1}
                            max={99}
                            value={item.quantity}
                            disabled={updatingId === item._id}
                            onChange={(e) => {
                              const q = Math.max(1, Number(e.target.value) || 1)
                              void handleQuantityChange(item._id, q)
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          className="cart-item__remove"
                          disabled={updatingId === item._id}
                          onClick={() => void handleRemove(item._id)}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                    <p className="cart-item__line-total">
                      {formatKrw(item.lineTotal)}
                    </p>
                  </li>
                )
              })}
            </ul>

            <aside className="cart-sidebar">
              <div className="cart-summary">
                <p className="cart-summary__row">
                  <span>상품 수</span>
                  <span>{cart.itemCount}개</span>
                </p>
                <p className="cart-summary__row">
                  <span>상품 합계</span>
                  <span>{formatKrw(cart.subtotal)}</span>
                </p>
                <p className="cart-summary__row">
                  <span>배송비</span>
                  <span>
                    {shippingFee === 0
                      ? '무료'
                      : formatKrw(shippingFee)}
                  </span>
                </p>
                {cart.subtotal < FREE_SHIPPING_THRESHOLD && (
                  <p className="cart-summary__hint">
                    {formatKrw(FREE_SHIPPING_THRESHOLD - cart.subtotal)} 더 담으면
                    무료배송
                  </p>
                )}
                <p className="cart-summary__row cart-summary__row--total">
                  <span>결제 예정</span>
                  <span>{formatKrw(orderTotal)}</span>
                </p>
                <button
                  type="button"
                  className="cart-summary__checkout"
                  onClick={handleCheckout}
                >
                  결제하기
                </button>
              </div>
            </aside>
          </div>
        )}

        <Link to="/" className="cart-page__continue">
          쇼핑 계속하기
        </Link>
      </div>
      <Footer />
    </div>
  )
}
