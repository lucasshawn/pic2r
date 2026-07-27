import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AuthProvider, useAuth, UserProfile } from './AuthContext'

// Test helper component to consume useAuth
function TestConsumer() {
  const { user, isAdmin, theme, customAdminEmails, setTheme, addAdminEmail, removeAdminEmail, mockDevLogin, loginWithGoogleCredential, logout } = useAuth()
  return (
    <div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'null'}</div>
      <div data-testid="is-admin">{isAdmin ? 'true' : 'false'}</div>
      <div data-testid="theme">{theme}</div>
      <div data-testid="custom-admin-emails">{JSON.stringify(customAdminEmails)}</div>
      <button data-testid="btn-login-dev" onClick={() => mockDevLogin('admin@example.com', 'Admin User')}>
        Dev Login Admin
      </button>
      <button data-testid="btn-login-nonadmin" onClick={() => mockDevLogin('user@example.com', 'Regular User')}>
        Dev Login NonAdmin
      </button>
      <button data-testid="btn-login-custom" onClick={() => mockDevLogin('customadmin@example.com', 'Custom Admin')}>
        Dev Login Custom Admin
      </button>
      <button
        data-testid="btn-login-jwt"
        onClick={() => {
          const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
          const payload = btoa(
            JSON.stringify({
              email: 'admin@example.com',
              name: 'Google Admin',
              picture: 'https://example.com/photo.jpg',
            })
          )
            .replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
          loginWithGoogleCredential(`${header}.${payload}.signature`)
        }}
      >
        Google Login
      </button>
      <button data-testid="btn-set-theme-dark" onClick={() => setTheme('dark')}>
        Set Dark Theme
      </button>
      <button data-testid="btn-add-admin" onClick={() => addAdminEmail('customadmin@example.com')}>
        Add Custom Admin
      </button>
      <button data-testid="btn-remove-admin" onClick={() => removeAdminEmail('customadmin@example.com')}>
        Remove Custom Admin
      </button>
      <button data-testid="btn-logout" onClick={() => logout()}>
        Logout
      </button>
    </div>
  )
}

describe('AuthContext', () => {
  const originalEnv = import.meta.env.VITE_ADMIN_EMAILS

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    import.meta.env.VITE_ADMIN_EMAILS = 'admin@example.com, superuser@example.com'
  })

  afterEach(() => {
    import.meta.env.VITE_ADMIN_EMAILS = originalEnv
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('provides default state with null user and isAdmin: false', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    expect(screen.getByTestId('user').textContent).toBe('null')
    expect(screen.getByTestId('is-admin').textContent).toBe('false')
  })

  it('evaluates VITE_ADMIN_EMAILS case-insensitively and trimmed during mockDevLogin', () => {
    import.meta.env.VITE_ADMIN_EMAILS = ' admin@example.com , SUPERUSER@EXAMPLE.COM '

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    // Login as admin
    act(() => {
      screen.getByTestId('btn-login-dev').click()
    })

    const userObj: UserProfile = JSON.parse(screen.getByTestId('user').textContent!)
    expect(userObj.email).toBe('admin@example.com')
    expect(userObj.isAdmin).toBe(true)
    expect(screen.getByTestId('is-admin').textContent).toBe('true')

    // Login as non-admin
    act(() => {
      screen.getByTestId('btn-login-nonadmin').click()
    })

    const nonAdminObj: UserProfile = JSON.parse(screen.getByTestId('user').textContent!)
    expect(nonAdminObj.email).toBe('user@example.com')
    expect(nonAdminObj.isAdmin).toBe(false)
    expect(screen.getByTestId('is-admin').textContent).toBe('false')
  })

  it('persists user profile session in localStorage under pic2r_auth_user', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    act(() => {
      screen.getByTestId('btn-login-dev').click()
    })

    const stored = localStorage.getItem('pic2r_auth_user')
    expect(stored).not.toBeNull()
    const parsed = JSON.parse(stored!)
    expect(parsed.email).toBe('admin@example.com')
    expect(parsed.isAdmin).toBe(true)
  })

  it('initializes from localStorage on mount if pic2r_auth_user is present', () => {
    const initialUser: UserProfile = {
      email: 'superuser@example.com',
      name: 'Super User',
      isAdmin: true,
    }
    localStorage.setItem('pic2r_auth_user', JSON.stringify(initialUser))

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    expect(screen.getByTestId('user').textContent).toContain('superuser@example.com')
    expect(screen.getByTestId('is-admin').textContent).toBe('true')
  })

  it('decodes Google JWT token credential in loginWithGoogleCredential', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    act(() => {
      screen.getByTestId('btn-login-jwt').click()
    })

    const userObj: UserProfile = JSON.parse(screen.getByTestId('user').textContent!)
    expect(userObj.email).toBe('admin@example.com')
    expect(userObj.name).toBe('Google Admin')
    expect(userObj.picture).toBe('https://example.com/photo.jpg')
    expect(userObj.isAdmin).toBe(true)
  })

  it('clears user state and localStorage on logout', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    act(() => {
      screen.getByTestId('btn-login-dev').click()
    })
    expect(localStorage.getItem('pic2r_auth_user')).not.toBeNull()

    act(() => {
      screen.getByTestId('btn-logout').click()
    })

    expect(screen.getByTestId('user').textContent).toBe('null')
    expect(screen.getByTestId('is-admin').textContent).toBe('false')
    expect(localStorage.getItem('pic2r_auth_user')).toBeNull()
  })

  it('addAdminEmail adds email and grants isAdmin === true when logged in with that email', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    // Initially log in with customadmin@example.com (not in VITE_ADMIN_EMAILS)
    act(() => {
      screen.getByTestId('btn-login-custom').click()
    })

    expect(screen.getByTestId('is-admin').textContent).toBe('false')

    // Add email to custom admin list
    act(() => {
      screen.getByTestId('btn-add-admin').click()
    })

    expect(screen.getByTestId('is-admin').textContent).toBe('true')
    const userObj: UserProfile = JSON.parse(screen.getByTestId('user').textContent!)
    expect(userObj.isAdmin).toBe(true)
    expect(JSON.parse(screen.getByTestId('custom-admin-emails').textContent!)).toContain('customadmin@example.com')
    expect(localStorage.getItem('pic2r_admin_emails')).toContain('customadmin@example.com')

    // Remove email from custom admin list
    act(() => {
      screen.getByTestId('btn-remove-admin').click()
    })

    expect(screen.getByTestId('is-admin').textContent).toBe('false')
  })

  it('setTheme("dark") updates theme state and sets data-theme="dark" attribute on document.documentElement', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    expect(screen.getByTestId('theme').textContent).toBe('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')

    act(() => {
      screen.getByTestId('btn-set-theme-dark').click()
    })

    expect(screen.getByTestId('theme').textContent).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(localStorage.getItem('pic2r_theme')).toBe('dark')
  })

  it('throws an error if useAuth is used outside AuthProvider', () => {
    // Suppress console.error for expected error thrown in react component render
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TestConsumer />)).toThrow('useAuth must be used within an AuthProvider')
    consoleError.mockRestore()
  })
})

