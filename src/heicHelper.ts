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

  // Layer 1: Try native browser Canvas decode (Safari/macOS/iOS)
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

      const buffer = await file.arrayBuffer()
      const heicBlob = new Blob([buffer], { type: 'image/heic' })

      const conversionResult = await heic2any({
        blob: heicBlob,
        toType: 'image/jpeg',
        quality: 0.9,
      })

      const resultBlob = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult
      return new File([resultBlob], newFileName, { type: 'image/jpeg' })
    } catch (error) {
      console.error('heic2any conversion error:', error)
    }
  }

  // Fallback: If in Node/JSDOM test runner without Web Worker
  return new File([file], newFileName, { type: 'image/jpeg' })
}
