import { Link, NavLink, Outlet } from 'react-router-dom'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { ADMIN_TOP_MENU } from '@/lib/adminMenu'
import { BRAND_LOGO_SRC, BRAND_NAME } from '@/lib/brand'
import '@/pages/admin/AdminPage.css'

const SIDE_MENU = [
  { label: '방문자 통계', to: '/admin' },
  { label: '주문 관리', to: '/admin/orders' },
  { label: '쪽지', to: '/admin' },
  { label: '메시지', to: '/admin' },
  { label: '상품 등록', to: '/admin/products/new' },
  { label: '이용안내', to: '/admin' },
] as const

export function AdminLayout() {
  const { displayName, logout } = useCurrentUser()
  const userLabel = displayName ?? '관리자'

  return (
    <div className="admin">
      <header className="admin-top">
        <div className="admin-top__inner">
          <Link to="/" className="admin-logo">
            <img src={BRAND_LOGO_SRC} alt="" className="admin-logo__img" />
            <span className="admin-logo__text">{BRAND_NAME}</span>
          </Link>

          <div className="admin-search">
            <select className="admin-search__select" defaultValue="all" aria-label="검색 분류">
              <option value="all">통합검색</option>
            </select>
            <input
              type="search"
              className="admin-search__input"
              placeholder="검색어를 입력하세요"
              aria-label="검색어"
            />
            <button type="button" className="admin-search__btn" aria-label="검색">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M20 20l-3-3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <Link to="/" className="admin-home-link">
            홈페이지가기
          </Link>
        </div>
      </header>

      <nav className="admin-menu" aria-label="관리 메뉴">
        {ADMIN_TOP_MENU.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.to === '/admin'}
            className={({ isActive }) =>
              `admin-menu__item${isActive ? ' admin-menu__item--active' : ''}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="admin-body">
        <aside className="admin-sidebar">
          <div className="admin-profile">
            <div className="admin-profile__avatar" aria-hidden>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" fill="currentColor" />
                <path
                  d="M4 20c0-4 4-6 8-6s8 2 8 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <p className="admin-profile__welcome">
              반갑습니다. <strong>{userLabel}</strong>님
            </p>
            <button type="button" className="admin-profile__logout" onClick={() => logout()}>
              <span aria-hidden>🔒</span> 로그아웃
            </button>
          </div>

          <ul className="admin-side-nav">
            {SIDE_MENU.map((item) => (
              <li key={item.label}>
                <NavLink
                  to={item.to}
                  end={item.to === '/admin'}
                  className={({ isActive }) =>
                    `admin-side-nav__link${isActive ? ' admin-side-nav__link--active' : ''}`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </aside>

        <Outlet />
      </div>

      <footer className="admin-footer">
        <div className="admin-footer__inner">
          <div className="admin-footer__logo">
            <img src={BRAND_LOGO_SRC} alt="" />
            <span>Hapvi Together Mall</span>
          </div>
          <div className="admin-footer__info">
            <p>회사명 : (주)한국능률협회</p>
            <p>대표 : 김한국 | 주소 : 서울특별시 강남구 테헤란로 123</p>
            <p>전화번호 : 02-1234-5678</p>
            <p className="admin-footer__copy">
              Copyright © Hapvi Together Mall. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
