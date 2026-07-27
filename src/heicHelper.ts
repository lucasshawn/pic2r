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

export async function convertHeicToJpeg(file: File): Promise<File> {
  if (!isHeicFile(file)) return file

  // In Node/JSDOM environment or without Web Worker:
  if (typeof window === 'undefined' || typeof Worker === 'undefined') {
    const newFileName = file.name.replace(/\.(heic|heif)$/i, '.jpg')
    return new File([file], newFileName, { type: 'image/jpeg' })
  }

  try {
    const heic2anyModule = await import('heic2any')
    const heic2any = heic2anyModule.default || heic2anyModule

    const conversionPromise = heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9,
    })

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('HEIC conversion timeout')), 6000)
    )

    const convertedResult = await Promise.race([conversionPromise, timeoutPromise])
    const blob = Array.isArray(convertedResult) ? convertedResult[0] : convertedResult
    const newFileName = file.name.replace(/\.(heic|heif)$/i, '.jpg')
    return new File([blob], newFileName, { type: 'image/jpeg' })
  } catch (error) {
    console.warn('HEIC conversion skipped or failed, using original file:', error)
    return file
  }
}
