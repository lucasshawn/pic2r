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

  it('hides "+ Add Before & After", "Edit Album", and "Delete Album" buttons when user is non-admin', async () => {
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
    expect(screen.queryByRole('button', { name: /edit album/i })).not.toBeInTheDocument()
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

  it('calls reorderPhotoSets when Move Down is clicked', async () => {
    const user = userEvent.setup()
    const ps1 = { id: 'ps-1', albumId: 'alb-1', name: 'First', before: 'b1', after: 'a1', createdAt: 1000 }
    const ps2 = { id: 'ps-2', albumId: 'alb-1', name: 'Second', before: 'b2', after: 'a2', createdAt: 2000 }

    vi.spyOn(catalogRepository, 'listPhotoSets').mockResolvedValue([ps1, ps2])
    const reorderSpy = vi.spyOn(catalogRepository, 'reorderPhotoSets').mockResolvedValue([ps2, ps1])

    localStorage.setItem(
      'pic2r_auth_user',
      JSON.stringify({ email: 'admin@example.com', name: 'Admin', isAdmin: true })
    )

    render(
      <AuthProvider>
        <AlbumPage album={sampleAlbum} />
      </AuthProvider>
    )

    expect(await screen.findByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()

    const moveDownButtons = screen.getAllByRole('button', { name: 'Move →' })
    await user.click(moveDownButtons[0])

    expect(reorderSpy).toHaveBeenCalledWith('alb-1', ['ps-2', 'ps-1'])
  })

  it('opens MovePhotoSetModal and moves photo set to target album', async () => {
    const user = userEvent.setup()
    const targetAlbum: Album = { id: 'alb-2', name: 'Bathroom Remodel', createdAt: 2000 }
    const ps1 = { id: 'ps-1', albumId: 'alb-1', name: 'First', before: 'b1', after: 'a1', createdAt: 1000 }

    vi.spyOn(catalogRepository, 'listPhotoSets').mockResolvedValue([ps1])
    const moveSpy = vi.spyOn(catalogRepository, 'movePhotoSet').mockResolvedValue(undefined)

    localStorage.setItem(
      'pic2r_auth_user',
      JSON.stringify({ email: 'admin@example.com', name: 'Admin', isAdmin: true })
    )

    render(
      <AuthProvider>
        <AlbumPage album={sampleAlbum} albums={[sampleAlbum, targetAlbum]} />
      </AuthProvider>
    )

    expect(await screen.findByText('First')).toBeInTheDocument()

    const moveModalBtn = screen.getByRole('button', { name: 'Move to Album...' })
    await user.click(moveModalBtn)

    expect(screen.getByRole('dialog', { name: 'Move Before & After' })).toBeInTheDocument()

    const confirmMoveBtn = screen.getByRole('button', { name: 'Move' })
    await user.click(confirmMoveBtn)

    expect(moveSpy).toHaveBeenCalledWith('ps-1', 'alb-1', 'alb-2')
    expect(screen.queryByText('First')).not.toBeInTheDocument()
  })

  it('renders "Edit Album" button for admin, opens EditAlbumModal, and saving updates album and calls onUpdateAlbum', async () => {
    const user = userEvent.setup()
    const updateSpy = vi.spyOn(catalogRepository, 'updateAlbum').mockResolvedValue({
      id: 'alb-1',
      name: 'Renovated Kitchen',
      description: 'Updated description',
      createdAt: 1000,
    })
    const onUpdateAlbum = vi.fn()

    localStorage.setItem(
      'pic2r_auth_user',
      JSON.stringify({ email: 'admin@example.com', name: 'Admin', isAdmin: true })
    )

    render(
      <AuthProvider>
        <AlbumPage album={sampleAlbum} onUpdateAlbum={onUpdateAlbum} />
      </AuthProvider>
    )

    expect(await screen.findByRole('heading', { name: 'Kitchen Remodel' })).toBeInTheDocument()
    const editBtn = screen.getByRole('button', { name: /edit album/i })
    expect(editBtn).toBeInTheDocument()

    await user.click(editBtn)

    const dialog = screen.getByRole('dialog', { name: 'Edit Album' })
    expect(dialog).toBeInTheDocument()

    const nameInput = screen.getByLabelText(/album name/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Renovated Kitchen')

    const descInput = screen.getByLabelText(/description \(optional\)/i)
    await user.type(descInput, 'Updated description')

    const saveBtn = screen.getByRole('button', { name: 'Save' })
    await user.click(saveBtn)

    expect(updateSpy).toHaveBeenCalledWith('alb-1', 'Renovated Kitchen', 'Updated description')
    expect(onUpdateAlbum).toHaveBeenCalledWith({
      id: 'alb-1',
      name: 'Renovated Kitchen',
      description: 'Updated description',
      createdAt: 1000,
    })
    expect(await screen.findByRole('heading', { name: 'Renovated Kitchen' })).toBeInTheDocument()
    expect(screen.getByText('Updated description')).toBeInTheDocument()
  })

  it('opens PhotoLightboxModal when clicking a thumbnail pair and closes when clicking close button', async () => {
    const user = userEvent.setup()
    const ps1 = { id: 'ps-1', albumId: 'alb-1', name: 'Living Room', before: 'b1', after: 'a1', createdAt: 1000 }
    vi.spyOn(catalogRepository, 'listPhotoSets').mockResolvedValue([ps1])

    const { container } = render(
      <AuthProvider>
        <AlbumPage album={sampleAlbum} />
      </AuthProvider>
    )

    expect(await screen.findByText('Living Room')).toBeInTheDocument()

    const trigger = container.querySelector('.thumbnail-pair-media-trigger')!
    await user.click(trigger)

    const lightbox = screen.getByRole('dialog', { name: 'Enlarged Before & After view' })
    expect(lightbox).toBeInTheDocument()

    const closeBtn = screen.getByRole('button', { name: 'Close enlarged view' })
    await user.click(closeBtn)

    expect(screen.queryByRole('dialog', { name: 'Enlarged Before & After view' })).not.toBeInTheDocument()
  })
})
