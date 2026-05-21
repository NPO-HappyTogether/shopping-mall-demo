import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { CategoryGrid } from '@/components/CategoryGrid'
import { Footer } from '@/components/Footer'
import { HeroBanner } from '@/components/HeroBanner'
import { Navbar } from '@/components/Navbar'
import { NewsletterSection } from '@/components/NewsletterSection'
import { ProductGrid } from '@/components/ProductGrid'
import { ServicesSection } from '@/components/ServicesSection'
import {
  fetchPublicProducts,
  mapProductToHome,
  PRODUCT_CATEGORIES,
  type Product,
  type ProductCategory,
} from '@/lib/productsApi'
import './HomePage.css'

function groupProductsByCategory(products: Product[]) {
  const groups = Object.fromEntries(
    PRODUCT_CATEGORIES.map((category) => [category, [] as Product[]]),
  ) as Record<ProductCategory, Product[]>

  for (const product of products) {
    if (PRODUCT_CATEGORIES.includes(product.category)) {
      groups[product.category].push(product)
    }
  }

  for (const category of PRODUCT_CATEGORIES) {
    groups[category].sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() -
        new Date(a.createdAt ?? 0).getTime(),
    )
  }

  return groups
}

export function HomePage() {
  const location = useLocation()
  const signedUp = Boolean(
    (location.state as { signedUp?: boolean } | null)?.signedUp,
  )

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadProducts() {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchPublicProducts()
        if (!cancelled) setProducts(data)
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

    loadProducts()
    return () => {
      cancelled = true
    }
  }, [])

  const byCategory = useMemo(() => groupProductsByCategory(products), [products])
  const hasAnyProducts = PRODUCT_CATEGORIES.some(
    (category) => byCategory[category].length > 0,
  )

  return (
    <div className="home">
      <Navbar />

      {signedUp && (
        <p className="home-toast" role="status">
          회원가입이 완료되었습니다. 로그인해 주세요.
        </p>
      )}

      <HeroBanner />
      <CategoryGrid />

      {loading && (
        <p className="home-status" role="status">
          상품을 불러오는 중…
        </p>
      )}

      {error && (
        <p className="home-status home-status--error" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && !hasAnyProducts && (
        <p className="home-status" role="status">
          등록된 상품이 없습니다.
        </p>
      )}

      {!loading &&
        PRODUCT_CATEGORIES.map((category) => {
          const items = byCategory[category]
          if (items.length === 0) return null

          return (
            <ProductGrid
              key={category}
              sectionId={category}
              title={category}
              products={items.map((p) => mapProductToHome(p))}
              hideViewAll
            />
          )
        })}

      <ServicesSection />
      <NewsletterSection />
      <Footer />
    </div>
  )
}
