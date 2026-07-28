import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { PhotoLightboxModal } from './PhotoLightboxModal'
import type { PhotoSet } from '../types'

describe('PhotoLightboxModal Component', () => {
  const mockPhotoSet: PhotoSet = {
    id: 'ps-1',
    albumId: 'album-1',
    name: 'Master Kitchen Remodel',
    description: 'Complete transformation of kitchen with quartz countertops',
    takenAt: 1700000000000,
    beforeUrl: 'https://example.com/before.jpg',
    afterUrl: 'https://example.com/after.jpg',
    before: 'https://example.com/before.jpg',
    after: 'https://example.com/after.jpg',
    createdAt: 1690000000000,
  }

  it('renders enlarged images, BEFORE and AFTER overlay badges, title, formatted date, and description', () => {
    render(<PhotoLightboxModal photoSet={mockPhotoSet} onClose={vi.fn()} />)

    const dialog = screen.getByRole('dialog', { name: /enlarged before & after view/i })
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute('aria-modal', 'true')

    expect(screen.getByText('Master Kitchen Remodel')).toBeInTheDocument()
    expect(screen.getByText('Complete transformation of kitchen with quartz countertops')).toBeInTheDocument()

    const formattedDate = new Date(1700000000000).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
    expect(screen.getByText(`Taken ${formattedDate}`)).toBeInTheDocument()

    const beforeBadge = screen.getByText('BEFORE')
    const afterBadge = screen.getByText('AFTER')
    expect(beforeBadge).toBeInTheDocument()
    expect(afterBadge).toBeInTheDocument()

    const beforeImg = screen.getByAltText('Master Kitchen Remodel before') as HTMLImageElement
    const afterImg = screen.getByAltText('Master Kitchen Remodel after') as HTMLImageElement

    expect(beforeImg.src).toContain('https://example.com/before.jpg')
    expect(afterImg.src).toContain('https://example.com/after.jpg')
  })

  it('renders Blob objects as object URLs', () => {
    const mockBeforeBlob = new Blob(['before-data'], { type: 'image/png' })
    const mockAfterBlob = new Blob(['after-data'], { type: 'image/png' })
    const blobPhotoSet: PhotoSet = {
      ...mockPhotoSet,
      before: mockBeforeBlob,
      after: mockAfterBlob,
      beforeUrl: '',
      afterUrl: '',
    }

    render(<PhotoLightboxModal photoSet={blobPhotoSet} onClose={vi.fn()} />)

    const beforeImg = screen.getByAltText('Master Kitchen Remodel before') as HTMLImageElement
    const afterImg = screen.getByAltText('Master Kitchen Remodel after') as HTMLImageElement

    expect(beforeImg.src).toBeTruthy()
    expect(afterImg.src).toBeTruthy()
  })

  it('invokes onClose when clicking close button (✕)', async () => {
    const user = userEvent.setup()
    const handleClose = vi.fn()

    render(<PhotoLightboxModal photoSet={mockPhotoSet} onClose={handleClose} />)

    const closeBtn = screen.getByRole('button', { name: /close enlarged view/i })
    expect(closeBtn).toBeInTheDocument()
    expect(closeBtn).toHaveTextContent('✕')

    await user.click(closeBtn)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('invokes onClose when clicking dark backdrop overlay', async () => {
    const user = userEvent.setup()
    const handleClose = vi.fn()

    render(<PhotoLightboxModal photoSet={mockPhotoSet} onClose={handleClose} />)

    const dialog = screen.getByRole('dialog', { name: /enlarged before & after view/i })
    await user.click(dialog)

    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('invokes onClose when pressing Escape key', async () => {
    const user = userEvent.setup()
    const handleClose = vi.fn()

    render(<PhotoLightboxModal photoSet={mockPhotoSet} onClose={handleClose} />)

    await user.keyboard('{Escape}')
    expect(handleClose).toHaveBeenCalledTimes(1)
  })
})
