export function isHeicFile(file: File | null): boolean {
  if (!file) return false
  const name = (file.name || '').toLowerCase()
  return (
    name.endsWith('.heic') ||
    name.endsWith('.heif') ||
    file.type === 'image/heic' ||
    file.type === 'image/heif'
  )
}

export function isImageFile(file: File | null): boolean {
  if (!file) return false
  return file.type.startsWith('image/') || isHeicFile(file)
}

function convertViaCanvas(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
      return resolve(null)
    }
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth || img.width
      canvas.height = img.naturalHeight || img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) return resolve(null)
      ctx.drawImage(img, 0, 0)
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }
    img.src = url
  })
}

export async function convertHeicToJpeg(file: File): Promise<File> {
  if (!isHeicFile(file)) return file

  const baseName = file.name.replace(/\.[^/.]+$/, '')
  const newFileName = `${baseName}.jpg`

  // Layer 1: Try native browser Image + Canvas conversion (Fast & native on Safari/macOS/iOS)
  try {
    const nativeBlob = await convertViaCanvas(file)
    if (nativeBlob && nativeBlob.size > 0) {
      return new File([nativeBlob], newFileName, { type: 'image/jpeg' })
    }
  } catch {
    // Native decode failed, continue to heic2any
  }

  // Layer 2: Use heic2any for Chromium/Firefox/Windows
  if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
    try {
      const heic2anyModule = await import('heic2any')
      const heic2any = heic2anyModule.default || heic2anyModule

      const heicBlob = new Blob([file], { type: 'image/heic' })

      const conversionPromise = heic2any({
        blob: heicBlob,
        toType: 'image/jpeg',
        quality: 0.9,
      })

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('HEIC conversion timeout')), 10000)
      )

      const convertedResult = await Promise.race([conversionPromise, timeoutPromise])
      const blob = Array.isArray(convertedResult) ? convertedResult[0] : convertedResult
      return new File([blob], newFileName, { type: 'image/jpeg' })
    } catch (error) {
      console.error('heic2any conversion error:', error)
    }
  }

  // Fallback: Force .jpg extension and image/jpeg MIME type
  return new File([file], newFileName, { type: 'image/jpeg' })
}
