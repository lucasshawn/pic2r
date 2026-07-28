import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { PhotoSetForm } from './PhotoSetForm'
import type { PhotoSet } from '../types'

describe('PhotoSetForm Component', () => {
  it('renders description textarea with optional label and placeholder', () => {
    render(<PhotoSetForm onSave={vi.fn()} />)

    const textarea = screen.getByLabelText(/description \(optional\)/i)
    expect(textarea).toBeInTheDocument()
    expect(textarea).toHaveAttribute('placeholder', 'Add details about this before & after...')
  })

  it('pre-fills description when initialPhotoSet is provided', () => {
    const initialPhotoSet: PhotoSet = {
      id: 'ps-1',
      albumId: 'alb-1',
      name: 'Kitchen Renovation',
      description: 'Replaced cabinets and countertop',
      before: 'http://example.com/before.jpg',
      after: 'http://example.com/after.jpg',
      createdAt: 1000,
    }

    render(<PhotoSetForm initialPhotoSet={initialPhotoSet} onSave={vi.fn()} />)

    expect(screen.getByLabelText(/set name/i)).toHaveValue('Kitchen Renovation')
    expect(screen.getByLabelText(/description \(optional\)/i)).toHaveValue('Replaced cabinets and countertop')
  })

  it('submits trimmed description to onSave callback', async () => {
    const user = userEvent.setup()
    const handleSave = vi.fn().mockResolvedValue(undefined)

    render(<PhotoSetForm onSave={handleSave} />)

    await user.type(screen.getByLabelText(/set name/i), '   New Deck   ')
    await user.type(screen.getByLabelText(/description \(optional\)/i), '   Built a wooden deck   ')
    await user.upload(
      screen.getByLabelText(/^before/i),
      new File(['before'], 'before.png', { type: 'image/png' }),
    )
    await user.upload(
      screen.getByLabelText(/^after/i),
      new File(['after'], 'after.png', { type: 'image/png' }),
    )

    await user.click(screen.getByRole('button', { name: /save before & after/i }))

    expect(handleSave).toHaveBeenCalledTimes(1)
    expect(handleSave).toHaveBeenCalledWith(
      'New Deck',
      'Built a wooden deck',
      expect.any(File),
      expect.any(File),
    )
  })

  it('allows form submission with name and before photo only', async () => {
    const user = userEvent.setup()
    const handleSave = vi.fn().mockResolvedValue(undefined)

    render(<PhotoSetForm onSave={handleSave} />)

    await user.type(screen.getByLabelText(/set name/i), 'Single Photo Set')
    await user.upload(
      screen.getByLabelText(/^before/i),
      new File(['before'], 'before.png', { type: 'image/png' }),
    )

    const submitButton = screen.getByRole('button', { name: /save before & after/i })
    expect(submitButton).not.toBeDisabled()

    await user.click(submitButton)

    expect(handleSave).toHaveBeenCalledTimes(1)
    expect(handleSave).toHaveBeenCalledWith(
      'Single Photo Set',
      '',
      expect.any(File),
      null,
    )
  })
})
