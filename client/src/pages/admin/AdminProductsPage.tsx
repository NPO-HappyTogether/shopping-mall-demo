import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  PRODUCT_CATEGORIES,
  deleteProduct,
  fetchProducts,
  type Product,
  type ProductsPagination,
} from '@/lib/productsApi'

const PAGE_SIZE = 4

type SortKey = 'sku' | 'name' | 'price' | 'category'
type SortDir = 'asc' | 'desc'

const EMPTY_PAGINATION: ProductsPagination = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('ko-KR').format(price)
}

type SortableHeaderProps = {
  label: string
  sortKey: SortKey
  activeKey: SortKey
  sortDir: SortDir
  onSort: (key: SortKey) => void
}

function SortableHeader({ label, sortKey, activeKey, sortDir, onSort }: SortableHeaderProps) {
  const isActive = activeKey === sortKey
  const indicator = !isActive ? '↕' : sortDir === 'asc' ? '↑' : '↓'

  return (
    <th scope="col" aria-sort={isActive ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        className={`admin-table__sort-btn${isActive ? ' admin-table__sort-btn--active' : ''}`}
        onClick={() => onSort(sortKey)}
      >
        <span>{label}</span>
        <span className="admin-table__sort-icon" aria-hidden>
          {indicator}
        </span>
      </button>
    </th>
  )
}

export function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [pagination, setPagination] = useState<ProductsPagination>(EMPTY_PAGINATION)
  const [category, setCategory] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('sku')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const load = useCallback(
    async (pageToLoad: number) => {
      setLoading(true)
      setError(null)
      try {
        const result = await fetchProducts({
          category: category === 'all' ? undefined : category,
          page: pageToLoad,
          limit: PAGE_SIZE,
          sortBy: sortKey,
          sortOrder: sortDir,
        })
        setProducts(result.products)
        setPagination(result.pagination)
        setPage(result.pagination.page)
      } catch (e) {
        setError(e instanceof Error ? e.message : '상품 목록을 불러오지 못했습니다.')
      } finally {
        setLoading(false)
      }
    },
    [category, sortKey, sortDir],
  )

  useEffect(() => {
    void load(page)
  }, [load, page])

  function handleSort(key: SortKey) {
    setPage(1)
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function goToPage(nextPage: number) {
    if (nextPage < 1 || (pagination.totalPages > 0 && nextPage > pagination.totalPages)) return
    setPage(nextPage)
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`「${name}」 상품을 삭제할까요?`)) return
    try {
      await deleteProduct(id)
      const nextPage =
        products.length === 1 && page > 1 ? page - 1 : page
      if (nextPage !== page) {
        setPage(nextPage)
      } else {
        await load(page)
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : '삭제에 실패했습니다.')
    }
  }

  return (
    <main className="admin-main">
      <p className="admin-breadcrumb">Home &gt; 상품관리</p>
      <div className="admin-page-head">
        <h1 className="admin-title">상품관리</h1>
        <Link to="/admin/products/new" className="admin-btn admin-btn--primary">
          상품 등록
        </Link>
      </div>

      <div className="admin-toolbar">
        <label className="admin-toolbar__label">
          카테고리
          <select
            className="admin-select"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">전체</option>
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="admin-btn" onClick={() => void load(page)}>
          새로고침
        </button>
      </div>

      {error && <p className="admin-alert admin-alert--error">{error}</p>}
      {loading && <p className="admin-muted-text">불러오는 중…</p>}

      {!loading && !error && (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table admin-table--products">
              <thead>
                <tr>
                  <SortableHeader
                    label="SKU"
                    sortKey="sku"
                    activeKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <th scope="col">이미지</th>
                  <SortableHeader
                    label="상품명"
                    sortKey="name"
                    activeKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="가격"
                    sortKey="price"
                    activeKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="카테고리"
                    sortKey="category"
                    activeKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <th scope="col">관리</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="admin-table__empty">
                      등록된 상품이 없습니다.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p._id} className="admin-table__row">
                      <td>{p.sku}</td>
                      <td className="admin-table__cell-image">
                        <img
                          src={p.image}
                          alt=""
                          className="admin-product-thumb"
                          loading="lazy"
                        />
                      </td>
                      <td className="admin-table__cell-name" title={p.name}>
                        {p.name}
                      </td>
                      <td>{formatPrice(p.price)}원</td>
                      <td>{p.category}</td>
                      <td className="admin-table__actions">
                        <Link
                          to={`/admin/products/${p._id}/edit`}
                          className="admin-btn admin-btn--sm"
                        >
                          수정
                        </Link>
                        <button
                          type="button"
                          className="admin-btn admin-btn--sm admin-btn--danger"
                          onClick={() => void handleDelete(p._id, p.name)}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.total > 0 && (
            <nav className="admin-pagination" aria-label="상품 목록 페이지">
              <button
                type="button"
                className="admin-btn admin-btn--sm"
                disabled={!pagination.hasPrev || loading}
                onClick={() => goToPage(page - 1)}
              >
                이전
              </button>
              <span className="admin-pagination__info">
                {pagination.page} / {pagination.totalPages} 페이지 (총 {pagination.total}개 · 페이지당{' '}
                {pagination.limit}개)
              </span>
              <button
                type="button"
                className="admin-btn admin-btn--sm"
                disabled={!pagination.hasNext || loading}
                onClick={() => goToPage(page + 1)}
              >
                다음
              </button>
            </nav>
          )}
        </>
      )}
    </main>
  )
}
