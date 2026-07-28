import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AuthProvider } from '../context/AuthContext'
import { ThumbnailPair } from './ThumbnailPair'
import type { PhotoSet } from '../types'

describe('ThumbnailPair Component', () => {
  const photoSet: PhotoSet = {
    id: 'ps-1',
    albumId: 'alb-1',
    name: 'Living Room',
    beforeUrl: 'https://r2.dev/before.png',
    afterUrl: 'https://r2.dev/after.png',
    before: 'https://r2.dev/before.png',
    after: 'https://r2.dev/after.png',
    createdAt: 1000,
  }

  beforeEach(() => {
    localStorage.clear()
    import.meta.env.VITE_ADMIN_EMAILS = 'admin@example.com'
  })

  it('renders image tags with string URLs directly', () => {
    render(
      <AuthProvider>
        <ThumbnailPair photoSet={photoSet} onEdit={vi.fn()} onDelete={vi.fn()} />
      </AuthProvider>
    )

    const beforeImg = screen.getByAltText('Living Room before') as HTMLImageElement
    const afterImg = screen.getByAltText('Living Room after') as HTMLImageElement

    expect(beforeImg.src).toContain('https://r2.dev/before.png')
    expect(afterImg.src).toContain('https://r2.dev/after.png')
  })

  it('renders image tags with Blob objects via object URLs', () => {
    const mockBeforeBlob = new Blob(['before'], { type: 'image/png' })
    const mockAfterBlob = new Blob(['after'], { type: 'image/png' })
    const blobPhotoSet: PhotoSet = {
      id: 'ps-2',
      albumId: 'alb-1',
      name: 'Kitchen',
      before: mockBeforeBlob,
      after: mockAfterBlob,
      createdAt: 1000,
    }

    render(
      <AuthProvider>
        <ThumbnailPair photoSet={blobPhotoSet} onEdit={vi.fn()} onDelete={vi.fn()} />
      </AuthProvider>
    )

    const beforeImg = screen.getByAltText('Kitchen before') as HTMLImageElement
    const afterImg = screen.getByAltText('Kitchen after') as HTMLImageElement

    expect(beforeImg.src).toBeTruthy()
    expect(afterImg.src).toBeTruthy()
  })

  it('hides edit and delete action buttons when user is non-admin', () => {
    localStorage.setItem(
      'pic2r_auth_user',
      JSON.stringify({ email: 'reader@example.com', name: 'Reader', isAdmin: false })
    )

    render(
      <AuthProvider>
        <ThumbnailPair photoSet={photoSet} onEdit={vi.fn()} onDelete={vi.fn()} />
      </AuthProvider>
    )

    expect(screen.queryByRole('button', { name: /edit living room/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /delete living room/i })).not.toBeInTheDocument()
  })

  it('renders edit and delete action buttons when user is admin', () => {
    localStorage.setItem(
      'pic2r_auth_user',
      JSON.stringify({ email: 'admin@example.com', name: 'Admin', isAdmin: true })
    )

    render(
      <AuthProvider>
        <ThumbnailPair photoSet={photoSet} onEdit={vi.fn()} onDelete={vi.fn()} />
      </AuthProvider>
    )

    expect(screen.getByRole('button', { name: /edit living room/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete living room/i })).toBeInTheDocument()
  })

  it('renders description and caption title below images in Instagram caption layout when present', () => {
    const photoSetWithDesc: PhotoSet = {
      ...photoSet,
      description: 'Renovated in 2024 with new flooring',
    }

    const { container } = render(
      <AuthProvider>
        <ThumbnailPair photoSet={photoSetWithDesc} onEdit={vi.fn()} onDelete={vi.fn()} />
      </AuthProvider>
    )

    expect(screen.getByText('Renovated in 2024 with new flooring')).toBeInTheDocument()
    const captionContainer = container.querySelector('.thumbnail-pair-caption')
    expect(captionContainer).toBeInTheDocument()
    const captionTitle = container.querySelector('.caption-title')
    expect(captionTitle).toBeInTheDocument()
    expect(captionTitle?.textContent).toBe('Living Room')
  })

  it('does not render description element or caption container when description is missing', () => {
    const { container } = render(
      <AuthProvider>
        <ThumbnailPair photoSet={photoSet} onEdit={vi.fn()} onDelete={vi.fn()} />
      </AuthProvider>
    )

    expect(container.querySelector('.thumbnail-pair-description')).not.toBeInTheDocument()
    expect(container.querySelector('.thumbnail-pair-caption')).not.toBeInTheDocument()
  })

  it('renders Created date when takenAt is not provided', () => {
    const testTimestamp = 1700000000000
    const photoSetWithCreated: PhotoSet = {
      ...photoSet,
      createdAt: testTimestamp,
    }

    const expectedDateStr = new Date(testTimestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })

    render(
      <AuthProvider>
        <ThumbnailPair photoSet={photoSetWithCreated} onEdit={vi.fn()} onDelete={vi.fn()} />
      </AuthProvider>
    )

    expect(screen.getByText(`Created ${expectedDateStr}`)).toBeInTheDocument()
  })

  it('renders Taken date when takenAt is provided', () => {
    const takenTimestamp = 1650000000000
    const photoSetWithTaken: PhotoSet = {
      ...photoSet,
      createdAt: 1700000000000,
      takenAt: takenTimestamp,
    }

    const expectedDateStr = new Date(takenTimestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })

    render(
      <AuthProvider>
        <ThumbnailPair photoSet={photoSetWithTaken} onEdit={vi.fn()} onDelete={vi.fn()} />
      </AuthProvider>
    )

    expect(screen.getByText(`Taken ${expectedDateStr}`)).toBeInTheDocument()
  })

  it('renders BEFORE and AFTER overlay badges', () => {
    render(
      <AuthProvider>
        <ThumbnailPair photoSet={photoSet} onEdit={vi.fn()} onDelete={vi.fn()} />
      </AuthProvider>
    )

    expect(screen.getByText('BEFORE')).toBeInTheDocument()
    expect(screen.getByText('AFTER')).toBeInTheDocument()
  })

  it('renders reorder and move buttons with correct disabled state for admin', () => {
    localStorage.setItem(
      'pic2r_auth_user',
      JSON.stringify({ email: 'admin@example.com', name: 'Admin', isAdmin: true })
    )

    const onMoveUp = vi.fn()
    const onMoveDown = vi.fn()
    const onOpenMoveModal = vi.fn()

    render(
      <AuthProvider>
        <ThumbnailPair
          photoSet={photoSet}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          canMoveUp={false}
          canMoveDown={true}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onOpenMoveModal={onOpenMoveModal}
        />
      </AuthProvider>
    )

    const moveUpBtn = screen.getByRole('button', { name: '← Move' })
    const moveDownBtn = screen.getByRole('button', { name: 'Move →' })
    const moveModalBtn = screen.getByRole('button', { name: 'Move to Album...' })

    expect(moveUpBtn).toBeDisabled()
    expect(moveDownBtn).not.toBeDisabled()
    expect(moveModalBtn).toBeInTheDocument()

    moveDownBtn.click()
    expect(onMoveDown).toHaveBeenCalledTimes(1)

    moveModalBtn.click()
    expect(onOpenMoveModal).toHaveBeenCalledTimes(1)
  })
})
