import React, { createContext, useContext, useState, useCallback } from 'react'

export interface UserProfile {
  email: string
  name: string
  picture?: string
  isAdmin: boolean
}

export interface AuthContextType {
  user: UserProfile | null
  isAdmin: boolean
  mockDevLogin: (email: string, name?: string) => void
  loginWithGoogleCredential: (credentialToken: string) => void
  logout: () => void
}

const STORAGE_KEY = 'pic2r_auth_user'

export function isEmailAdmin(email: string): boolean {
  const adminEmailsEnv = import.meta.env.VITE_ADMIN_EMAILS || ''
  if (!adminEmailsEnv.trim()) return false
  const adminList = adminEmailsEnv
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean)
  return adminList.includes(email.trim().toLowerCase())
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
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed && typeof parsed === 'object' && parsed.email) {
          return {
            ...parsed,
            isAdmin: isEmailAdmin(parsed.email),
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse user from localStorage:', e)
    }
    return null
  })

  const mockDevLogin = useCallback((email: string, name?: string) => {
    const emailTrimmed = email.trim()
    const nameTrimmed = name?.trim() || emailTrimmed.split('@')[0]
    const isAdmin = isEmailAdmin(emailTrimmed)
    const profile: UserProfile = {
      email: emailTrimmed,
      name: nameTrimmed,
      isAdmin,
    }
    setUser(profile)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  }, [])

  const loginWithGoogleCredential = useCallback((credentialToken: string) => {
    const payload = parseJwt(credentialToken)
    const email = (payload.email || '').trim()
    const name = (payload.name || email.split('@')[0] || 'Google User').trim()
    const picture = payload.picture
    const isAdmin = isEmailAdmin(email)
    const profile: UserProfile = {
      email,
      name,
      picture,
      isAdmin,
    }
    setUser(profile)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const isAdmin = user ? user.isAdmin : false

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
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
