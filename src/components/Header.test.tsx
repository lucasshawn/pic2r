import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
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

  it('renders title ("Before and Afters") and Google Sign-In button when user is logged out', () => {
    render(
      <AuthProvider>
        <Header />
      </AuthProvider>
    )

    expect(screen.getByRole('heading', { name: /before and afters/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument()
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
  })
})
