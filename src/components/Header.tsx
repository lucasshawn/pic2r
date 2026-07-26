import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void
          renderButton: (parent: HTMLElement, options: any) => void
        }
      }
    }
  }
}

export function Header() {
  const { user, isAdmin, mockDevLogin, loginWithGoogleCredential, logout } = useAuth()
  const [devEmail, setDevEmail] = useState('')

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (typeof window !== 'undefined' && window.google?.accounts?.id && clientId) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            if (response?.credential) {
              loginWithGoogleCredential(response.credential)
            }
          },
        })
        const btnParent = document.getElementById('google-signin-btn')
        if (btnParent) {
          window.google.accounts.id.renderButton(btnParent, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
          })
        }
      } catch (e) {
        console.error('Failed to initialize Google Sign-In:', e)
      }
    }
  }, [loginWithGoogleCredential])

  const handleDevSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (devEmail.trim()) {
      mockDevLogin(devEmail.trim())
      setDevEmail('')
    }
  }

  return (
    <header className="app-header">
      <div className="header-brand">
        <h1 className="header-title">Picture Catalog</h1>
      </div>
      <div className="header-auth">
        {user ? (
          <div className="user-profile-badge">
            {user.picture && (
              <img src={user.picture} alt={user.name} className="user-avatar" />
            )}
            <span className="user-name">{user.name}</span>
            <span className={`role-badge ${isAdmin ? 'role-admin' : 'role-readonly'}`}>
              {isAdmin ? 'Admin' : 'Read-Only'}
            </span>
            <button onClick={logout} className="signout-button">
              Sign Out
            </button>
          </div>
        ) : (
          <div className="login-controls">
            <div id="google-signin-btn" className="google-signin-container"></div>
            <div className="dev-login-section">
              <span className="dev-login-label">Dev:</span>
              <button
                type="button"
                className="dev-login-btn"
                onClick={() => mockDevLogin('admin@example.com', 'Dev Admin')}
              >
                Dev Admin Login
              </button>
              <button
                type="button"
                className="dev-login-btn"
                onClick={() => mockDevLogin('user@example.com', 'Dev Reader')}
              >
                Dev Reader Login
              </button>
              <form onSubmit={handleDevSubmit} className="dev-login-form">
                <input
                  type="email"
                  placeholder="Enter dev email..."
                  value={devEmail}
                  onChange={(e) => setDevEmail(e.target.value)}
                  className="dev-login-input"
                />
                <button type="submit" className="dev-login-submit">
                  Login
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
