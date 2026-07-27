import exifr from 'exifr'

export async function getPhotoCreationDate(file: File | Blob | null): Promise<number | null> {
  if (!file) return null

  try {
    const data = await exifr.parse(file, ['DateTimeOriginal', 'CreateDate'])
    if (!data) return null

    const dateVal = data.DateTimeOriginal || data.CreateDate
    if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
      return dateVal.getTime()
    }
    if (typeof dateVal === 'string') {
      const parsed = new Date(dateVal)
      if (!isNaN(parsed.getTime())) return parsed.getTime()
    }
    return null
  } catch (err) {
    console.warn('Failed to parse EXIF metadata:', err)
    return null
  }
}
