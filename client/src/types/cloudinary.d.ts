export type CloudinaryUploadResult = {
  event: string
  info?: {
    secure_url?: string
    url?: string
    public_id?: string
    width?: number
    height?: number
  }
}

export type CloudinaryUploadWidget = {
  open: (source?: string, options?: Record<string, unknown>) => void
  close: () => void
  destroy: () => void
}

export type CloudinaryUploadWidgetOptions = {
  cloudName: string
  uploadPreset: string
  /** Signed upload preset 사용 시 필요 (Dashboard → API Key) */
  apiKey?: string
  sources?: string[]
  multiple?: boolean
  maxFiles?: number
  clientAllowedFormats?: string[]
  maxFileSize?: number
  cropping?: boolean
  croppingAspectRatio?: number
  folder?: string
  language?: string
  text?: Record<string, unknown>
}

declare global {
  interface Window {
    cloudinary?: {
      createUploadWidget: (
        options: CloudinaryUploadWidgetOptions,
        callback: (error: Error | null, result: CloudinaryUploadResult) => void,
      ) => CloudinaryUploadWidget
    }
  }
}

export {}
