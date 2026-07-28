import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { MovePhotoSetModal } from './MovePhotoSetModal'
import type { Album, PhotoSet } from '../types'

describe('MovePhotoSetModal Component', () => {
  const mockPhotoSet: PhotoSet = {
    id: 'ps-1',
    albumId: 'album-1',
    name: 'Before & After Set 1',
    beforeUrl: 'http://example.com/before.jpg',
    afterUrl: 'http://example.com/after.jpg',
    before: 'before.jpg',
    after: 'after.jpg',
    createdAt: 1000,
  }

  const mockAlbums: Album[] = [
    { id: 'album-1', name: 'Kitchens', createdAt: 1000 },
    { id: 'album-2', name: 'Bathrooms', createdAt: 2000 },
    { id: 'album-3', name: 'Living Rooms', createdAt: 3000 },
  ]

  it('renders modal dialog with dropdown list of target albums excluding current album', () => {
    render(
      <MovePhotoSetModal
        photoSet={mockPhotoSet}
        currentAlbumId="album-1"
        albums={mockAlbums}
        onClose={vi.fn()}
        onConfirmMove={vi.fn()}
      />
    )

    const dialog = screen.getByRole('dialog', { name: /move before & after/i })
    expect(dialog).toBeInTheDocument()

    const select = screen.getByRole('combobox', { name: /select target album/i })
    expect(select).toBeInTheDocument()

    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(2)
    expect(options[0]).toHaveTextContent('Bathrooms')
    expect(options[0]).toHaveValue('album-2')
    expect(options[1]).toHaveTextContent('Living Rooms')
    expect(options[1]).toHaveValue('album-3')
  })

  it('selects target album and submits form invoking onConfirmMove', async () => {
    const user = userEvent.setup()
    const handleConfirmMove = vi.fn().mockResolvedValue(undefined)

    render(
      <MovePhotoSetModal
        photoSet={mockPhotoSet}
        currentAlbumId="album-1"
        albums={mockAlbums}
        onClose={vi.fn()}
        onConfirmMove={handleConfirmMove}
      />
    )

    const select = screen.getByRole('combobox', { name: /select target album/i })
    await user.selectOptions(select, 'album-3')

    const submitButton = screen.getByRole('button', { name: /^move$/i })
    await user.click(submitButton)

    expect(handleConfirmMove).toHaveBeenCalledTimes(1)
    expect(handleConfirmMove).toHaveBeenCalledWith('album-3')
  })

  it('renders empty state when no other albums exist', () => {
    const singleAlbum: Album[] = [
      { id: 'album-1', name: 'Kitchens', createdAt: 1000 },
    ]

    render(
      <MovePhotoSetModal
        photoSet={mockPhotoSet}
        currentAlbumId="album-1"
        albums={singleAlbum}
        onClose={vi.fn()}
        onConfirmMove={vi.fn()}
      />
    )

    expect(screen.getByText(/no other albums available/i)).toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^move$/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('invokes onClose when Cancel button or backdrop is clicked', async () => {
    const user = userEvent.setup()
    const handleClose = vi.fn()

    render(
      <MovePhotoSetModal
        photoSet={mockPhotoSet}
        currentAlbumId="album-1"
        albums={mockAlbums}
        onClose={handleClose}
        onConfirmMove={vi.fn()}
      />
    )

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    expect(handleClose).toHaveBeenCalledTimes(1)
  })
})
