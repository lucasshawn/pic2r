import { describe, it, expect, vi } from 'vitest'
import { isHeicFile, isImageFile, convertHeicToJpeg } from './heicHelper'

describe('heicHelper', () => {
  it('identifies HEIC files by extension and MIME type', () => {
    const heicByName = new File([''], 'photo.HEIC', { type: '' })
    const heicByMime = new File([''], 'photo.bin', { type: 'image/heic' })
    const heifByName = new File([''], 'photo.heif', { type: '' })
    const jpgFile = new File([''], 'photo.jpg', { type: 'image/jpeg' })

    expect(isHeicFile(heicByName)).toBe(true)
    expect(isHeicFile(heicByMime)).toBe(true)
    expect(isHeicFile(heifByName)).toBe(true)
    expect(isHeicFile(jpgFile)).toBe(false)
    expect(isHeicFile(null)).toBe(false)
  })

  it('validates image files including HEIC and standard formats', () => {
    const pngFile = new File([''], 'photo.png', { type: 'image/png' })
    const heicFile = new File([''], 'photo.heic', { type: '' })
    const pdfFile = new File([''], 'doc.pdf', { type: 'application/pdf' })

    expect(isImageFile(pngFile)).toBe(true)
    expect(isImageFile(heicFile)).toBe(true)
    expect(isImageFile(pdfFile)).toBe(false)
    expect(isImageFile(null)).toBe(false)
  })

  it('returns original file if not HEIC', async () => {
    const jpgFile = new File(['data'], 'photo.jpg', { type: 'image/jpeg' })
    const result = await convertHeicToJpeg(jpgFile)
    expect(result).toBe(jpgFile)
  })
})
