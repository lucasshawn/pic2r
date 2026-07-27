import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AuthProvider } from '../context/AuthContext'
import { SettingsModal } from './SettingsModal'

describe('SettingsModal Component', () => {
  const originalEnv = import.meta.env.VITE_ADMIN_EMAILS

  beforeEach(() => {
    localStorage.clear()
    import.meta.env.VITE_ADMIN_EMAILS = 'admin@example.com'
  })

  afterEach(() => {
    import.meta.env.VITE_ADMIN_EMAILS = originalEnv
    localStorage.clear()
  })

  it('does not render when isOpen is false', () => {
    render(
      <AuthProvider>
        <SettingsModal isOpen={false} onClose={() => {}} />
      </AuthProvider>
    )

    expect(screen.queryByRole('dialog', { name: /settings/i })).not.toBeInTheDocument()
  })

  it('renders modal overlay container with role="dialog", aria-label="Settings", and close button', async () => {
    const user = userEvent.setup()
    const handleClose = vi.fn()

    render(
      <AuthProvider>
        <SettingsModal isOpen={true} onClose={handleClose} />
      </AuthProvider>
    )

    const dialog = screen.getByRole('dialog', { name: /settings/i })
    expect(dialog).toBeInTheDocument()

    const closeBtn = screen.getByRole('button', { name: /✕|close/i })
    expect(closeBtn).toBeInTheDocument()

    await user.click(closeBtn)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('handles theme selection (Light vs Dark)', async () => {
    const user = userEvent.setup()

    render(
      <AuthProvider>
        <SettingsModal isOpen={true} onClose={() => {}} />
      </AuthProvider>
    )

    const lightRadio = screen.getByLabelText(/light mode/i) as HTMLInputElement
    const darkRadio = screen.getByLabelText(/dark mode/i) as HTMLInputElement

    expect(lightRadio.checked).toBe(true)
    expect(darkRadio.checked).toBe(false)

    await user.click(darkRadio)

    expect(darkRadio.checked).toBe(true)
    expect(lightRadio.checked).toBe(false)
    expect(localStorage.getItem('pic2r_theme')).toBe('dark')

    await user.click(lightRadio)
    expect(lightRadio.checked).toBe(true)
    expect(localStorage.getItem('pic2r_theme')).toBe('light')
  })

  it('hides "Manage Admins" section for non-admin users', () => {
    // Logged in as regular non-admin user
    localStorage.setItem(
      'pic2r_auth_user',
      JSON.stringify({
        email: 'user@example.com',
        name: 'Regular User',
        isAdmin: false,
      })
    )

    render(
      <AuthProvider>
        <SettingsModal isOpen={true} onClose={() => {}} />
      </AuthProvider>
    )

    expect(screen.queryByText(/manage admins/i)).not.toBeInTheDocument()
  })

  it('shows "Manage Admins" section for admin users', () => {
    // Logged in as admin user
    localStorage.setItem(
      'pic2r_auth_user',
      JSON.stringify({
        email: 'admin@example.com',
        name: 'Alice Admin',
        isAdmin: true,
      })
    )

    render(
      <AuthProvider>
        <SettingsModal isOpen={true} onClose={() => {}} />
      </AuthProvider>
    )

    expect(screen.getByText(/manage admins/i)).toBeInTheDocument()
  })

  it('allows adding and removing custom admin emails', async () => {
    const user = userEvent.setup()

    // Logged in as admin user
    localStorage.setItem(
      'pic2r_auth_user',
      JSON.stringify({
        email: 'admin@example.com',
        name: 'Alice Admin',
        isAdmin: true,
      })
    )

    render(
      <AuthProvider>
        <SettingsModal isOpen={true} onClose={() => {}} />
      </AuthProvider>
    )

    const input = screen.getByRole('textbox', { name: /admin email/i })
    const addBtn = screen.getByRole('button', { name: /add admin/i })

    // Validation test: empty or invalid email
    await user.click(addBtn)
    expect(screen.getByText(/please enter/i)).toBeInTheDocument()

    await user.type(input, 'invalid-email')
    await user.click(addBtn)
    expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument()

    // Add valid custom admin email
    await user.clear(input)
    await user.type(input, 'newadmin@example.com')
    await user.click(addBtn)

    expect(screen.getByText('newadmin@example.com')).toBeInTheDocument()

    // Remove custom admin email
    const removeBtn = screen.getByRole('button', { name: /remove/i })
    await user.click(removeBtn)

    expect(screen.queryByText('newadmin@example.com')).not.toBeInTheDocument()
  })
})
