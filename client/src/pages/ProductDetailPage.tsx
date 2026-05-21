import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import { IconHeart } from '@/components/NavIcons'
import { splitDescription } from '@/lib/productDescription'
import { addToCart } from '@/lib/cartApi'
import { isLoggedIn } from '@/lib/authStorage'
import {
  fetchPublicProduct,
  fetchPublicProducts,
  formatKrw,
  type Product,
} from '@/lib/productsApi'
import './ProductDetailPage.css'

const SIZES = ['XS', 'S', 'M', 'L', 'XL'] as const
const COLORS = [
  { name: 'Burgundy', value: '#4a0404' },
  { name: 'Black', value: '#111111' },
  { name: 'Camel', value: '#c4a574' },
  { name: 'Ivory', value: '#e8e4df' },
] as const

const REFUND_POLICY = `구매 후 7일 이내 미착용·택 부착 상태에서 교환 및 환불이 가능합니다.
단순 변심에 의한 반품 시 왕복 배송비는 고객 부담입니다.`

const SHIPPING_INFO = `5만원 이상 구매 시 무료 배송됩니다.
평일 오후 2시 이전 주문 건은 당일 출고되며, 배송은 2~4영업일 소요됩니다.`

type AccordionId = 'info' | 'refund' | 'shipping'

