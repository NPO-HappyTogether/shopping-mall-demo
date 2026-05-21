import { memo } from 'react'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1600&q=80'

function HeroBannerComponent() {
  return (
    <section className="home-hero">
      <img className="home-hero__bg" src={HERO_IMAGE} alt="" />
      <div className="home-hero__overlay" />
      <div className="home-hero__content">
        <h1>SUMMER COLLECTION</h1>
        <button type="button" className="home-btn home-btn--dark">
          Shop Now
        </button>
      </div>
    </section>
  )
}

export const HeroBanner = memo(HeroBannerComponent)
