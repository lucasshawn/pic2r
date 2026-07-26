import { describe, expect, test, vi, beforeEach } from 'vitest'
import {
  getR2Client,
  getPublicUrl,
  getR2Json,
  putR2Json,
  deleteR2Objects,
  generatePresignedPutUrl,
  getBucketName,
  getPublicDomain,
} from '../../netlify/functions/r2Client'
import { sendMock } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

vi.mock('@aws-sdk/client-s3', () => {
  const sendMock = vi.fn()
  return {
    S3Client: vi.fn().mockImplementation(() => ({
      send: sendMock,
    })),
    GetObjectCommand: vi.fn().mockImplementation((args) => ({ type: 'GetObject', ...args })),
    PutObjectCommand: vi.fn().mockImplementation((args) => ({ type: 'PutObject', ...args })),
    DeleteObjectCommand: vi.fn().mockImplementation((args) => ({ type: 'DeleteObject', ...args })),
    sendMock,
  }
})

vi.mock('@aws-sdk/s3-request-presigner', () => {
  return {
    getSignedUrl: vi.fn().mockResolvedValue('https://presigned-url.com/upload'),
  }
})

describe('r2Client helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.R2_ACCOUNT_ID = 'test-account'
    process.env.R2_ACCESS_KEY_ID = 'test-key'
    process.env.R2_SECRET_ACCESS_KEY = 'test-secret'
    process.env.R2_BUCKET_NAME = 'test-bucket'
    process.env.R2_PUBLIC_DOMAIN = 'https://pub-test.r2.dev'
  })

  test('constructs public URLs correctly', () => {
    expect(getPublicUrl('catalog/albums.json')).toBe('https://pub-test.r2.dev/catalog/albums.json')
    expect(getPublicUrl('albums/123.json')).toBe('https://pub-test.r2.dev/albums/123.json')
    expect(getPublicUrl('/albums/123.json')).toBe('https://pub-test.r2.dev/albums/123.json')
  })

  test('fallback domain and path when env vars not set', () => {
    delete process.env.R2_PUBLIC_DOMAIN
    delete process.env.R2_BUCKET_NAME
    expect(getPublicDomain()).toBe('')
    expect(getBucketName()).toBe('picture-catalog')
    expect(getPublicUrl('albums/123.json')).toBe('/albums/123.json')
  })

  test('getR2Json returns parsed object on success', async () => {
    const mockData = { id: '123', name: 'Test Album' }
    sendMock.mockResolvedValueOnce({
      Body: {
        transformToString: vi.fn().mockResolvedValue(JSON.stringify(mockData)),
      },
    })

    const result = await getR2Json<{ id: string; name: string }>('albums/123.json')
    expect(result).toEqual(mockData)
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'GetObject',
        Bucket: 'test-bucket',
        Key: 'albums/123.json',
      })
    )
  })

  test('getR2Json returns null when object is not found (NoSuchKey or 404)', async () => {
    sendMock.mockRejectedValueOnce({ name: 'NoSuchKey' })
    const result1 = await getR2Json('missing.json')
    expect(result1).toBeNull()

    sendMock.mockRejectedValueOnce({ $metadata: { httpStatusCode: 404 } })
    const result2 = await getR2Json('missing.json')
    expect(result2).toBeNull()
  })

  test('getR2Json throws on other errors', async () => {
    sendMock.mockRejectedValueOnce(new Error('Network error'))
    await expect(getR2Json('error.json')).rejects.toThrow('Network error')
  })

  test('putR2Json sends PutObjectCommand with stringified data', async () => {
    sendMock.mockResolvedValueOnce({})
    const data = { foo: 'bar' }

    await putR2Json('data.json', data)

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'PutObject',
        Bucket: 'test-bucket',
        Key: 'data.json',
        Body: JSON.stringify(data, null, 2),
        ContentType: 'application/json',
      })
    )
  })

  test('deleteR2Objects sends DeleteObjectCommand for each non-empty key', async () => {
    sendMock.mockResolvedValue({})

    await deleteR2Objects(['key1.png', '', 'key2.png'])

    expect(sendMock).toHaveBeenCalledTimes(2)
    expect(sendMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ type: 'DeleteObject', Bucket: 'test-bucket', Key: 'key1.png' })
    )
    expect(sendMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ type: 'DeleteObject', Bucket: 'test-bucket', Key: 'key2.png' })
    )
  })

  test('generatePresignedPutUrl generates signed URL', async () => {
    const url = await generatePresignedPutUrl('uploads/img.jpg', 'image/jpeg')

    expect(url).toBe('https://presigned-url.com/upload')
    expect(getSignedUrl).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: 'PutObject',
        Bucket: 'test-bucket',
        Key: 'uploads/img.jpg',
        ContentType: 'image/jpeg',
      }),
      { expiresIn: 3600 }
    )
  })
})
