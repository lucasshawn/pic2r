import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AuthProvider } from '../context/AuthContext'
import { Header } from './Header'

describe('Header Component', () => {
  const originalEnv = import.meta.env.VITE_ADMIN_EMAILS

  beforeEach(() => {
    localStorage.clear()
    import.meta.env.VITE_ADMIN_EMAILS = 'admin@example.com'
  })

  afterEach(() => {
    import.meta.env.VITE_ADMIN_EMAILS = originalEnv
    localStorage.clear()
  })

  it('renders title ("Before and Afters"), Guest badge, and Google Sign-In button when user is logged out', () => {
    render(
      <AuthProvider>
        <Header />
      </AuthProvider>
    )

    expect(screen.getByRole('heading', { name: /before and afters/i })).toBeInTheDocument()
    expect(screen.getByText('Guest')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument()
  })

  it('renders Before and Afters title as a link to home (#)', () => {
    render(
      <AuthProvider>
        <Header />
      </AuthProvider>
    )
    const link = screen.getByRole('link', { name: /before and afters/i })
    expect(link).toHaveAttribute('href', '#')
  })

  it('invokes onOpenSettings when Settings button is clicked', async () => {
    const handleOpenSettings = vi.fn()
    const user = userEvent.setup()
    render(
      <AuthProvider>
        <Header onOpenSettings={handleOpenSettings} />
      </AuthProvider>
    )

    const settingsBtn = screen.getByRole('button', { name: /open settings/i })
    expect(settingsBtn).toBeInTheDocument()
    await user.click(settingsBtn)
    expect(handleOpenSettings).toHaveBeenCalledTimes(1)
  })

  it('renders user profile badge and Sign Out button when user is logged in', () => {
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
        <Header />
      </AuthProvider>
    )

    expect(screen.getByText('Alice Admin')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /sign in with google/i })).not.toBeInTheDocument()
    expect(screen.queryByText('Guest')).not.toBeInTheDocument()
  })

  it('logs out the user when Sign Out button is clicked', async () => {
    const user = userEvent.setup()
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
        <Header />
      </AuthProvider>
    )

    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /sign out/i }))

    expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument()
    expect(screen.getByText('Guest')).toBeInTheDocument()
  })
})
