import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from './App'

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
