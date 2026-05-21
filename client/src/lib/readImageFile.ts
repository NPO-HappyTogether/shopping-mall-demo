const MAX_BYTES = 400_000
const ALLOWED = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/bmp', 'image/webp']

export async function readImageFileAsDataUrl(file: File): Promise<string> {
  if (!ALLOWED.includes(file.type)) {
    throw new Error('PNG, GIF, JPG/JPEG, BMP, WEBP 형식만 업로드할 수 있습니다.')
  }
  if (file.size > MAX_BYTES) {
    throw new Error('이미지는 400KB 이하만 업로드할 수 있습니다. URL을 직접 입력해 주세요.')
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('이미지를 읽지 못했습니다.'))
    }
    reader.onerror = () => reject(new Error('이미지를 읽지 못했습니다.'))
    reader.readAsDataURL(file)
  })
}
