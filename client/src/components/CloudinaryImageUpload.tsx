import { useCloudinaryUploadWidget } from '@/hooks/useCloudinaryUploadWidget'
import { CLOUDINARY_ENV_KEYS } from '@/lib/cloudinary'
import './CloudinaryImageUpload.css'

type CloudinaryImageUploadProps = {
  value: string
  onChange: (url: string) => void
  onError?: (message: string) => void
}

export function CloudinaryImageUpload({
  value,
  onChange,
  onError,
}: CloudinaryImageUploadProps) {
  const { openWidget, isConfigured, configError } = useCloudinaryUploadWidget({
    onSuccess: onChange,
    onError,
  })

  return (
    <div className="cloudinary-upload">
      <div className="cloudinary-upload__main">
        <button
          type="button"
          className={`cloudinary-upload__box${value ? ' cloudinary-upload__box--filled' : ''}`}
          onClick={openWidget}
          disabled={!isConfigured}
        >
          {value ? (
            <img src={value} alt="상품 이미지 미리보기" className="cloudinary-upload__preview" />
          ) : (
            <>
              <span className="cloudinary-upload__icon" aria-hidden>
                🖼
              </span>
              <span className="cloudinary-upload__label">이미지 업로드</span>
            </>
          )}
        </button>

        <div className="cloudinary-upload__actions">
          <button
            type="button"
            className="cloudinary-upload__btn cloudinary-upload__btn--primary"
            onClick={openWidget}
            disabled={!isConfigured}
          >
            {value ? '이미지 변경' : 'Cloudinary로 업로드'}
          </button>
          {value && (
            <button
              type="button"
              className="cloudinary-upload__btn"
              onClick={() => onChange('')}
            >
              삭제
            </button>
          )}
        </div>
      </div>

      {value && (
        <div className="cloudinary-upload__large-preview">
          <img src={value} alt="업로드된 상품 이미지" />
        </div>
      )}

      <p className="cloudinary-upload__hint">
        PNG, GIF, JPG/JPEG, BMP, WEBP · 권장 750×750px · Cloudinary 위젯으로 업로드
      </p>

      {!isConfigured && (
        <p className="cloudinary-upload__config-warn">
          {configError || 'Cloudinary 환경 변수가 설정되지 않았습니다.'}
          <br />
          필수: <code>{CLOUDINARY_ENV_KEYS.cloudName}</code>,{' '}
          <code>{CLOUDINARY_ENV_KEYS.uploadPreset}</code> (Unsigned 권장)
          <br />
          Signed preset 사용 시: <code>{CLOUDINARY_ENV_KEYS.apiKey}</code> (Dashboard API Key)
          <br />
          선택: <code>{CLOUDINARY_ENV_KEYS.folder}</code> (기본값: products)
        </p>
      )}
    </div>
  )
}
