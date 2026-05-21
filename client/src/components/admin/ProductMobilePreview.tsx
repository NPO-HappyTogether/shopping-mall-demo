import { PRODUCT_CATEGORIES, type ProductCategory } from '@/lib/productsApi'

type ProductMobilePreviewProps = {
  name: string
  price: number
  category: ProductCategory | ''
  image: string
  summary: string
  sku?: string
}

function formatPrice(price: number) {
  if (!price || price <= 0) return '0원'
  return `${new Intl.NumberFormat('ko-KR').format(price)}원`
}

export function ProductMobilePreview({
  name,
  price,
  category,
  image,
  summary,
  sku = '',
}: ProductMobilePreviewProps) {
  const displayName = name.trim() || '상품명'
  const displaySummary = summary.trim() || '요약 설명'
  const categoryLabel =
    category && PRODUCT_CATEGORIES.includes(category) ? category : '카테고리'

  return (
    <div className="product-preview">
      <div className="product-preview__phone">
        <div className="product-preview__status">
          <span>9:41</span>
          <span className="product-preview__status-icons" aria-hidden>
            ▮▮▮ ◉
          </span>
        </div>

        <div className="product-preview__image">
          {image ? (
            <img src={image} alt="" />
          ) : (
            <div className="product-preview__image-placeholder" />
          )}
        </div>

        <div className="product-preview__body">
          <div className="product-preview__title-row">
            <div>
              <p className="product-preview__name">{displayName}</p>
              <p className="product-preview__price">{formatPrice(price)}</p>
              <p className="product-preview__summary">{displaySummary}</p>
              <p className="product-preview__category">{categoryLabel}</p>
            </div>
            <div className="product-preview__actions" aria-hidden>
              <span>♡</span>
              <span>⤴</span>
            </div>
          </div>

          <ul className="product-preview__meta">
            <li>
              <span>SKU</span>
              <span>{sku.trim() || '—'}</span>
            </li>
            <li>
              <span>배송</span>
              <span>택배 · 2,500원 (5만원 이상 무료)</span>
            </li>
          </ul>

          <div className="product-preview__tabs">
            <span className="product-preview__tab product-preview__tab--active">상세정보</span>
            <span className="product-preview__tab">구매평</span>
            <span className="product-preview__tab">Q&amp;A</span>
          </div>
        </div>

        <div className="product-preview__footer">
          <button type="button" className="product-preview__btn product-preview__btn--ghost">
            선물하기
          </button>
          <button type="button" className="product-preview__btn product-preview__btn--buy">
            구매하기
          </button>
        </div>
      </div>
    </div>
  )
}
