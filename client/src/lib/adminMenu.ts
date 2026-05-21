/** AdminLayout 상단 메뉴와 Navbar 관리자 드롭다운에서 공통 사용 */
export const ADMIN_TOP_MENU = [
  { label: '배너관리', to: '/admin' },
  { label: '상품관리', to: '/admin/products' },
  { label: '주문관리', to: '/admin/orders' },
  { label: '게시판관리', to: '/admin' },
  { label: '사이트관리', to: '/admin' },
  { label: '입점관리', to: '/admin' },
] as const
