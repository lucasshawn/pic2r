import 'fake-indexeddb/auto'
import { createAlbum, createPhotoSet, listPhotoSets } from './catalogRepository'

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
