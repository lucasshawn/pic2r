import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme, isAdmin, customAdminEmails, addAdminEmail, removeAdminEmail } = useAuth()
  const [newEmail, setNewEmail] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newEmail.trim()
    if (!trimmed) {
      setError('Please enter an email address')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmed)) {
      setError('Please enter a valid email address')
      return
    }

    addAdminEmail(trimmed)
    setNewEmail('')
    setError('')
  }

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div
        className="settings-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="settings-modal-header">
          <h2>Settings</h2>
          <button
            type="button"
            className="settings-modal-close"
            onClick={onClose}
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        <div className="settings-section">
          <h3>Appearance</h3>
          <div className="settings-theme-options">
            <label>
              <input
                type="radio"
                name="theme"
                value="light"
                checked={theme === 'light'}
                onChange={() => setTheme('light')}
              />
              Light Mode
            </label>
            <label>
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={theme === 'dark'}
                onChange={() => setTheme('dark')}
              />
              Dark Mode
            </label>
          </div>
        </div>

        {isAdmin && (
          <div className="settings-section">
            <h3>Manage Admins</h3>
            <form onSubmit={handleAddAdmin} className="admin-email-form">
              <input
                type="text"
                placeholder="Enter email address"
                value={newEmail}
                onChange={(e) => {
                  setNewEmail(e.target.value)
                  if (error) setError('')
                }}
                aria-label="Admin email address"
              />
              <button type="submit">Add Admin</button>
            </form>
            {error && <p className="form-error">{error}</p>}

            {customAdminEmails.length > 0 && (
              <div className="admin-email-list">
                {customAdminEmails.map((email) => (
                  <div key={email} className="admin-email-item">
                    <span>{email}</span>
                    <button type="button" onClick={() => removeAdminEmail(email)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
