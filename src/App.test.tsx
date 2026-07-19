import { render, screen } from '@testing-library/react'
import { App } from './App'

test('renders the picture catalog heading', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: /picture catalog/i })).toBeInTheDocument()
})
