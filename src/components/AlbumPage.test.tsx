import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach } from 'vitest'
import { AuthProvider } from '../context/AuthContext'
import { AlbumPage } from './AlbumPage'
import type { Album } from '../types'

describe('AlbumPage Component (Read-Only vs Admin)', () => {
  const sampleAlbum: Album = { id: 'alb-1', name: 'Kitchen Remodel', createdAt: 1000 }

  beforeEach(() => {
    localStorage.clear()
    import.meta.env.VITE_ADMIN_EMAILS = 'admin@example.com'
  })

  it('hides "+ Add new photo" button and PhotoSetForm/DropZone when user is non-admin', async () => {
    localStorage.setItem(
      'pic2r_auth_user',
      JSON.stringify({ email: 'reader@example.com', name: 'Reader', isAdmin: false })
    )

    render(
      <AuthProvider>
        <AlbumPage album={sampleAlbum} />
      </AuthProvider>
    )

    expect(await screen.findByRole('heading', { name: 'Kitchen Remodel' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /add new photo/i })).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/set name/i)).not.toBeInTheDocument()
  })

  it('renders "+ Add new photo" button and opens PhotoSetForm/DropZone when user is admin', async () => {
    const user = userEvent.setup()
    localStorage.setItem(
      'pic2r_auth_user',
      JSON.stringify({ email: 'admin@example.com', name: 'Admin', isAdmin: true })
    )

    render(
      <AuthProvider>
        <AlbumPage album={sampleAlbum} />
      </AuthProvider>
    )

    expect(await screen.findByRole('heading', { name: 'Kitchen Remodel' })).toBeInTheDocument()
    const addBtn = screen.getByRole('button', { name: /add new photo/i })
    expect(addBtn).toBeInTheDocument()

    await user.click(addBtn)
    expect(screen.getByLabelText(/set name/i)).toBeInTheDocument()
  })
})
