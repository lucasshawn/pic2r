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

  it('renders title ("Picture Catalog") and login controls when user is logged out', () => {
    render(
      <AuthProvider>
        <Header />
      </AuthProvider>
    )

    expect(screen.getByRole('heading', { name: /picture catalog/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /dev admin login/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /dev reader login/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument()
  })

  it('logs in as Admin user via Dev Admin Login control and displays Admin badge', async () => {
    const user = userEvent.setup()
    render(
      <AuthProvider>
        <Header />
      </AuthProvider>
    )

    await user.click(screen.getByRole('button', { name: /dev admin login/i }))

    expect(screen.getByText('Dev Admin')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /dev admin login/i })).not.toBeInTheDocument()
  })

  it('logs in as Read-Only user via Dev Reader Login control and displays Read-Only badge', async () => {
    const user = userEvent.setup()
    render(
      <AuthProvider>
        <Header />
      </AuthProvider>
    )

    await user.click(screen.getByRole('button', { name: /dev reader login/i }))

    expect(screen.getByText('Dev Reader')).toBeInTheDocument()
    expect(screen.getByText('Read-Only')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })

  it('allows logging in with a custom dev email', async () => {
    const user = userEvent.setup()
    render(
      <AuthProvider>
        <Header />
      </AuthProvider>
    )

    const emailInput = screen.getByPlaceholderText(/enter dev email/i)
    await user.type(emailInput, 'admin@example.com')
    await user.click(screen.getByRole('button', { name: /^login$/i }))

    expect(screen.getByText('admin')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('logs out the user when Sign Out button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <AuthProvider>
        <Header />
      </AuthProvider>
    )

    await user.click(screen.getByRole('button', { name: /dev admin login/i }))
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /sign out/i }))

    expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /dev admin login/i })).toBeInTheDocument()
  })
})
