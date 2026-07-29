import React, { useState, useEffect, useRef } from 'react'
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

export interface HeaderProps {
  onOpenSettings?: () => void
}

export function Header({ onOpenSettings }: HeaderProps = {}) {
  const { user, isAdmin, loginWithGoogleCredential, logout } = useAuth()
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const loginWithGoogleCredentialRef = useRef(loginWithGoogleCredential)

  useEffect(() => {
    loginWithGoogleCredentialRef.current = loginWithGoogleCredential
  }, [loginWithGoogleCredential])

  useEffect(() => {
    if (!clientId || typeof window === 'undefined') return

    let isInitialized = false

    function renderGoogleBtn() {
      if (window.google?.accounts?.id && !isInitialized) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response: any) => {
              if (response?.credential) {
                loginWithGoogleCredentialRef.current(response.credential)
              }
            },
          })
          isInitialized = true
          const btnParent = document.getElementById('google-signin-btn')
          if (btnParent) {
            btnParent.innerHTML = ''
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
    }

    if (window.google?.accounts?.id) {
      renderGoogleBtn()
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval)
          renderGoogleBtn()
        }
      }, 100)
      return () => clearInterval(interval)
    }
  }, [clientId])

  return (
    <header className="app-header">
      <div className="header-brand">
        <h1 className="header-title">
          <a href="#" className="header-title-link">Before and Afters</a>
        </h1>
      </div>
      <div className="header-auth">
        <button
          type="button"
          className="btn-settings"
          onClick={onOpenSettings}
          aria-label="Open settings"
        >
          ⚙️ Settings
        </button>
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
            <span className="guest-badge">Guest</span>
            <div id="google-signin-btn" className="google-signin-container">
              <button
                type="button"
                className="google-btn-fallback"
                onClick={() => {
                  if (clientId && window.google?.accounts?.id) {
                    window.google.accounts.id.prompt()
                  } else if (!clientId) {
                    alert('Google Authentication requires setting VITE_GOOGLE_CLIENT_ID in environment variables.')
                  }
                }}
              >
                <svg className="google-icon" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
