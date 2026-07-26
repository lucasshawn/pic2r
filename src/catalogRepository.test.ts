import { describe, expect, test, vi, beforeEach } from 'vitest'
import {
  createAlbum,
  createPhotoSet,
  deletePhotoSet,
  listAlbums,
  listPhotoSets,
  updatePhotoSet,
} from './catalogRepository'

describe('catalogRepository with API', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  test('creates album and fetches list from API', async () => {
    const album = await createAlbum('Renovation')
    expect(album.name).toBe('Renovation')
    expect(album.id).toBeDefined()

    const albums = await listAlbums()
    expect(albums.some((a) => a.id === album.id)).toBe(true)
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
  })
})

