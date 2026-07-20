import 'fake-indexeddb/auto'
import {
  createAlbum,
  createPhotoSet,
  deletePhotoSet,
  listPhotoSets,
  updatePhotoSet,
} from './catalogRepository'

test('persists a photo pair under its album', async () => {
  const album = await createAlbum('Renovation')

  await createPhotoSet(
    album.id,
    'Living Room 1',
    new Blob(['before'], { type: 'image/png' }),
    new Blob(['after'], { type: 'image/png' }),
  )

  expect((await listPhotoSets(album.id)).map(({ name }) => name)).toEqual([
    'Living Room 1',
  ])
})

test('updates a name while retaining the saved before image', async () => {
  const album = await createAlbum('Renovation')
  const before = new Blob(['before'], { type: 'image/png' })
  const after = new Blob(['after'], { type: 'image/png' })
  const original = await createPhotoSet(album.id, 'Old name', before, after)

  const updated = await updatePhotoSet({ ...original, name: 'New name' })

  expect(updated.before).toBe(before)
  expect((await listPhotoSets(album.id))[0].name).toBe('New name')
})

test('removes only the selected photo set', async () => {
  const album = await createAlbum('Renovation')
  const before = new Blob(['before'], { type: 'image/png' })
  const after = new Blob(['after'], { type: 'image/png' })
  const first = await createPhotoSet(album.id, 'First', before, after)
  await createPhotoSet(album.id, 'Second', before, after)

  await deletePhotoSet(first.id)

  expect((await listPhotoSets(album.id)).map((set) => set.name)).toEqual(['Second'])
})
