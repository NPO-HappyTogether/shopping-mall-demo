import { memo } from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '@/data/homeCatalog'

type ProductCardProps = {
  product: Product
}

function ProductCardComponent({ product }: ProductCardProps) {
  const content = (
    <>
      <div className="home-product__img-wrap">
        {product.badge && (
          <span
            className={`home-product__badge home-product__badge--${product.badge.toLowerCase()}`}
          >
            {product.badge}
          </span>
        )}
        <img src={product.image} alt={product.name} loading="lazy" />
      </div>
      <h3 className="home-product__name">{product.name}</h3>
      <p className="home-product__price">
        <span>{product.price}</span>
        {product.originalPrice && (
          <span className="home-product__price-old">{product.originalPrice}</span>
        )}
      </p>
    </>
  )

  if (!product.id) {
    return <article className="home-product">{content}</article>
  }

  return (
    <Link
      to={`/products/${product.id}`}
      className="home-product home-product--link"
    >
      {content}
    </Link>
  )
}

export const ProductCard = memo(ProductCardComponent)
