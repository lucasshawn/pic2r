import type { PhotoSetInput } from './types'
import { isImageFile } from './heicHelper'

export function validateAlbumName(name: string): string | null {
  return name.trim() ? null : 'Enter an album name.'
}

export function validatePhotoSet(input: PhotoSetInput): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!input.name.trim()) errors.name = 'Enter a name for this set.'
  if (!input.before) {
    errors.before = 'Choose a before image.'
  } else if (!isImageFile(input.before)) {
    errors.before = 'Choose an image file.'
  }
  if (!input.after) {
    errors.after = 'Choose an after image.'
  } else if (!isImageFile(input.after)) {
    errors.after = 'Choose an image file.'
  }

  return errors
}
