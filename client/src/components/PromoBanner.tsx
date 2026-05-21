import { memo } from 'react'

type PromoBannerProps = {
  variant: 'sale' | 'new'
  label: string
  title: string
  subtitle: string
  buttonLabel: string
  buttonVariant: 'light' | 'dark'
}

function PromoBannerComponent({
  variant,
  label,
  title,
  subtitle,
  buttonLabel,
  buttonVariant,
}: PromoBannerProps) {
  return (
    <section className={`home-promo home-promo--${variant}`}>
      <div>
        <p className="home-promo__label">{label}</p>
        <h2>{title}</h2>
        <p className="home-promo__sub">{subtitle}</p>
        <button
          type="button"
          className={`home-btn home-btn--${buttonVariant}`}
        >
          {buttonLabel}
        </button>
      </div>
    </section>
  )
}

export const PromoBanner = memo(PromoBannerComponent)
