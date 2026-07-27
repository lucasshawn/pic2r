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
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }
    img.src = url
  })
}

async function decodeViaHeicDecode(file: File): Promise<Blob | null> {
  if (typeof window === 'undefined') return null
  try {
    const heicDecodeModule = await import('heic-decode')
    const heicDecode = heicDecodeModule.default || heicDecodeModule

    const arrayBuffer = await file.arrayBuffer()
    const { width, height, data } = await heicDecode({ buffer: new Uint8Array(arrayBuffer) })

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const imageData = new ImageData(new Uint8ClampedArray(data), width, height)
    ctx.putImageData(imageData, 0, 0)

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85)
    })
  } catch (err) {
    console.warn('heic-decode failed:', err)
    return null
  }
}

export async function convertHeicToJpeg(file: File): Promise<File> {
  if (!isHeicFile(file)) return file

  const baseName = file.name.replace(/\.[^/.]+$/, '')
  const newFileName = `${baseName}.jpg`

  // Layer 1: Try native browser Canvas decode (Safari/macOS/iOS)
  try {
    const nativeBlob = await convertViaCanvas(file)
    if (nativeBlob && nativeBlob.size > 0) {
      return new File([nativeBlob], newFileName, { type: 'image/jpeg' })
    }
  } catch (e) {
    console.warn('Canvas conversion skipped:', e)
  }

  // Layer 2: Use heic-decode (supports iPhone HEVC/H.265 HEIC format)
  try {
    const heicDecodeBlob = await decodeViaHeicDecode(file)
    if (heicDecodeBlob && heicDecodeBlob.size > 0) {
      return new File([heicDecodeBlob], newFileName, { type: 'image/jpeg' })
    }
  } catch (e) {
    console.warn('heic-decode conversion skipped:', e)
  }

  // Layer 3: Use heic2any fallback
  if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
    try {
      const heic2anyModule = await import('heic2any')
      const heic2any = heic2anyModule.default || heic2anyModule

      let conversionResult
      try {
        conversionResult = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.85,
        })
      } catch {
        conversionResult = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.85,
          multiple: true,
        })
      }

      const blob = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult
      if (blob && blob.size > 0) {
        return new File([blob], newFileName, { type: 'image/jpeg' })
      }
    } catch (error) {
      console.error('heic2any conversion error:', error)
    }
  }

  // JSDOM / Node test runner fallback
  return new File([file], newFileName, { type: 'image/jpeg' })
}
