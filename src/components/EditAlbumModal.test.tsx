import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { EditAlbumModal } from './EditAlbumModal'
import type { Album } from '../types'

describe('EditAlbumModal Component', () => {
  const mockAlbum: Album = {
    id: 'album-1',
    name: 'Kitchen Remodel',
    description: 'Before and after photos of kitchen renovation.',
    createdAt: 1000,
  }

  it('renders modal dialog pre-filled with album name and description', () => {
    render(
      <EditAlbumModal
        album={mockAlbum}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    )

    const dialog = screen.getByRole('dialog', { name: /edit album/i })
    expect(dialog).toBeInTheDocument()

    const nameInput = screen.getByLabelText(/album name/i)
    expect(nameInput).toHaveValue('Kitchen Remodel')

    const descriptionInput = screen.getByLabelText(/description/i)
    expect(descriptionInput).toHaveValue('Before and after photos of kitchen renovation.')
  })

  it('edits name and description fields and submits form invoking onSave', async () => {
    const user = userEvent.setup()
    const handleSave = vi.fn().mockResolvedValue(undefined)

    render(
      <EditAlbumModal
        album={mockAlbum}
        onClose={vi.fn()}
        onSave={handleSave}
      />
    )

    const nameInput = screen.getByLabelText(/album name/i)
    const descriptionInput = screen.getByLabelText(/description/i)

    await user.clear(nameInput)
    await user.type(nameInput, 'Modern Kitchens')

    await user.clear(descriptionInput)
    await user.type(descriptionInput, 'Updated kitchen designs.')

    const saveButton = screen.getByRole('button', { name: /^save$/i })
    await user.click(saveButton)

    expect(handleSave).toHaveBeenCalledTimes(1)
    expect(handleSave).toHaveBeenCalledWith('Modern Kitchens', 'Updated kitchen designs.')
  })

  it('displays validation error when album name is empty and does not call onSave', async () => {
    const user = userEvent.setup()
    const handleSave = vi.fn()

    render(
      <EditAlbumModal
        album={mockAlbum}
        onClose={vi.fn()}
        onSave={handleSave}
      />
    )

    const nameInput = screen.getByLabelText(/album name/i)
    await user.clear(nameInput)

    const saveButton = screen.getByRole('button', { name: /^save$/i })
    await user.click(saveButton)

    expect(screen.getByText(/enter an album name/i)).toBeInTheDocument()
    expect(handleSave).not.toHaveBeenCalled()
  })

  it('invokes onClose when Cancel button or close icon (✕) is clicked', async () => {
    const user = userEvent.setup()
    const handleClose = vi.fn()

    const { rerender } = render(
      <EditAlbumModal
        album={mockAlbum}
        onClose={handleClose}
        onSave={vi.fn()}
      />
    )

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)
    expect(handleClose).toHaveBeenCalledTimes(1)

    handleClose.mockClear()

    rerender(
      <EditAlbumModal
        album={mockAlbum}
        onClose={handleClose}
        onSave={vi.fn()}
      />
    )

    const closeIconButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeIconButton)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })
})
