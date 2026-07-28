import { validateAlbumName, validatePhotoSet } from './validation'

test('rejects an empty album name', () => {
  expect(validateAlbumName('   ')).toBe('Enter an album name.')
})

test('requires a name and before image', () => {
  expect(validatePhotoSet({ name: '', before: null, after: null })).toEqual({
    name: 'Enter a name for this set.',
    before: 'Choose a before image.',
  })
})

test('succeeds with name and before photo only', () => {
  const file = new File(['dummy'], 'before.png', { type: 'image/png' })
  expect(validatePhotoSet({ name: 'Single Photo Set', before: file })).toEqual({})
  expect(validatePhotoSet({ name: 'Single Photo Set', before: 'https://example.com/photo.jpg' })).toEqual({})
})