function DetailAccordion({
  id,
  title,
  open,
  onToggle,
  children,
}: {
  id: AccordionId
  title: string
  open: boolean
  onToggle: (id: AccordionId) => void
  children: ReactNode
}) {
  return (
    <div className="pdp-accordion">
      <button
        type="button"
        className="pdp-accordion__trigger"
        aria-expanded={open}
        onClick={() => onToggle(id)}
      >
        <span>{title}</span>
        <span className="pdp-accordion__icon" aria-hidden>
          {open ? '−' : '+'}
        </span>
      </button>
      {open && <div className="pdp-accordion__panel">{children}</div>}
    </div>
  )
}

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [product, setProduct] = useState<Product | null>(null)
  const [siblings, setSiblings] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [activeThumb, setActiveThumb] = useState(0)
  const [size, setSize] = useState<string>(SIZES[2])
  const [color, setColor] = useState<string>(COLORS[0].value)
  const [quantity, setQuantity] = useState(1)
  const [wishlist, setWishlist] = useState(false)
  const [openAccordion, setOpenAccordion] = useState<AccordionId | null>('info')
  const [addingToCart, setAddingToCart] = useState(false)
  const [cartMessage, setCartMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setError('상품을 찾을 수 없습니다.')
      setLoading(false)
      return
    }

    const productId = id
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [detail, list] = await Promise.all([
          fetchPublicProduct(productId),
          fetchPublicProducts(),
        ])
        if (cancelled) return
        setProduct(detail)
        const sameCategory = list.filter((p) => p.category === detail.category)
        setSiblings(sameCategory.length > 0 ? sameCategory : list)
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : '상품을 불러오지 못했습니다.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [id])

  const { summary, detail } = useMemo(
    () => splitDescription(product?.description ?? ''),
    [product?.description],
  )

  const thumbImages = useMemo(() => {
    if (!product) return []
    return [product.image, product.image, product.image, product.image]
  }, [product])

  const mainImage = thumbImages[activeThumb] ?? product?.image ?? ''

  const navIndex = useMemo(() => {
    if (!product) return -1
    return siblings.findIndex((p) => p._id === product._id)
  }, [product, siblings])

  const prevProduct = navIndex > 0 ? siblings[navIndex - 1] : null
  const nextProduct =
    navIndex >= 0 && navIndex < siblings.length - 1
      ? siblings[navIndex + 1]
      : null

  const toggleAccordion = useCallback((section: AccordionId) => {
    setOpenAccordion((current) => (current === section ? null : section))
  }, [])

  const handleAddToCart = useCallback(async () => {
    if (!product) return
    if (!isLoggedIn()) {
      navigate('/login', { state: { from: `/products/${product._id}` } })
      return
    }
    setAddingToCart(true)
    setCartMessage(null)
    try {
      await addToCart({
        productId: product._id,
        quantity,
        size,
        color,
      })
      setCartMessage('장바구니에 담았습니다.')
    } catch (err) {
      setCartMessage(
        err instanceof Error ? err.message : '장바구니 담기에 실패했습니다.',
      )
    } finally {
      setAddingToCart(false)
    }
  }, [product, quantity, size, color, navigate])

  if (loading) {
    return (
      <div className="pdp">
        <Navbar />
        <p className="pdp-status" role="status">
          상품 정보를 불러오는 중…
        </p>
        <Footer />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="pdp">
        <Navbar />
        <p className="pdp-status pdp-status--error" role="alert">
          {error ?? '상품을 찾을 수 없습니다.'}
        </p>
        <Link to="/" className="pdp-back-link">
          메인으로 돌아가기
        </Link>
        <Footer />
      </div>
    )
  }

  return (
    <div className="pdp">
      <Navbar />

      <div className="pdp-top">
        <nav className="pdp-breadcrumb" aria-label="breadcrumb">
          <Link to="/">Main</Link>
          <span aria-hidden>/</span>
          <Link to={`/#${product.category}`}>{product.category}</Link>
          <span aria-hidden>/</span>
          <span aria-current="page">{product.name}</span>
        </nav>

        <div className="pdp-nav-links">
          {prevProduct ? (
            <Link
              to={`/products/${prevProduct._id}`}
              className="pdp-nav-links__item"
            >
              ‹ Previous
            </Link>
          ) : (
            <span className="pdp-nav-links__item pdp-nav-links__item--disabled">
              ‹ Previous
            </span>
          )}
          <span className="pdp-nav-links__sep" aria-hidden>
            |
          </span>
          {nextProduct ? (
            <Link
              to={`/products/${nextProduct._id}`}
              className="pdp-nav-links__item"
            >
              Next ›
            </Link>
          ) : (
            <span className="pdp-nav-links__item pdp-nav-links__item--disabled">
              Next ›
            </span>
          )}
        </div>
      </div>

      <div className="pdp-layout">
        <div className="pdp-gallery">
          <div className="pdp-gallery__main">
            <img src={mainImage} alt={product.name} />
          </div>
          <div className="pdp-gallery__thumbs">
            {thumbImages.map((src, index) => (
              <button
                key={index}
                type="button"
                className={`pdp-gallery__thumb${activeThumb === index ? ' pdp-gallery__thumb--active' : ''}`}
                onClick={() => setActiveThumb(index)}
                aria-label={`이미지 ${index + 1}`}
                aria-current={activeThumb === index}
              >
                <img src={src} alt="" />
              </button>
            ))}
          </div>
          {summary && <p className="pdp-gallery__summary">{summary}</p>}
        </div>

        <div className="pdp-info">
          <h1 className="pdp-info__name">{product.name}</h1>
          <p className="pdp-info__sku">SKU: {product.sku}</p>
          <p className="pdp-info__price">{formatKrw(product.price)}</p>

          <div className="pdp-field">
            <label className="pdp-field__label" htmlFor="pdp-size">
              Size
            </label>
            <select
              id="pdp-size"
              className="pdp-field__select"
              value={size}
              onChange={(e) => setSize(e.target.value)}
            >
              {SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="pdp-field">
            <span className="pdp-field__label">Color</span>
            <div className="pdp-colors" role="radiogroup" aria-label="색상">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  role="radio"
                  aria-checked={color === c.value}
                  aria-label={c.name}
                  className={`pdp-colors__swatch${color === c.value ? ' pdp-colors__swatch--active' : ''}`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => setColor(c.value)}
                />
              ))}
            </div>
          </div>

          <div className="pdp-field">
            <label className="pdp-field__label" htmlFor="pdp-qty">
              Quantity
            </label>
            <input
              id="pdp-qty"
              type="number"
              className="pdp-field__qty"
              min={1}
              max={99}
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.max(1, Number(e.target.value) || 1))
              }
            />
          </div>

          {cartMessage && (
            <p
              className={`pdp-cart-message${cartMessage.includes('실패') ? ' pdp-cart-message--error' : ''}`}
              role="status"
            >
              {cartMessage}
              {cartMessage.includes('담았습니다') && (
                <>
                  {' '}
                  <Link to="/cart">장바구니 보기</Link>
                </>
              )}
            </p>
          )}

          <div className="pdp-actions">
            <button
              type="button"
              className="pdp-btn pdp-btn--primary"
              disabled={addingToCart}
              onClick={() => void handleAddToCart()}
            >
              {addingToCart ? '담는 중…' : 'Add to Cart'}
            </button>
            <button
              type="button"
              className={`pdp-btn pdp-btn--wish${wishlist ? ' pdp-btn--wish--active' : ''}`}
              aria-label="위시리스트"
              aria-pressed={wishlist}
              onClick={() => setWishlist((v) => !v)}
            >
              <IconHeart />
            </button>
          </div>
          <button type="button" className="pdp-btn pdp-btn--secondary">
            Buy Now
          </button>

          <div className="pdp-accordions">
            <DetailAccordion
              id="info"
              title="Product Information"
              open={openAccordion === 'info'}
              onToggle={toggleAccordion}
            >
              <p>{detail || summary || '상품 상세 정보가 준비 중입니다.'}</p>
            </DetailAccordion>
            <DetailAccordion
              id="refund"
              title="Refund & Exchange Policy"
              open={openAccordion === 'refund'}
              onToggle={toggleAccordion}
            >
              <p>{REFUND_POLICY}</p>
            </DetailAccordion>
            <DetailAccordion
              id="shipping"
              title="Shipping Information"
              open={openAccordion === 'shipping'}
              onToggle={toggleAccordion}
            >
              <p>{SHIPPING_INFO}</p>
            </DetailAccordion>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
