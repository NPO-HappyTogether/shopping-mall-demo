import { memo } from 'react'
import { BRANDS } from '@/data/homeCatalog'

function BrandGridComponent() {
  return (
    <section className="home-section">
      <h2 className="home-section__title home-section__title--center">
        Shop by Brand
      </h2>
      <div className="home-brands">
        {BRANDS.map((brand) => (
          <a
            key={brand.name}
            href="#brands"
            className="home-brand"
            style={{ backgroundColor: brand.color }}
          >
            <span>{brand.name}</span>
            <em>Shop</em>
          </a>
        ))}
      </div>
    </section>
  )
}

export const BrandGrid = memo(BrandGridComponent)
