/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string | undefined
  /** Cloudinary 계정 cloud name (Upload Widget 필수) */
  readonly VITE_CLOUDINARY_CLOUD_NAME: string | undefined
  /** Upload preset 이름 (Upload Widget 필수, Unsigned 권장) */
  readonly VITE_CLOUDINARY_UPLOAD_PRESET: string | undefined
  /** API Key — Signed preset 또는 unknown api key 오류 시 (API Secret 아님) */
  readonly VITE_CLOUDINARY_API_KEY: string | undefined
  /** 업로드 폴더 (선택, 기본 products) */
  readonly VITE_CLOUDINARY_FOLDER: string | undefined
  /** PortOne V2 Store ID (store-...) */
  readonly VITE_PORTONE_STORE_ID: string | undefined
  /** PortOne V2 채널 키 (channel-key-...) */
  readonly VITE_PORTONE_CHANNEL_KEY: string | undefined
  /** 모바일 결제 완료 리디렉션 URL (미설정 시 /checkout/complete) */
  readonly VITE_PORTONE_REDIRECT_URL: string | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
