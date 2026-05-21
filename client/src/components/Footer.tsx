import { memo } from 'react'
import { Link } from 'react-router-dom'
import { FOOTER_LINKS } from '@/data/homeCatalog'
import { BRAND_LOGO_SRC, BRAND_NAME } from '@/lib/brand'
import { PRODUCT_CATEGORIES } from '@/lib/productsApi'
import './Footer.css'

const COPYRIGHT_YEAR = new Date().getFullYear()

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: readonly string[]
}) {
  return (
    <div>
      <h4>{title}</h4>
      {links.map((label) => (
        <a key={label} href={`#${label}`}>
          {label}
        </a>
      ))}
    </div>
  )
}

function FooterComponent() {
  return (
    <footer className="home-footer">
      <div className="home-footer__top">
        <div className="home-footer__brand">
          <Link to="/" className="home-footer__logo">
            <img src={BRAND_LOGO_SRC} alt="" width={40} height={40} />
            <span>{BRAND_NAME}</span>
          </Link>
          <div className="home-footer__social">
            <a href="#facebook" aria-label="Facebook">
              f
            </a>
            <a href="#instagram" aria-label="Instagram">
              ig
            </a>
            <a href="#twitter" aria-label="Twitter">
              x
            </a>
          </div>
        </div>
        <div className="home-footer__cols">
          <FooterColumn title="Shop" links={PRODUCT_CATEGORIES} />
          <FooterColumn title="Help" links={FOOTER_LINKS.help} />
          <FooterColumn title="Company" links={FOOTER_LINKS.company} />
          <div>
            <h4>Contact</h4>
            <a href="mailto:hello@hapvi.com">hello@hapvi.com</a>
            <a href="tel:+1234567890">+1 (234) 567-890</a>
          </div>
        </div>
      </div>
      <p className="home-footer__copy">
        © {COPYRIGHT_YEAR} Hapvi Together Mall. All rights reserved.
      </p>
    </footer>
  )
}

export const Footer = memo(FooterComponent)
