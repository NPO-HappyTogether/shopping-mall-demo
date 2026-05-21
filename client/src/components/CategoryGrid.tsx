import { memo } from 'react'
import {
  PRODUCT_CATEGORIES,
  type ProductCategory,
} from '@/lib/productsApi'

const CATEGORY_IMAGES: Record<ProductCategory, string> = {
  상의:
    'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80',
  하의:
    'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&q=80',
  악세서리:
    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80',
  신발:
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80',
}

function CategoryGridComponent() {
  return (
    <section className="home-section">
      <h2 className="home-section__title">카테고리</h2>
      <div className="home-categories">
        {PRODUCT_CATEGORIES.map((category) => (
          <a
            key={category}
            href={`#${category}`}
            className="home-category"
          >
            <img
              src={CATEGORY_IMAGES[category]}
              alt={category}
              loading="lazy"
            />
            <span>{category}</span>
          </a>
        ))}
      </div>
    </section>
  )
}

export const CategoryGrid = memo(CategoryGridComponent)
