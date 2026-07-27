import { describe, expect, test, vi, beforeEach } from 'vitest'
import {
  createAlbum,
  createPhotoSet,
  deletePhotoSet,
  listAlbums,
  listPhotoSets,
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
})

