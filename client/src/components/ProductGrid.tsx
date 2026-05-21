import { memo } from 'react'
import type { Product } from '@/data/homeCatalog'
import { ProductCard } from '@/components/ProductCard'

type ProductGridProps = {
  title: string
  products: Product[]
  sectionId?: string
  viewAllHref?: string
  hideViewAll?: boolean
}

function ProductGridComponent({
  title,
  products,
  sectionId,
  viewAllHref,
  hideViewAll = false,
}: ProductGridProps) {
  const showViewAll = !hideViewAll && viewAllHref

  return (
    <section className="home-section" id={sectionId}>
      <div className="home-section__head">
        <h2 className="home-section__title">{title}</h2>
        {showViewAll && (
          <a href={viewAllHref} className="home-section__link">
            전체 보기
          </a>
        )}
      </div>
      <div className="home-products">
        {products.map((product) => (
          <ProductCard
            key={product.id ?? product.name}
            product={product}
          />
        ))}
      </div>
    </section>
  )
}

export const ProductGrid = memo(ProductGridComponent)
