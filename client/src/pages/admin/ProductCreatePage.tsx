import { useEffect, useId, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CloudinaryImageUpload } from '@/components/CloudinaryImageUpload'
import { ProductMobilePreview } from '@/components/admin/ProductMobilePreview'
import {
  PRODUCT_CATEGORIES,
  fetchProduct,
  registerProduct,
  updateProduct,
  type ProductCategory,
  type ProductInput,
} from '@/lib/productsApi'
import { getAccessToken } from '@/lib/authStorage'
import './ProductCreatePage.css'

const emptyForm: ProductInput = {
  sku: '',
  name: '',
  price: 0,
  category: '상의',
  image: '',
  description: '',
}

function splitDescription(desc: string) {
  const trimmed = desc.trim()
  if (!trimmed) return { summary: '', detail: '' }
  const idx = trimmed.indexOf('\n\n')
  if (idx === -1) return { summary: trimmed, detail: '' }
  return {
    summary: trimmed.slice(0, idx),
    detail: trimmed.slice(idx + 2),
  }
}

function mergeDescription(summary: string, detail: string) {
  const parts = [summary.trim(), detail.trim()].filter(Boolean)
  return parts.join('\n\n')
}

function RequiredDot() {
  return (
    <span className="product-register__required" aria-hidden>
      *
    </span>
  )
}

type EditorToolbarProps = {
  targetId: string
  value: string
  onChange: (value: string) => void
}

function EditorToolbar({ targetId, value, onChange }: EditorToolbarProps) {
  const wrap = (before: string, after: string) => {
    const el = document.getElementById(targetId) as HTMLTextAreaElement | null
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = value.slice(start, end)
    const next = value.slice(0, start) + before + selected + after + value.slice(end)
    onChange(next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + before.length, end + before.length)
    })
  }

  return (
    <div className="product-register__editor-toolbar">
      <button type="button" onClick={() => wrap('**', '**')} title="굵게">
        B
      </button>
      <button type="button" onClick={() => wrap('_', '_')} title="기울임">
        I
      </button>
      <button type="button" onClick={() => wrap('~~', '~~')} title="취소선">
        S
      </button>
      <button type="button" onClick={() => wrap('- ', '')} title="목록">
        •
      </button>
    </div>
  )
}

