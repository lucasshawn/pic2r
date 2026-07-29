import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { listCustomAdminEmails, addCustomAdminEmail, removeCustomAdminEmail } from '../catalogRepository'

export type Theme = 'light' | 'dark'

export interface UserProfile {
  email: string
  name: string
  picture?: string
  isAdmin: boolean
}

export interface AuthContextType {
  user: UserProfile | null
  isAdmin: boolean
  theme: Theme
  customAdminEmails: string[]
  setTheme: (theme: Theme) => void
  addAdminEmail: (email: string) => Promise<void> | void
  removeAdminEmail: (email: string) => Promise<void> | void
  mockDevLogin: (email: string, name?: string) => void
  loginWithGoogleCredential: (credentialToken: string) => Promise<void> | void
  logout: () => void
}

const STORAGE_KEY = 'pic2r_auth_user'

export function isEmailAdmin(email: string, customAdminEmails: string[] = []): boolean {
  const adminEmailsEnv = import.meta.env.VITE_ADMIN_EMAILS || ''
  const adminList = adminEmailsEnv
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean)
  const trimmed = email.trim().toLowerCase()
  if (!trimmed) return false
  const customList = customAdminEmails.map((e: string) => e.trim().toLowerCase()).filter(Boolean)
  return adminList.includes(trimmed) || customList.includes(trimmed)
}

function parseJwt(token: string): any {
  const parts = token.split('.')
  if (parts.length < 2) {
    throw new Error('Invalid JWT token format')
  }
  const base64Url = parts[1]
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  )
  return JSON.parse(jsonPayload)
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('pic2r_theme')
    if (stored === 'dark' || stored === 'light') {
      return stored
    }
    return 'light'
  })

  useEffect(() => {
    localStorage.setItem('pic2r_theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const [customAdminEmails, setCustomAdminEmails] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('pic2r_admin_emails')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          return parsed.map((e: string) => e.trim().toLowerCase()).filter(Boolean)
        }
      }
    } catch (e) {
      console.error('Failed to parse custom admin emails from localStorage:', e)
    }
    return []
  })

  useEffect(() => {
    let isMounted = true
    listCustomAdminEmails()
      .then((emails) => {
        if (!isMounted) return
        const cleaned = emails.map((e: string) => e.trim().toLowerCase()).filter(Boolean)
        setCustomAdminEmails(cleaned)
        localStorage.setItem('pic2r_admin_emails', JSON.stringify(cleaned))
      })
      .catch((e) => {
        console.error('Failed to fetch custom admin emails on mount:', e)
      })
    return () => {
      isMounted = false
    }
  }, [])

  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed && typeof parsed === 'object' && parsed.email) {
          return parsed
        }
      }
    } catch (e) {
      console.error('Failed to parse user from localStorage:', e)
    }
    return null
  })

  const addAdminEmail = useCallback(async (email: string) => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) return
    try {
      const updated = await addCustomAdminEmail(trimmed)
      const cleaned = updated.map((e: string) => e.trim().toLowerCase()).filter(Boolean)
      setCustomAdminEmails(cleaned)
      localStorage.setItem('pic2r_admin_emails', JSON.stringify(cleaned))
    } catch (e) {
      console.error('Failed to add custom admin email:', e)
    }
  }, [])

  const removeAdminEmail = useCallback(async (email: string) => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) return
    try {
      const updated = await removeCustomAdminEmail(trimmed)
      const cleaned = updated.map((e: string) => e.trim().toLowerCase()).filter(Boolean)
      setCustomAdminEmails(cleaned)
      localStorage.setItem('pic2r_admin_emails', JSON.stringify(cleaned))
    } catch (e) {
      console.error('Failed to remove custom admin email:', e)
    }
  }, [])

  const mockDevLogin = useCallback(
    (email: string, name?: string) => {
      const emailTrimmed = email.trim()
      const nameTrimmed = name?.trim() || emailTrimmed.split('@')[0]
      const adminStatus = isEmailAdmin(emailTrimmed, customAdminEmails)
      const profile: UserProfile = {
        email: emailTrimmed,
        name: nameTrimmed,
        isAdmin: adminStatus,
      }
      setUser(profile)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
    },
    [customAdminEmails]
  )

  const loginWithGoogleCredential = useCallback(
    async (credentialToken: string) => {
      const payload = parseJwt(credentialToken)
      const email = (payload.email || '').trim()
      const name = (payload.name || email.split('@')[0] || 'Google User').trim()
      const picture = payload.picture

      let currentCustomEmails = customAdminEmails
      try {
        const fetchedEmails = await listCustomAdminEmails()
        const cleaned = fetchedEmails.map((e: string) => e.trim().toLowerCase()).filter(Boolean)
        setCustomAdminEmails(cleaned)
        localStorage.setItem('pic2r_admin_emails', JSON.stringify(cleaned))
        currentCustomEmails = cleaned
      } catch (e) {
        console.error('Failed to fetch custom admin emails on login:', e)
      }

      const adminStatus = isEmailAdmin(email, currentCustomEmails)
      const profile: UserProfile = {
        email,
        name,
        picture,
        isAdmin: adminStatus,
      }
      setUser(profile)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
    },
    [customAdminEmails]
  )

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const isAdmin = user ? isEmailAdmin(user.email, customAdminEmails) : false
  const effectiveUser = user ? { ...user, isAdmin } : null

  return (
    <AuthContext.Provider
      value={{
        user: effectiveUser,
        isAdmin,
        theme,
        customAdminEmails,
        setTheme,
        addAdminEmail,
        removeAdminEmail,
        mockDevLogin,
        loginWithGoogleCredential,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

