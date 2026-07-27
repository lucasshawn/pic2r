import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AuthProvider } from '../context/AuthContext'
import { CatalogPage } from './CatalogPage'
import type { Album } from '../types'

describe('CatalogPage Component (Read-Only vs Admin)', () => {
  const sampleAlbums: Album[] = [
    { id: 'alb-1', name: 'Kitchen Remodel', createdAt: 1000 },
  ]

  beforeEach(() => {
    localStorage.clear()
    import.meta.env.VITE_ADMIN_EMAILS = 'admin@example.com'
  })

  it('hides "Create album" button and AlbumForm when user is non-admin', () => {
    localStorage.setItem(
      'pic2r_auth_user',
      JSON.stringify({ email: 'reader@example.com', name: 'Reader', isAdmin: false })
    )

    render(
      <AuthProvider>
        <CatalogPage albums={sampleAlbums} isLoading={false} onCreateAlbum={vi.fn()} />
      </AuthProvider>
    )

    expect(screen.getByRole('heading', { name: 'Albums' })).toBeInTheDocument()
    expect(screen.getByText('Kitchen Remodel')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /create album/i })).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/album name/i)).not.toBeInTheDocument()
  })

  it('renders "Create album" button and opens AlbumForm when user is admin', async () => {
    const user = userEvent.setup()
    localStorage.setItem(
      'pic2r_auth_user',
      JSON.stringify({ email: 'admin@example.com', name: 'Admin', isAdmin: true })
    )

    render(
      <AuthProvider>
        <CatalogPage albums={sampleAlbums} isLoading={false} onCreateAlbum={vi.fn()} />
      </AuthProvider>
    )

    const createBtn = screen.getByRole('button', { name: /create album/i })
    expect(createBtn).toBeInTheDocument()

    await user.click(createBtn)
    expect(screen.getByLabelText(/album name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description \(optional\)/i)).toBeInTheDocument()
  })

  it('renders album description on album card when present', () => {
    const albumsWithDesc: Album[] = [
      { id: 'alb-1', name: 'Kitchen Remodel', description: 'Renovating kitchen counters', createdAt: 1000 },
    ]

    render(
      <AuthProvider>
        <CatalogPage albums={albumsWithDesc} isLoading={false} onCreateAlbum={vi.fn()} />
      </AuthProvider>
    )

    expect(screen.getByText('Kitchen Remodel')).toBeInTheDocument()
    const descEl = screen.getByText('Renovating kitchen counters')
    expect(descEl).toBeInTheDocument()
    expect(descEl).toHaveClass('album-card-description')
  })

  it('allows creating an album with an optional description', async () => {
    const user = userEvent.setup()
    const handleCreateAlbum = vi.fn()
    localStorage.setItem(
      'pic2r_auth_user',
      JSON.stringify({ email: 'admin@example.com', name: 'Admin', isAdmin: true })
    )

    render(
      <AuthProvider>
        <CatalogPage albums={sampleAlbums} isLoading={false} onCreateAlbum={handleCreateAlbum} />
      </AuthProvider>
    )

    await user.click(screen.getByRole('button', { name: /create album/i }))
    await user.type(screen.getByLabelText(/album name/i), 'Basement Renovation')
    await user.type(screen.getByLabelText(/description \(optional\)/i), 'Finishing the basement space')
    await user.click(screen.getByRole('button', { name: /save album/i }))

    expect(handleCreateAlbum).toHaveBeenCalledWith('Basement Renovation', 'Finishing the basement space')
  })
})
