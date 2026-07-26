import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from './App'
import { createAlbum, resetMemoryCatalog } from './catalogRepository'
import { PhotoSetForm } from './components/PhotoSetForm'

beforeEach(() => {
  window.location.hash = ''
  resetMemoryCatalog()
  localStorage.clear()
  import.meta.env.VITE_ADMIN_EMAILS = 'admin@example.com'
  localStorage.setItem(
    'pic2r_auth_user',
    JSON.stringify({ email: 'admin@example.com', name: 'Dev Admin', isAdmin: true })
  )
})

test('renders the picture catalog heading', async () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: /picture catalog/i })).toBeInTheDocument()
  expect(await screen.findByText(/no albums yet/i)).toBeInTheDocument()
})

test('creates an album and links to it', async () => {
  const user = userEvent.setup()
  render(<App />)

  await screen.findByText(/no albums yet/i)
  await user.click(screen.getByRole('button', { name: /create album/i }))
  await user.type(screen.getByLabelText(/album name/i), 'Kitchen remodel')
  await user.click(screen.getByRole('button', { name: /^save album$/i }))

  expect(await screen.findByRole('link', { name: /kitchen remodel/i })).toHaveAttribute(
    'href',
    expect.stringMatching(/^#\/albums\//),
  )
})

test('opens the created album when its card is selected', async () => {
  const user = userEvent.setup()
  render(<App />)

  await screen.findByText(/no albums yet/i)
  await user.click(screen.getByRole('button', { name: /create album/i }))
  await user.type(screen.getByLabelText(/album name/i), 'Test')
  await user.click(screen.getByRole('button', { name: /^save album$/i }))
  await user.click(await screen.findByRole('link', { name: /test/i }))

  expect(await screen.findByRole('heading', { name: 'Test', level: 2 })).toBeInTheDocument()
})

test('shows the new photo form only after selecting add new photo', async () => {
  const user = userEvent.setup()
  const album = await createAlbum('Renovation')
  window.location.hash = `#/albums/${album.id}`
  render(<App />)

  await screen.findByRole('heading', { name: 'Renovation', level: 2 })
  expect(screen.queryByLabelText(/set name/i)).not.toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: /add new photo/i }))
  expect(screen.getByLabelText(/set name/i)).toBeInTheDocument()
})

test('saves a pair and refreshes it into the album history', async () => {
  const user = userEvent.setup()
  const album = await createAlbum('Renovation')
  window.location.hash = `#/albums/${album.id}`
  render(<App />)

  await user.click(await screen.findByRole('button', { name: /add new photo/i }))
  await user.type(await screen.findByLabelText(/set name/i), 'Living Room 1')
  await user.upload(
    screen.getByLabelText(/^before/i),
    new File(['before'], 'before.png', { type: 'image/png' }),
  )
  await user.upload(
    screen.getByLabelText(/^after/i),
    new File(['after'], 'after.png', { type: 'image/png' }),
  )
  await user.click(screen.getByRole('button', { name: /save photo set/i }))

  expect(await screen.findByRole('heading', { name: 'Living Room 1' })).toBeInTheDocument()
  expect(screen.getByRole('img', { name: /living room 1 before/i })).toBeInTheDocument()
  expect(screen.getByRole('img', { name: /living room 1 after/i })).toBeInTheDocument()
})

test('cancels an edit without changing the saved set', async () => {
  const user = userEvent.setup()
  const album = await createAlbum('Renovation')
  window.location.hash = `#/albums/${album.id}`
  render(<App />)

  await user.click(await screen.findByRole('button', { name: /add new photo/i }))
  await user.type(await screen.findByLabelText(/set name/i), 'Living Room 1')
  await user.upload(screen.getByLabelText(/^before/i), new File(['before'], 'before.png', { type: 'image/png' }))
  await user.upload(screen.getByLabelText(/^after/i), new File(['after'], 'after.png', { type: 'image/png' }))
  await user.click(screen.getByRole('button', { name: /save photo set/i }))
  await screen.findByRole('heading', { name: 'Living Room 1' })

  await user.click(screen.getByRole('button', { name: /edit living room 1/i }))
  await user.clear(screen.getByLabelText(/set name/i))
  await user.type(screen.getByLabelText(/set name/i), 'Changed')
  await user.click(screen.getByRole('button', { name: /^cancel$/i }))

  expect(screen.getByRole('heading', { name: 'Living Room 1' })).toBeInTheDocument()
  expect(screen.queryByDisplayValue('Changed')).not.toBeInTheDocument()
})