export function ProductCreatePage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const [form, setForm] = useState<ProductInput>(emptyForm)
  const [summary, setSummary] = useState('')
  const [detail, setDetail] = useState('')
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)

  const summaryId = useId()
  const detailId = useId()

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const product = await fetchProduct(id)
        if (cancelled) return
        const { summary: s, detail: d } = splitDescription(product.description ?? '')
        setForm({
          sku: product.sku,
          name: product.name,
          price: product.price,
          category: product.category,
          image: product.image,
          description: product.description ?? '',
        })
        setSummary(s)
        setDetail(d)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : '상품을 불러오지 못했습니다.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  function updateField<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleImageChange(url: string) {
    updateField('image', url)
    setImageError(null)
  }

  function validateForm(): string | null {
    if (!getAccessToken()) {
      return '로그인이 필요합니다. 관리자 계정으로 로그인해 주세요.'
    }
    if (!form.sku.trim()) return 'SKU를 입력해 주세요.'
    if (!form.name.trim()) return '상품명을 입력해 주세요.'
    if (!form.category || !PRODUCT_CATEGORIES.includes(form.category)) {
      return '카테고리를 선택해 주세요.'
    }
    if (!Number.isFinite(form.price) || form.price < 0) {
      return '가격을 0원 이상으로 입력해 주세요.'
    }
    if (!form.image.trim()) return '상품 이미지를 등록해 주세요.'
    return null
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)
    setError(null)
    try {
      const payload: ProductInput = {
        sku: form.sku.trim().toUpperCase(),
        name: form.name.trim(),
        price: Number(form.price),
        category: form.category,
        image: form.image.trim(),
        description: mergeDescription(summary, detail),
      }

      if (isEdit && id) {
        await updateProduct(id, payload)
      } else {
        await registerProduct(payload)
      }
      navigate('/admin/products', { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : '저장에 실패했습니다.'
      setError(message)
      if (message.includes('로그인')) {
        navigate('/login', { state: { from: '/admin/products/new' } })
      }
    } finally {
      setSaving(false)
    }
  }

  const backTo = isEdit ? '/admin/products' : '/admin'

  if (loading) {
    return (
      <div className="product-register">
        <p className="product-register__loading">불러오는 중…</p>
      </div>
    )
  }

  return (
    <div className="product-register">
      <header className="product-register__header">
        <div className="product-register__header-left">
          <Link to={backTo} className="product-register__back" aria-label="뒤로">
            ←
          </Link>
          <h1 className="product-register__title">{isEdit ? '상품 수정' : '상품 등록'}</h1>
        </div>
        <button
          type="submit"
          form="product-register-form"
          className="product-register__submit"
          disabled={saving}
        >
          {saving ? '저장 중…' : '상품 등록 완료'}
        </button>
      </header>

      <div className="product-register__body">
        <form
          id="product-register-form"
          className="product-register__form"
          onSubmit={(e) => void handleSubmit(e)}
        >
          {error && <p className="product-register__error">{error}</p>}

          <section className="product-register__card">
            <h2 className="product-register__card-title">상품 정보</h2>

            <div className="product-register__field">
              <span className="product-register__label">
                이미지
                <RequiredDot />
              </span>
              <CloudinaryImageUpload
                value={form.image}
                onChange={handleImageChange}
                onError={setImageError}
              />
              {imageError && <p className="product-register__error">{imageError}</p>}
            </div>

            <div className="product-register__field">
              <label className="product-register__label" htmlFor="product-sku">
                SKU
                <RequiredDot />
              </label>
              <input
                id="product-sku"
                type="text"
                className="product-register__input"
                required
                value={form.sku}
                onChange={(e) => updateField('sku', e.target.value.toUpperCase())}
                placeholder="예: HTM-001"
              />
            </div>

            <div className="product-register__field">
              <label className="product-register__label" htmlFor="product-name">
                상품명
                <RequiredDot />
              </label>
              <input
                id="product-name"
                type="text"
                className="product-register__input"
                required
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="상품명을 입력해 주세요."
              />
            </div>

            <div className="product-register__row">
              <div className="product-register__field">
                <label className="product-register__label" htmlFor="product-category">
                  카테고리
                  <RequiredDot />
                </label>
                <select
                  id="product-category"
                  className="product-register__select"
                  required
                  value={form.category}
                  onChange={(e) => updateField('category', e.target.value as ProductCategory)}
                >
                  <option value="" disabled>
                    카테고리 선택
                  </option>
                  {PRODUCT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="product-register__field">
                <label className="product-register__label" htmlFor="product-price">
                  가격 (원)
                  <RequiredDot />
                </label>
                <input
                  id="product-price"
                  type="number"
                  className="product-register__input"
                  required
                  min={0}
                  step={1}
                  value={form.price || ''}
                  onChange={(e) => updateField('price', Number(e.target.value))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="product-register__field">
              <label className="product-register__label" htmlFor={summaryId}>
                요약 설명
              </label>
              <EditorToolbar targetId={summaryId} value={summary} onChange={setSummary} />
              <textarea
                id={summaryId}
                className="product-register__textarea product-register__textarea--editor"
                rows={4}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="내용을 입력해 주세요"
              />
            </div>
          </section>

          <section className="product-register__card">
            <h2 className="product-register__card-title">상품 상세 설명</h2>
            <div className="product-register__field">
              <EditorToolbar targetId={detailId} value={detail} onChange={setDetail} />
              <textarea
                id={detailId}
                className="product-register__textarea product-register__textarea--editor product-register__textarea--detail"
                rows={8}
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="내용을 입력해 주세요"
              />
            </div>
          </section>
        </form>

        <aside className="product-register__aside">
          <div className="product-register__aside-head">
            <span>미리보기</span>
            <span aria-hidden>&gt;&gt;</span>
          </div>
          <ProductMobilePreview
            name={form.name}
            price={form.price}
            category={form.category}
            image={form.image}
            summary={summary}
            sku={form.sku}
          />
        </aside>
      </div>
    </div>
  )
}
