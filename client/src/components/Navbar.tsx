import { memo, useCallback, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  IconBag,
  IconHeart,
  IconMenu,
  IconSearch,
} from '@/components/NavIcons'
import type { StoredUser } from '@/lib/authStorage'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useCart } from '@/hooks/useCart'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { ADMIN_TOP_MENU } from '@/lib/adminMenu'
import { BRAND_LOGO_SRC, BRAND_NAME } from '@/lib/brand'
import './Navbar.css'

function NavbarComponent() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { user?: StoredUser } | null

  const { loading, loggedIn, displayName, isAdmin, logout } = useCurrentUser(
    state?.user,
  )
  const { itemCount } = useCart()

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const closeMenu = useCallback(() => setMenuOpen(false), [])
  useClickOutside(menuRef, closeMenu, menuOpen)

  const handleLogout = useCallback(async () => {
    closeMenu()
    await logout()
    navigate('/', { replace: true })
  }, [closeMenu, logout, navigate])

  return (
    <nav className="navbar" aria-label="메인">
      <button
        type="button"
        className="navbar__icon-btn navbar__menu"
        aria-label="메뉴"
      >
        <IconMenu />
      </button>

      <Link to="/" className="navbar__logo" aria-label={`${BRAND_NAME} 홈`}>
        <img
          className="navbar__logo-img"
          src={BRAND_LOGO_SRC}
          alt=""
          width={36}
          height={36}
        />
        <span className="navbar__logo-text">{BRAND_NAME}</span>
      </Link>

      <div className="navbar__actions">
        <button type="button" className="navbar__icon-btn" aria-label="검색">
          <IconSearch />
        </button>

        {loading ? (
          <span className="navbar__loading" aria-live="polite">
            …
          </span>
        ) : loggedIn && displayName ? (
          <div className="navbar__user" ref={menuRef}>
            <button
              type="button"
              className="navbar__welcome"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              {displayName}님 환영합니다
              <span className="navbar__chevron" aria-hidden>
                ▾
              </span>
            </button>
            {menuOpen && (
              <div className="navbar__dropdown" role="menu">
                <Link
                  to="/orders"
                  className="navbar__dropdown-item"
                  role="menuitem"
                  onClick={closeMenu}
                >
                  주문목록
                </Link>
                {isAdmin && (
                  <>
                    <div
                      className="navbar__dropdown-divider"
                      role="separator"
                      aria-hidden
                    />
                    {ADMIN_TOP_MENU.map((item) => (
                      <Link
                        key={item.label}
                        to={item.to}
                        className="navbar__dropdown-item navbar__dropdown-item--admin"
                        role="menuitem"
                        onClick={closeMenu}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </>
                )}
                <button
                  type="button"
                  className="navbar__dropdown-item"
                  role="menuitem"
                  onClick={handleLogout}
                >
                  로그아웃
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className="navbar__login">
            로그인
          </Link>
        )}

        {isAdmin && (
          <Link to="/admin" className="navbar__admin">
            Admin
          </Link>
        )}

        <button type="button" className="navbar__icon-btn" aria-label="위시리스트">
          <IconHeart />
        </button>

        <Link
          to="/cart"
          className="navbar__icon-btn navbar__cart"
          aria-label={`장바구니${itemCount > 0 ? `, ${itemCount}개` : ''}`}
        >
          <IconBag />
          {itemCount > 0 && (
            <span className="navbar__cart-badge">{itemCount}</span>
          )}
        </Link>
      </div>
    </nav>
  )
}

export const Navbar = memo(NavbarComponent)
