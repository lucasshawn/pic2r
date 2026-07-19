import { validateAlbumName, validatePhotoSet } from './validation'

test('rejects an empty album name', () => {
  expect(validateAlbumName('   ')).toBe('Enter an album name.')
})

test('requires a named before-and-after image pair', () => {
  expect(validatePhotoSet({ name: '', before: null, after: null })).toEqual({
    name: 'Enter a name for this set.',
    before: 'Choose a before image.',
    after: 'Choose an after image.',
  })
})
