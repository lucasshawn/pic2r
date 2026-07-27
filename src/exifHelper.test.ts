import { describe, it, expect, vi, beforeEach } from 'vitest'
import exifr from 'exifr'
import { getPhotoCreationDate } from './exifHelper'

vi.mock('exifr', () => ({
  default: {
    parse: vi.fn(),
  },
}))

describe('getPhotoCreationDate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null if file is null or undefined', async () => {
    expect(await getPhotoCreationDate(null)).toBeNull()
  })

  it('returns timestamp when DateTimeOriginal is a Date object', async () => {
    const mockDate = new Date('2023-06-15T12:00:00.000Z')
    vi.mocked(exifr.parse).mockResolvedValueOnce({ DateTimeOriginal: mockDate })

    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' })
    const result = await getPhotoCreationDate(file)

    expect(exifr.parse).toHaveBeenCalledWith(file, ['DateTimeOriginal', 'CreateDate'])
    expect(result).toBe(mockDate.getTime())
  })

  it('falls back to CreateDate when DateTimeOriginal is missing', async () => {
    const mockDate = new Date('2022-01-01T08:30:00.000Z')
    vi.mocked(exifr.parse).mockResolvedValueOnce({ CreateDate: mockDate })

    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' })
    const result = await getPhotoCreationDate(file)

    expect(result).toBe(mockDate.getTime())
  })

  it('parses valid date string format correctly', async () => {
    vi.mocked(exifr.parse).mockResolvedValueOnce({ DateTimeOriginal: '2023-08-20T15:45:00.000Z' })

    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' })
    const result = await getPhotoCreationDate(file)

    expect(result).toBe(new Date('2023-08-20T15:45:00.000Z').getTime())
  })

  it('returns null if exifr returns null or no valid date', async () => {
    vi.mocked(exifr.parse).mockResolvedValueOnce(null)
    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' })
    expect(await getPhotoCreationDate(file)).toBeNull()

    vi.mocked(exifr.parse).mockResolvedValueOnce({})
    expect(await getPhotoCreationDate(file)).toBeNull()

    vi.mocked(exifr.parse).mockResolvedValueOnce({ DateTimeOriginal: 'invalid-date-string' })
    expect(await getPhotoCreationDate(file)).toBeNull()
  })

  it('handles parsing errors gracefully and returns null', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.mocked(exifr.parse).mockRejectedValueOnce(new Error('Corrupt EXIF header'))

    const file = new File(['dummy content'], 'corrupt.jpg', { type: 'image/jpeg' })
    const result = await getPhotoCreationDate(file)

    expect(result).toBeNull()
    expect(consoleSpy).toHaveBeenCalledWith('Failed to parse EXIF metadata:', expect.any(Error))
    consoleSpy.mockRestore()
  })
})
