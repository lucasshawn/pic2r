import { describe, expect, test, vi, beforeEach } from 'vitest'
import { handler } from '../../netlify/functions/api'
import * as r2 from '../../netlify/functions/r2Client'

vi.mock('../../netlify/functions/r2Client', () => ({
  getR2Json: vi.fn(),
  putR2Json: vi.fn(),
  deleteR2Objects: vi.fn(),
  generatePresignedPutUrl: vi.fn().mockImplementation(async (key: string) => `https://signed-upload.com/${key}`),
  getPublicUrl: vi.fn().mockImplementation((key: string) => `https://pub-test.r2.dev/${key}`),
}))

describe('Netlify API Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('CORS / OPTIONS', () => {
    test('OPTIONS request returns 200 with CORS headers', async () => {
      const response = await handler(
        {
          httpMethod: 'OPTIONS',
          path: '/api/albums',
          headers: {},
          queryStringParameters: null,
          body: null,
        } as any,
        {} as any
      )

      expect(response.statusCode).toBe(200)
      expect(response.headers?.['Access-Control-Allow-Origin']).toBe('*')
      expect(response.headers?.['Access-Control-Allow-Methods']).toBe('GET, POST, PUT, DELETE, OPTIONS')
    })
  })

  describe('Albums Endpoints', () => {
    test('GET /api/albums returns empty array when catalog/albums.json is missing', async () => {
      vi.mocked(r2.getR2Json).mockResolvedValueOnce(null)

      const response = await handler(
        {
          httpMethod: 'GET',
          path: '/api/albums',
          headers: {},
          queryStringParameters: null,
          body: null,
        } as any,
        {} as any
      )

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toEqual([])
      expect(r2.getR2Json).toHaveBeenCalledWith('catalog/albums.json')
    })

    test('GET /api/albums returns albums sorted by createdAt', async () => {
      const albums = [
        { id: '2', name: 'Album 2', createdAt: 2000 },
        { id: '1', name: 'Album 1', createdAt: 1000 },
      ]
      vi.mocked(r2.getR2Json).mockResolvedValueOnce(albums)

      const response = await handler(
        {
          httpMethod: 'GET',
          path: '/api/albums',
          headers: {},
          queryStringParameters: null,
          body: null,
        } as any,
        {} as any
      )

      expect(response.statusCode).toBe(200)
      const data = JSON.parse(response.body)
      expect(data).toEqual([
        { id: '1', name: 'Album 1', createdAt: 1000 },
        { id: '2', name: 'Album 2', createdAt: 2000 },
      ])
    })

    test('POST /api/albums creates new album and writes catalog/albums.json', async () => {
      vi.mocked(r2.getR2Json).mockResolvedValueOnce([])
      vi.mocked(r2.putR2Json).mockResolvedValueOnce(undefined)

      const response = await handler(
        {
          httpMethod: 'POST',
          path: '/api/albums',
          headers: { 'content-type': 'application/json' },
          queryStringParameters: null,
          body: JSON.stringify({ name: 'Kitchen Remodel' }),
        } as any,
        {} as any
      )

      expect(response.statusCode).toBe(201)
      const album = JSON.parse(response.body)
      expect(album.name).toBe('Kitchen Remodel')
      expect(album.id).toBeDefined()
      expect(album.createdAt).toBeDefined()
      expect(r2.putR2Json).toHaveBeenCalledWith('catalog/albums.json', [album])
    })

    test('POST /api/albums returns 400 when album name is missing or empty', async () => {
      const response = await handler(
        {
          httpMethod: 'POST',
          path: '/api/albums',
          headers: { 'content-type': 'application/json' },
          queryStringParameters: null,
          body: JSON.stringify({ name: '   ' }),
        } as any,
        {} as any
      )

      expect(response.statusCode).toBe(400)
      expect(JSON.parse(response.body)).toEqual({ error: 'Album name is required' })
    })

    test('handles path with /.netlify/functions/api prefix', async () => {
      vi.mocked(r2.getR2Json).mockResolvedValueOnce([])

      const response = await handler(
        {
          httpMethod: 'GET',
          path: '/.netlify/functions/api/albums',
          headers: {},
          queryStringParameters: null,
          body: null,
        } as any,
        {} as any
      )

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toEqual([])
    })
  })

  describe('Upload URLs Endpoint', () => {
    test('POST /api/albums/:id/photos/upload-urls generates presigned URLs for before and after files', async () => {
      const response = await handler(
        {
          httpMethod: 'POST',
          path: '/api/albums/alb-1/photos/upload-urls',
          headers: { 'content-type': 'application/json' },
          queryStringParameters: null,
          body: JSON.stringify({ beforeFileName: 'before.png', afterFileName: 'after.png' }),
        } as any,
        {} as any
      )

      expect(response.statusCode).toBe(200)
      const data = JSON.parse(response.body)
      expect(data.photoSetId).toBeDefined()
      expect(data.beforeKey).toMatch(/^albums\/alb-1\/[^\/]+\/before-\d+-before\.png$/)
      expect(data.afterKey).toMatch(/^albums\/alb-1\/[^\/]+\/after-\d+-after\.png$/)
      expect(data.beforeUploadUrl).toBe(`https://signed-upload.com/${data.beforeKey}`)
      expect(data.afterUploadUrl).toBe(`https://signed-upload.com/${data.afterKey}`)
    })
  })

  describe('Photo Sets Endpoints', () => {
    test('GET /api/albums/:id/photos returns photo sets sorted by createdAt', async () => {
      const photoSets = [
        { id: 'ps-2', albumId: 'alb-1', name: 'Set 2', createdAt: 200 },
        { id: 'ps-1', albumId: 'alb-1', name: 'Set 1', createdAt: 100 },
      ]
      vi.mocked(r2.getR2Json).mockResolvedValueOnce(photoSets)

      const response = await handler(
        {
          httpMethod: 'GET',
          path: '/api/albums/alb-1/photos',
          headers: {},
          queryStringParameters: null,
          body: null,
        } as any,
        {} as any
      )

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toEqual([
        { id: 'ps-1', albumId: 'alb-1', name: 'Set 1', createdAt: 100 },
        { id: 'ps-2', albumId: 'alb-1', name: 'Set 2', createdAt: 200 },
      ])
      expect(r2.getR2Json).toHaveBeenCalledWith('albums/alb-1.json')
    })

    test('POST /api/albums/:id/photos saves new photo set record', async () => {
      vi.mocked(r2.getR2Json).mockResolvedValueOnce([])
      vi.mocked(r2.putR2Json).mockResolvedValueOnce(undefined)

      const photoSetData = {
        name: 'Living Room Before/After',
        beforeUrl: 'https://r2.com/before.jpg',
        afterUrl: 'https://r2.com/after.jpg',
        beforeKey: 'albums/alb-1/ps-1/before.jpg',
        afterKey: 'albums/alb-1/ps-1/after.jpg',
      }

      const response = await handler(
        {
          httpMethod: 'POST',
          path: '/api/albums/alb-1/photos',
          headers: { 'content-type': 'application/json' },
          queryStringParameters: null,
          body: JSON.stringify(photoSetData),
        } as any,
        {} as any
      )

      expect(response.statusCode).toBe(200)
      const record = JSON.parse(response.body)
      expect(record.id).toBeDefined()
      expect(record.albumId).toBe('alb-1')
      expect(record.name).toBe('Living Room Before/After')
      expect(record.beforeUrl).toBe('https://r2.com/before.jpg')
      expect(record.afterUrl).toBe('https://r2.com/after.jpg')
      expect(r2.putR2Json).toHaveBeenCalledWith('albums/alb-1.json', [record])
    })

    test('POST /api/albums/:id/photos updates existing photo set record if id provided', async () => {
      const existing = [
        {
          id: 'ps-1',
          albumId: 'alb-1',
          name: 'Old Name',
          beforeUrl: 'old-b',
          afterUrl: 'old-a',
          createdAt: 100,
        },
      ]
      vi.mocked(r2.getR2Json).mockResolvedValueOnce(existing)
      vi.mocked(r2.putR2Json).mockResolvedValueOnce(undefined)

      const response = await handler(
        {
          httpMethod: 'POST',
          path: '/api/albums/alb-1/photos',
          headers: { 'content-type': 'application/json' },
          queryStringParameters: null,
          body: JSON.stringify({
            id: 'ps-1',
            albumId: 'alb-1',
            name: 'Updated Name',
            beforeUrl: 'new-b',
            afterUrl: 'new-a',
          }),
        } as any,
        {} as any
      )

      expect(response.statusCode).toBe(200)
      const record = JSON.parse(response.body)
      expect(record.id).toBe('ps-1')
      expect(record.name).toBe('Updated Name')
      expect(r2.putR2Json).toHaveBeenCalledWith('albums/alb-1.json', [
        expect.objectContaining({
          id: 'ps-1',
          name: 'Updated Name',
          beforeUrl: 'new-b',
          afterUrl: 'new-a',
        }),
      ])
    })

    test('POST /api/albums/:id/photos returns 400 when missing required fields', async () => {
      const response = await handler(
        {
          httpMethod: 'POST',
          path: '/api/albums/alb-1/photos',
          headers: { 'content-type': 'application/json' },
          queryStringParameters: null,
          body: JSON.stringify({ name: 'Incomplete' }),
        } as any,
        {} as any
      )

      expect(response.statusCode).toBe(400)
      expect(JSON.parse(response.body)).toEqual({ error: 'Missing required photo set fields' })
    })

    test('DELETE /api/albums/:id/photos/:photoSetId deletes photo set and its R2 objects', async () => {
      const existing = [
        {
          id: 'ps-1',
          albumId: 'alb-1',
          name: 'Set 1',
          beforeKey: 'albums/alb-1/ps-1/before.jpg',
          afterKey: 'albums/alb-1/ps-1/after.jpg',
        },
        {
          id: 'ps-2',
          albumId: 'alb-1',
          name: 'Set 2',
        },
      ]
      vi.mocked(r2.getR2Json).mockResolvedValueOnce(existing)
      vi.mocked(r2.deleteR2Objects).mockResolvedValueOnce()
      vi.mocked(r2.putR2Json).mockResolvedValueOnce()

      const response = await handler(
        {
          httpMethod: 'DELETE',
          path: '/api/albums/alb-1/photos/ps-1',
          headers: {},
          queryStringParameters: null,
          body: null,
        } as any,
        {} as any
      )

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toEqual({ success: true })
      expect(r2.deleteR2Objects).toHaveBeenCalledWith(['albums/alb-1/ps-1/before.jpg', 'albums/alb-1/ps-1/after.jpg'])
      expect(r2.putR2Json).toHaveBeenCalledWith('albums/alb-1.json', [existing[1]])
    })
  })

  describe('404 & 500 error handling', () => {
    test('returns 404 for unmatched routes', async () => {
      const response = await handler(
        {
          httpMethod: 'GET',
          path: '/api/unknown',
          headers: {},
          queryStringParameters: null,
          body: null,
        } as any,
        {} as any
      )

      expect(response.statusCode).toBe(404)
      expect(JSON.parse(response.body)).toEqual({ error: 'Not Found' })
    })

    test('returns 500 when handler encounters uncaught error', async () => {
      vi.mocked(r2.getR2Json).mockRejectedValueOnce(new Error('R2 Connection Error'))

      const response = await handler(
        {
          httpMethod: 'GET',
          path: '/api/albums',
          headers: {},
          queryStringParameters: null,
          body: null,
        } as any,
        {} as any
      )

      expect(response.statusCode).toBe(500)
      expect(JSON.parse(response.body)).toEqual({ error: 'R2 Connection Error' })
    })
  })
})
