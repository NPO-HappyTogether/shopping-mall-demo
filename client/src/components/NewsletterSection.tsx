import { memo } from 'react'

function NewsletterSectionComponent() {
  return (
    <section className="home-newsletter">
      <h2>Join the Hapvi Together Mall family</h2>
      <p>
        Subscribe to get exclusive offers, style tips, and early access to new
        collections.
      </p>
      <form
        className="home-newsletter__form"
        onSubmit={(e) => e.preventDefault()}
      >
        <input type="email" placeholder="Enter your email" aria-label="이메일" />
        <button type="submit" className="home-btn home-btn--dark">
          Subscribe
        </button>
      </form>
    </section>
  )
}

export const NewsletterSection = memo(NewsletterSectionComponent)
