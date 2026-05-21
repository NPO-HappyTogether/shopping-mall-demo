import { useCallback, useEffect, useRef } from 'react'
import {
  getCloudinaryConfigErrorMessage,
  getCloudinaryWidgetOptions,
  isCloudinaryConfigured,
  loadCloudinaryWidgetScript,
} from '@/lib/cloudinary'
import type { CloudinaryUploadWidget } from '@/types/cloudinary'

type UseCloudinaryUploadWidgetOptions = {
  onSuccess: (secureUrl: string) => void
  onError?: (message: string) => void
  /** 미지정 시 `VITE_CLOUDINARY_FOLDER` 또는 `products` */
  folder?: string
}

export function useCloudinaryUploadWidget({
  onSuccess,
  onError,
  folder,
}: UseCloudinaryUploadWidgetOptions) {
  const widgetRef = useRef<CloudinaryUploadWidget | null>(null)
  const onSuccessRef = useRef(onSuccess)
  const onErrorRef = useRef(onError)

  onSuccessRef.current = onSuccess
  onErrorRef.current = onError

  useEffect(() => {
    if (!isCloudinaryConfigured()) return

    let cancelled = false

    void loadCloudinaryWidgetScript()
      .then(() => {
        if (cancelled || !window.cloudinary?.createUploadWidget) return

        widgetRef.current = window.cloudinary.createUploadWidget(
          getCloudinaryWidgetOptions(folder),
          (error, result) => {
            if (error) {
              onErrorRef.current?.(error.message ?? '이미지 업로드에 실패했습니다.')
              return
            }
            if (result?.event === 'success') {
              const url = result.info?.secure_url ?? result.info?.url
              if (url) {
                onSuccessRef.current(url)
                widgetRef.current?.close()
              }
            }
          },
        )
      })
      .catch((err) => {
        if (!cancelled) {
          onErrorRef.current?.(
            err instanceof Error ? err.message : 'Cloudinary를 초기화하지 못했습니다.',
          )
        }
      })

    return () => {
      cancelled = true
      widgetRef.current?.destroy()
      widgetRef.current = null
    }
  }, [folder])

  const openWidget = useCallback(() => {
    if (!isCloudinaryConfigured()) {
      onErrorRef.current?.(getCloudinaryConfigErrorMessage())
      return
    }
    if (!widgetRef.current) {
      onErrorRef.current?.('Cloudinary 위젯을 준비하는 중입니다. 잠시 후 다시 시도해 주세요.')
      return
    }
    widgetRef.current.open()
  }, [])

  return {
    openWidget,
    isConfigured: isCloudinaryConfigured(),
    configError: getCloudinaryConfigErrorMessage(),
  }
}
