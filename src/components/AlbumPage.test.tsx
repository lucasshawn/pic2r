import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AuthProvider } from '../context/AuthContext'
import { AlbumPage } from './AlbumPage'
import type { Album } from '../types'
import * as catalogRepository from '../catalogRepository'

describe('AlbumPage Component (Read-Only vs Admin)', () => {
  const sampleAlbum: Album = { id: 'alb-1', name: 'Kitchen Remodel', createdAt: 1000 }

  beforeEach(() => {
    localStorage.clear()
    import.meta.env.VITE_ADMIN_EMAILS = 'admin@example.com'
    vi.restoreAllMocks()
  })

  it('hides "+ Add Before & After" and "Delete Album" buttons when user is non-admin', async () => {
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
    expect(screen.queryByRole('button', { name: /add before & after/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /delete album/i })).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/set name/i)).not.toBeInTheDocument()
  })

  it('renders "+ Add Before & After" button and opens PhotoSetForm/DropZone when user is admin', async () => {
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
    const addBtn = screen.getByRole('button', { name: /add before & after/i })
    expect(addBtn).toBeInTheDocument()

    await user.click(addBtn)
    expect(screen.getByLabelText(/set name/i)).toBeInTheDocument()
  })

  it('renders album description when present', async () => {
    const albumWithDesc: Album = {
      id: 'alb-2',
      name: 'Bathroom Remodel',
      description: 'Tiles and sink renovation details',
      createdAt: 2000,
    }

    render(
      <AuthProvider>
        <AlbumPage album={albumWithDesc} />
      </AuthProvider>
    )

    expect(await screen.findByRole('heading', { name: 'Bathroom Remodel' })).toBeInTheDocument()
    expect(screen.getByText('Tiles and sink renovation details')).toBeInTheDocument()
    expect(screen.getByText('Tiles and sink renovation details')).toHaveClass('album-description')
  })

  it('renders "Delete Album" button for admin, opens confirmation modal, and confirming invokes deleteAlbum and navigates to #/', async () => {
    const user = userEvent.setup()
    const deleteSpy = vi.spyOn(catalogRepository, 'deleteAlbum').mockResolvedValue(undefined)
    localStorage.setItem(
      'pic2r_auth_user',
      JSON.stringify({ email: 'admin@example.com', name: 'Admin', isAdmin: true })
    )
    window.location.hash = '#/albums/alb-1'

    render(
      <AuthProvider>
        <AlbumPage album={sampleAlbum} />
      </AuthProvider>
    )

    expect(await screen.findByRole('heading', { name: 'Kitchen Remodel' })).toBeInTheDocument()
    const deleteBtn = screen.getByRole('button', { name: /delete album/i })
    expect(deleteBtn).toBeInTheDocument()

    await user.click(deleteBtn)

    const dialog = screen.getByRole('dialog', { name: 'Delete Album' })
    expect(dialog).toBeInTheDocument()
    expect(within(dialog).getByText('Are you sure you want to delete this album and all its Before & After entries?')).toBeInTheDocument()

    const cancelBtn = within(dialog).getByRole('button', { name: /cancel/i })
    await user.click(cancelBtn)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(deleteBtn)
    const activeDialog = screen.getByRole('dialog', { name: 'Delete Album' })
    const confirmDeleteBtn = within(activeDialog).getByRole('button', { name: 'Delete Album' })
    await user.click(confirmDeleteBtn)

    expect(deleteSpy).toHaveBeenCalledWith('alb-1')
    expect(window.location.hash).toBe('#/')
  })
})
