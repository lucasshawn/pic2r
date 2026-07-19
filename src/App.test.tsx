import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from './App'
import { PhotoSetForm } from './components/PhotoSetForm'

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