test('deletes a set only after confirmation', async () => {
  const user = userEvent.setup()
  const album = await createAlbum('Renovation')
  window.location.hash = `#/albums/${album.id}`
  render(<App />)

  await user.click(await screen.findByRole('button', { name: /add new photo/i }))
  await user.type(await screen.findByLabelText(/set name/i), 'Living Room 1')
  await user.upload(screen.getByLabelText(/^before/i), new File(['before'], 'before.png', { type: 'image/png' }))
  await user.upload(screen.getByLabelText(/^after/i), new File(['after'], 'after.png', { type: 'image/png' }))
  await user.click(screen.getByRole('button', { name: /save photo set/i }))
  await screen.findByRole('heading', { name: 'Living Room 1' })

  await user.click(screen.getByRole('button', { name: /delete living room 1/i }))
  expect(screen.getByRole('dialog', { name: /delete living room 1/i })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /cancel/i }))
  expect(screen.getByRole('heading', { name: 'Living Room 1' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /delete living room 1/i }))
  await user.click(screen.getByRole('button', { name: /^delete$/i }))
  expect(await screen.findByText(/no photo sets yet/i)).toBeInTheDocument()
})

test('saves an edit while retaining unchanged images', async () => {
  const user = userEvent.setup()
  const album = await createAlbum('Renovation')
  window.location.hash = `#/albums/${album.id}`
  render(<App />)

  await user.click(await screen.findByRole('button', { name: /add new photo/i }))
  await user.type(await screen.findByLabelText(/set name/i), 'Living Room 1')
  await user.upload(screen.getByLabelText(/^before/i), new File(['before'], 'before.png', { type: 'image/png' }))
  await user.upload(screen.getByLabelText(/^after/i), new File(['after'], 'after.png', { type: 'image/png' }))
  await user.click(screen.getByRole('button', { name: /save photo set/i }))
  await screen.findByRole('heading', { name: 'Living Room 1' })

  await user.click(screen.getByRole('button', { name: /edit living room 1/i }))
  await user.clear(screen.getByLabelText(/set name/i))
  await user.type(screen.getByLabelText(/set name/i), 'Updated Living Room')
  expect(screen.getByRole('button', { name: /save changes/i })).toBeEnabled()
  await user.click(screen.getByRole('button', { name: /save changes/i }))

  expect(await screen.findByRole('heading', { name: 'Updated Living Room' })).toBeInTheDocument()
  expect(screen.getAllByRole('img')).toHaveLength(2)
})

test('enables save only after a name and both image files are selected', async () => {
  const user = userEvent.setup()
  render(<PhotoSetForm onSave={vi.fn()} />)

  const save = screen.getByRole('button', { name: /save photo set/i })
  expect(save).toBeDisabled()

  await user.type(screen.getByLabelText(/set name/i), 'Living Room 1')
  await user.upload(
    screen.getByLabelText(/^before/i),
    new File(['before'], 'before.png', { type: 'image/png' }),
  )
  await user.upload(
    screen.getByLabelText(/^after/i),
    new File(['after'], 'after.png', { type: 'image/png' }),
  )

  expect(save).toBeEnabled()
})

test('shows an error when a dropped file is not an image', async () => {
  render(<PhotoSetForm onSave={vi.fn()} />)

  fireEvent.drop(screen.getByLabelText(/^before/i), {
    dataTransfer: { files: [new File(['text'], 'notes.txt', { type: 'text/plain' })] },
  })

  expect(await screen.findByText('Choose an image file.')).toBeInTheDocument()
})

test('preserves a selected image when a non-image is chosen from the picker', async () => {
  const user = userEvent.setup({ applyAccept: false })
  render(<PhotoSetForm onSave={vi.fn()} />)

  const before = screen.getByLabelText(/^before/i)
  const validBefore = new File(['before'], 'before.png', { type: 'image/png' })
  await user.upload(before, validBefore)
  await user.upload(before, new File(['text'], 'notes.txt', { type: 'text/plain' }))

  expect(await screen.findByText('Choose an image file.')).toBeInTheDocument()
  expect(screen.getByText('before.png')).toBeInTheDocument()
})

test('preserves a selected image when a non-image is dropped', async () => {
  render(<PhotoSetForm onSave={vi.fn()} />)

  const before = screen.getByLabelText(/^before/i)
  fireEvent.drop(before, {
    dataTransfer: { files: [new File(['before'], 'before.png', { type: 'image/png' })] },
  })
  fireEvent.drop(before, {
    dataTransfer: { files: [new File(['text'], 'notes.txt', { type: 'text/plain' })] },
  })

  expect(await screen.findByText('Choose an image file.')).toBeInTheDocument()
  expect(screen.getByText('before.png')).toBeInTheDocument()
})
