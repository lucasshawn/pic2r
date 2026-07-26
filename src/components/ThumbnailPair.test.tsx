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
})
