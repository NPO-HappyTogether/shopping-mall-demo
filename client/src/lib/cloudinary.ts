import type { CloudinaryUploadWidgetOptions } from '@/types/cloudinary'

const SCRIPT_URL = 'https://upload-widget.cloudinary.com/global/all.js'

const PLACEHOLDER_VALUES = new Set([
  'your_cloud_name',
  'your_unsigned_preset',
  'your_upload_preset',
  'your_api_key',
])

/** 클라이언트(Upload Widget)에 필요한 Vite 환경 변수 키 */
export const CLOUDINARY_ENV_KEYS = {
  cloudName: 'VITE_CLOUDINARY_CLOUD_NAME',
  uploadPreset: 'VITE_CLOUDINARY_UPLOAD_PRESET',
  apiKey: 'VITE_CLOUDINARY_API_KEY',
  folder: 'VITE_CLOUDINARY_FOLDER',
} as const

let scriptPromise: Promise<void> | null = null

function readEnv(key: string): string {
  const value = import.meta.env[key as keyof ImportMetaEnv]
  return typeof value === 'string' ? value.trim() : ''
}

function isPlaceholder(value: string): boolean {
  return !value || PLACEHOLDER_VALUES.has(value.toLowerCase())
}

export function getCloudinaryCloudName(): string {
  return readEnv(CLOUDINARY_ENV_KEYS.cloudName)
}

export function getCloudinaryUploadPreset(): string {
  return readEnv(CLOUDINARY_ENV_KEYS.uploadPreset)
}

/** Dashboard → API Keys → API Key (숫자). API Secret 아님. Signed preset 시 필요 */
export function getCloudinaryApiKey(): string {
  return readEnv(CLOUDINARY_ENV_KEYS.apiKey)
}

/** 업로드 폴더 (미설정 시 `products`) */
export function getCloudinaryFolder(): string {
  return readEnv(CLOUDINARY_ENV_KEYS.folder) || 'products'
}

export function getMissingCloudinaryEnvVars(): string[] {
  const missing: string[] = []
  if (!getCloudinaryCloudName()) missing.push(CLOUDINARY_ENV_KEYS.cloudName)
  if (!getCloudinaryUploadPreset()) missing.push(CLOUDINARY_ENV_KEYS.uploadPreset)
  return missing
}

export function isCloudinaryConfigured(): boolean {
  return (
    getMissingCloudinaryEnvVars().length === 0 &&
    !isPlaceholder(getCloudinaryCloudName()) &&
    !isPlaceholder(getCloudinaryUploadPreset())
  )
}

export function getCloudinaryConfigErrorMessage(): string {
  const missing = getMissingCloudinaryEnvVars()
  if (missing.length > 0) {
    return `client/.env에 다음 값을 설정해 주세요: ${missing.join(', ')}`
  }
  if (isPlaceholder(getCloudinaryCloudName()) || isPlaceholder(getCloudinaryUploadPreset())) {
    return 'client/.env의 Cloud name·Upload preset이 아직 예시 값입니다. Cloudinary 대시보드의 실제 값으로 바꿔 주세요.'
  }
  return ''
}

/** Upload Widget `createUploadWidget` 옵션 — 환경 변수 기반 */
export function getCloudinaryWidgetOptions(
  folder?: string,
): CloudinaryUploadWidgetOptions {
  const options: CloudinaryUploadWidgetOptions = {
    cloudName: getCloudinaryCloudName(),
    uploadPreset: getCloudinaryUploadPreset(),
    folder: folder ?? getCloudinaryFolder(),
    sources: ['local', 'url', 'camera'],
    multiple: false,
    maxFiles: 1,
    clientAllowedFormats: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'],
    maxFileSize: 5_000_000,
    cropping: true,
    croppingAspectRatio: 1,
    language: 'ko',
    text: {
      ko: {
        local: {
          browse: '파일 선택',
          dd_title_single: '이미지를 여기에 드래그하세요',
        },
        queue: {
          title: '업로드 대기',
          title_uploading_with_counter: '{{num}}개 업로드 중',
          upload_more: '더 업로드',
          done: '완료',
        },
      },
    },
  }

  const apiKey = getCloudinaryApiKey()
  if (apiKey && !isPlaceholder(apiKey)) {
    options.apiKey = apiKey
  }

  return options
}

export function loadCloudinaryWidgetScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('브라우저 환경에서만 사용할 수 있습니다.'))
  }
  if (window.cloudinary?.createUploadWidget) {
    return Promise.resolve()
  }
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_URL}"]`,
    )
    if (existing) {
      if (window.cloudinary?.createUploadWidget) {
        resolve()
        return
      }
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () =>
        reject(new Error('Cloudinary 위젯 스크립트를 불러오지 못했습니다.')),
      )
      return
    }

    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.onload = () => resolve()
    script.onerror = () =>
      reject(new Error('Cloudinary 위젯 스크립트를 불러오지 못했습니다.'))
    document.body.appendChild(script)
  })

  return scriptPromise
}
