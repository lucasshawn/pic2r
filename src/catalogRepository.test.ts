import { describe, expect, test, vi, beforeEach } from 'vitest'
import {
  createAlbum,
  createPhotoSet,
  deleteAlbum,
  deletePhotoSet,
  listAlbums,
  listPhotoSets,
  movePhotoSet,
  reorderPhotoSets,
  updatePhotoSet,
} from './catalogRepository'
import { getPhotoCreationDate } from './exifHelper'

vi.mock('./exifHelper', () => ({
  getPhotoCreationDate: vi.fn(),
}))

describe('catalogRepository with API', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  test('creates album and fetches list from API', async () => {
    const album = await createAlbum('Renovation', 'House renovation')
    expect(album.name).toBe('Renovation')
    expect(album.description).toBe('House renovation')
    expect(album.id).toBeDefined()

    const albums = await listAlbums()
    expect(albums.some((a) => a.id === album.id && a.description === 'House renovation')).toBe(true)
  })

  test('creates photo set using upload URLs and API save', async () => {
    const album = await createAlbum('Kitchen')
    const beforeBlob = new Blob(['before image'], { type: 'image/png' })
    const afterBlob = new Blob(['after image'], { type: 'image/png' })

    const photoSet = await createPhotoSet(album.id, 'Countertop', beforeBlob, afterBlob)
    expect(photoSet.name).toBe('Countertop')

    const photoSets = await listPhotoSets(album.id)
    expect(photoSets.some((ps) => ps.id === photoSet.id)).toBe(true)
  })

  test('creates photo set with description and takenAt', async () => {
    const album = await createAlbum('Patio')
    const beforeBlob = new Blob(['before'], { type: 'image/jpeg' })
    const afterBlob = new Blob(['after'], { type: 'image/jpeg' })
    const takenAt = 1700000000000

    const photoSet = await createPhotoSet(
      album.id,
      'Pavers',
      beforeBlob,
      afterBlob,
      'Patio renovation work',
      takenAt,
    )
    expect(photoSet.description).toBe('Patio renovation work')
    expect(photoSet.takenAt).toBe(takenAt)

    const photoSets = await listPhotoSets(album.id)
    const found = photoSets.find((ps) => ps.id === photoSet.id)
    expect(found?.description).toBe('Patio renovation work')
    expect(found?.takenAt).toBe(takenAt)
  })

  test('updates photo set via API', async () => {
    const album = await createAlbum('Living Room')
    const beforeBlob = new Blob(['before'], { type: 'image/png' })
    const afterBlob = new Blob(['after'], { type: 'image/png' })

    const photoSet = await createPhotoSet(album.id, 'Sofa', beforeBlob, afterBlob)
    const updated = await updatePhotoSet({ ...photoSet, name: 'Sofa Updated' })
    expect(updated.name).toBe('Sofa Updated')

    const photoSets = await listPhotoSets(album.id)
    expect(photoSets.find((ps) => ps.id === photoSet.id)?.name).toBe('Sofa Updated')
  })

  test('updates photo set description and takenAt', async () => {
    const album = await createAlbum('Garage')
    const beforeBlob = new Blob(['before'], { type: 'image/jpeg' })
    const afterBlob = new Blob(['after'], { type: 'image/jpeg' })

    const photoSet = await createPhotoSet(album.id, 'Door', beforeBlob, afterBlob)
    const updated = await updatePhotoSet({
      ...photoSet,
      description: 'New garage door installed',
      takenAt: 1710000000000,
    })
    expect(updated.description).toBe('New garage door installed')
    expect(updated.takenAt).toBe(1710000000000)

    const photoSets = await listPhotoSets(album.id)
    const found = photoSets.find((ps) => ps.id === photoSet.id)
    expect(found?.description).toBe('New garage door installed')
    expect(found?.takenAt).toBe(1710000000000)
  })

  test('detects EXIF takenAt date when omitted in createPhotoSet', async () => {
    vi.mocked(getPhotoCreationDate).mockImplementation(async (file) => {
      if (file && (file as File).name === 'exif.jpg') return 1600000000000
      return null
    })
    const album = await createAlbum('Garden')
    const beforeFile = new File(['before'], 'exif.jpg', { type: 'image/jpeg' })
    const afterFile = new File(['after'], 'after.jpg', { type: 'image/jpeg' })

    const photoSet = await createPhotoSet(album.id, 'Flowers', beforeFile, afterFile, 'Garden flowers')
    expect(photoSet.description).toBe('Garden flowers')
    expect(photoSet.takenAt).toBe(1600000000000)
  })

  test('deletes photo set via API', async () => {
    const album = await createAlbum('Bathroom')
    const beforeBlob = new Blob(['before'], { type: 'image/png' })
    const afterBlob = new Blob(['after'], { type: 'image/png' })

    const photoSet = await createPhotoSet(album.id, 'Tile', beforeBlob, afterBlob)
    await deletePhotoSet(photoSet.id, album.id)

    const photoSets = await listPhotoSets(album.id)
    expect(photoSets.some((ps) => ps.id === photoSet.id)).toBe(false)
  })

  test('calls remote API endpoints when fetch succeeds', async () => {
    const globalFetch = vi.fn().mockImplementation(async (url: string, options?: RequestInit) => {
      if (url === '/api/albums' && !options?.method) {
        return {
          ok: true,
          json: async () => [{ id: 'album-1', name: 'API Album', createdAt: 1000 }],
        }
      }
      if (url === '/api/albums' && options?.method === 'POST') {
        const body = JSON.parse(options.body as string)
        return {
          ok: true,
          json: async () => ({ id: 'album-2', name: body.name, createdAt: 2000 }),
        }
      }
      if (url === '/api/albums/album-1/photos') {
        return {
          ok: true,
          json: async () => [
            {
              id: 'ps-1',
              albumId: 'album-1',
              name: 'API PhotoSet',
              description: 'API Desc',
              takenAt: 1650000000000,
              beforeUrl: '/api/image/b1',
              afterUrl: '/api/image/a1',
              createdAt: 1000,
            },
          ],
        }
      }
      return { ok: false }
    })
    vi.stubGlobal('fetch', globalFetch)

    const albums = await listAlbums()
    expect(albums).toEqual([{ id: 'album-1', name: 'API Album', createdAt: 1000 }])

    const newAlbum = await createAlbum('Created via API')
    expect(newAlbum.name).toBe('Created via API')
    expect(newAlbum.id).toBe('album-2')

    const photoSets = await listPhotoSets('album-1')
    expect(photoSets.length).toBe(1)
    expect(photoSets[0].beforeUrl).toBe('/api/image/b1')
    expect(photoSets[0].afterUrl).toBe('/api/image/a1')
    expect(photoSets[0].before).toBe('/api/image/b1')
    expect(photoSets[0].after).toBe('/api/image/a1')
    expect(photoSets[0].description).toBe('API Desc')
    expect(photoSets[0].takenAt).toBe(1650000000000)
  })

  test('deletes album via deleteAlbum', async () => {
    const album = await createAlbum('Album To Delete')
    const albumsBefore = await listAlbums()
    expect(albumsBefore.some((a) => a.id === album.id)).toBe(true)

    await deleteAlbum(album.id)
    const albumsAfter = await listAlbums()
    expect(albumsAfter.some((a) => a.id === album.id)).toBe(false)
  })

  test('calls remote API DELETE endpoint for album', async () => {
    const deletedIds: string[] = []
    const globalFetch = vi.fn().mockImplementation(async (url: string, options?: RequestInit) => {
      if (url.startsWith('/api/albums/') && options?.method === 'DELETE') {
        const id = url.replace('/api/albums/', '')
        deletedIds.push(id)
        return {
          ok: true,
          json: async () => ({ success: true }),
        }
      }
      return { ok: false }
    })
    vi.stubGlobal('fetch', globalFetch)

    await deleteAlbum('alb-123')
    expect(deletedIds).toContain('alb-123')
  })

  test('reorders photo sets in repository', async () => {
    const album = await createAlbum('Reorder Album')
    const b = new Blob(['b'], { type: 'image/png' })
    const a = new Blob(['a'], { type: 'image/png' })

    const ps1 = await createPhotoSet(album.id, 'Set 1', b, a)
    const ps2 = await createPhotoSet(album.id, 'Set 2', b, a)
    const ps3 = await createPhotoSet(album.id, 'Set 3', b, a)

    const reordered = await reorderPhotoSets(album.id, [ps3.id, ps1.id, ps2.id])
    expect(reordered.map((s) => s.id)).toEqual([ps3.id, ps1.id, ps2.id])

    const photoSets = await listPhotoSets(album.id)
    expect(photoSets.map((s) => s.id)).toEqual([ps3.id, ps1.id, ps2.id])
  })

  test('moves photo set between albums in repository', async () => {
    const album1 = await createAlbum('Source Album')
    const album2 = await createAlbum('Target Album')
    const b = new Blob(['b'], { type: 'image/png' })
    const a = new Blob(['a'], { type: 'image/png' })

    const ps1 = await createPhotoSet(album1.id, 'Move Set', b, a)

    await movePhotoSet(ps1.id, album1.id, album2.id)

    const sets1 = await listPhotoSets(album1.id)
    expect(sets1.some((s) => s.id === ps1.id)).toBe(false)

    const sets2 = await listPhotoSets(album2.id)
    const moved = sets2.find((s) => s.id === ps1.id)
    expect(moved).toBeDefined()
    expect(moved?.albumId).toBe(album2.id)
  })

  test('calls remote API endpoints for reorderPhotoSets and movePhotoSet', async () => {
    const requests: { url: string; method?: string; body?: any }[] = []
    const globalFetch = vi.fn().mockImplementation(async (url: string, options?: RequestInit) => {
      requests.push({ url, method: options?.method, body: options?.body ? JSON.parse(options.body as string) : undefined })
      if (url.endsWith('/reorder')) {
        return {
          ok: true,
          json: async () => [
            { id: 'ps-2', albumId: 'alb-1', name: 'Set 2' },
            { id: 'ps-1', albumId: 'alb-1', name: 'Set 1' },
          ],
        }
      }
      if (url.endsWith('/move')) {
        return {
          ok: true,
          json: async () => ({ success: true }),
        }
      }
      return { ok: false }
    })
    vi.stubGlobal('fetch', globalFetch)

    const reordered = await reorderPhotoSets('alb-1', ['ps-2', 'ps-1'])
    expect(reordered.length).toBe(2)
    expect(requests).toContainEqual({
      url: '/api/albums/alb-1/photos/reorder',
      method: 'PUT',
      body: { photoSetIds: ['ps-2', 'ps-1'] },
    })

    await movePhotoSet('ps-1', 'alb-1', 'alb-2')
    expect(requests).toContainEqual({
      url: '/api/albums/alb-1/photos/ps-1/move',
      method: 'PUT',
      body: { targetAlbumId: 'alb-2' },
    })
  })
})

