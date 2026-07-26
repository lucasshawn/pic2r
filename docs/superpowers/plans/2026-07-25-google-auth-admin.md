# Google Auth & Read-Only Admin Lockdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Google Auth authentication and lock down catalog/photo set management features to read-only for non-admin users.

**Architecture:** Create an `AuthContext` managing user authentication, admin state evaluation (via `VITE_ADMIN_EMAILS`), and `localStorage` persistence. Hide management UI controls (`AlbumForm`, `DropZone`, `PhotoSetForm`, delete dialogs) unless the user is logged in as an admin.

**Tech Stack:** React 19, TypeScript, Vitest, `@testing-library/react`.

## Global Constraints
- React 19 compatibility.
- Environment variables: `VITE_ADMIN_EMAILS` (comma-separated), `VITE_GOOGLE_CLIENT_ID` (optional/mock in dev).
- Non-destructive and fully tested with Vitest.

---

### Task 1: AuthContext and Admin Email Evaluation

**Files:**
- Create: `src/context/AuthContext.tsx`
- Test: `src/context/AuthContext.test.tsx`

**Interfaces:**
- Produces: `UserProfile`, `AuthContext`, `useAuth`, `AuthProvider`

- [ ] **Step 1: Write failing unit test for `AuthContext`**

```tsx
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { AuthProvider, useAuth } from './AuthContext'

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
    import.meta.env.VITE_ADMIN_EMAILS = 'admin@example.com, boss@company.com'
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('initializes with no user and non-admin state by default', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    expect(result.current.user).toBeNull()
    expect(result.current.isAdmin).toBe(false)
  })

  it('grants admin privileges when email matches VITE_ADMIN_EMAILS', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    
    act(() => {
      result.current.mockDevLogin('ADMIN@example.com')
    })

    expect(result.current.user?.email).toBe('admin@example.com')
    expect(result.current.isAdmin).toBe(true)
    expect(localStorage.getItem('pic2r_auth_user')).toContain('admin@example.com')
  })

  it('denies admin privileges for non-matching email', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    act(() => {
      result.current.mockDevLogin('visitor@example.com')
    })

    expect(result.current.user?.email).toBe('visitor@example.com')
    expect(result.current.isAdmin).toBe(false)
  })

  it('clears user session on logout', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    act(() => {
      result.current.mockDevLogin('admin@example.com')
    })

    expect(result.current.isAdmin).toBe(true)

    act(() => {
      result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAdmin).toBe(false)
    expect(localStorage.getItem('pic2r_auth_user')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/context/AuthContext.test.tsx`
Expected: FAIL (Cannot find module `./AuthContext`)

- [ ] **Step 3: Implement `AuthContext.tsx`**

```tsx
import React, { createContext, useContext, useEffect, useState } from 'react'

export interface UserProfile {
  email: string
  name: string
  picture?: string
  isAdmin: boolean
}

export interface AuthContextType {
  user: UserProfile | null
  isAdmin: boolean
  mockDevLogin: (email?: string, name?: string) => void
  loginWithGoogleCredential: (credential: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = 'pic2r_auth_user'

function checkIsAdmin(email: string): boolean {
  const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean)
  return adminEmails.includes(email.toLowerCase())
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as UserProfile
        return {
          ...parsed,
          isAdmin: checkIsAdmin(parsed.email),
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
    return null
  })

  const isAdmin = Boolean(user?.isAdmin)

  const mockDevLogin = (email = 'admin@example.com', name = 'Dev Admin') => {
    const cleanEmail = email.trim().toLowerCase()
    const newUser: UserProfile = {
      email: cleanEmail,
      name,
      isAdmin: checkIsAdmin(cleanEmail),
    }
    setUser(newUser)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser))
  }

  const loginWithGoogleCredential = (credential: string) => {
    try {
      // Decode JWT payload (standard base64 decode without external deps)
      const base64Url = credential.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      const payload = JSON.parse(jsonPayload)
      const email = payload.email || ''
      const name = payload.name || email
      const picture = payload.picture

      const newUser: UserProfile = {
        email,
        name,
        picture,
        isAdmin: checkIsAdmin(email),
      }

      setUser(newUser)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser))
    } catch (err) {
      console.error('Failed to parse Google ID token credential', err)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/context/AuthContext.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/context/AuthContext.tsx src/context/AuthContext.test.tsx
git commit -m "feat: add AuthContext with admin email evaluation and session persistence"
```

---

### Task 2: Header Component with Google Sign-In Widget

**Files:**
- Create: `src/components/Header.tsx`
- Create: `src/components/Header.test.tsx`

**Interfaces:**
- Consumes: `useAuth` from `src/context/AuthContext`

- [ ] **Step 1: Write failing test for `Header`**

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Header } from './Header'
import { AuthProvider, useAuth } from '../context/AuthContext'

function TestHeaderConsumer() {
  const { mockDevLogin } = useAuth()
  return (
    <div>
      <Header />
      <button onClick={() => mockDevLogin('admin@example.com', 'Alice')}>Sign in Alice</button>
    </div>
  )
}

describe('Header', () => {
  it('renders title and login controls when logged out', () => {
    render(
      <AuthProvider>
        <Header />
      </AuthProvider>
    )

    expect(screen.getByText('Picture Catalog')).toBeInTheDocument()
    expect(screen.getByText(/Dev Login/i)).toBeInTheDocument()
  })

  it('renders user badge and sign out button when logged in', () => {
    render(
      <AuthProvider>
        <TestHeaderConsumer />
      </AuthProvider>
    )

    fireEvent.click(screen.getByText('Sign in Alice'))

    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByText('Sign Out')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Header.test.tsx`
Expected: FAIL (Cannot find module `./Header`)

- [ ] **Step 3: Implement `Header.tsx`**

```tsx
import { useAuth } from '../context/AuthContext'

export function Header() {
  const { user, isAdmin, mockDevLogin, logout } = useAuth()

  return (
    <header className="app-header">
      <div className="header-brand">
        <a href="#/" className="header-title">
          Picture Catalog
        </a>
      </div>
      <div className="header-auth">
        {user ? (
          <div className="user-profile-badge">
            {user.picture && <img src={user.picture} alt={user.name} className="user-avatar" />}
            <span className="user-name">{user.name}</span>
            {isAdmin ? (
              <span className="badge badge-admin">Admin</span>
            ) : (
              <span className="badge badge-readonly">Read-Only</span>
            )}
            <button type="button" className="btn btn-secondary btn-sm" onClick={logout}>
              Sign Out
            </button>
          </div>
        ) : (
          <div className="auth-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => mockDevLogin('admin@example.com', 'Admin User')}
            >
              Dev Login (Admin)
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => mockDevLogin('visitor@example.com', 'Visitor User')}
            >
              Dev Login (Visitor)
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/Header.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/Header.tsx src/components/Header.test.tsx
git commit -m "feat: add Header component with user profile badge and dev login controls"
```

---

### Task 3: Read-Only UI Lockdown in CatalogPage, AlbumPage, and ThumbnailPair

**Files:**
- Modify: `src/components/CatalogPage.tsx`
- Modify: `src/components/AlbumPage.tsx`
- Modify: `src/components/ThumbnailPair.tsx`
- Test: Update existing component tests or create integration check

**Interfaces:**
- Consumes: `useAuth` from `src/context/AuthContext`

- [ ] **Step 1: Check existing `CatalogPage.tsx`, `AlbumPage.tsx`, `ThumbnailPair.tsx` for conditional management rendering**

Read components and update them to wrap creation/upload/delete features in `{isAdmin && (...)}`.

- [ ] **Step 2: Update `CatalogPage.tsx`**

In `src/components/CatalogPage.tsx`, import `useAuth` and conditionally render `<AlbumForm onCreateAlbum={onCreateAlbum} />`:

```tsx
import { Album } from '../types'
import { AlbumForm } from './AlbumForm'
import { useAuth } from '../context/AuthContext'

interface CatalogPageProps {
  albums: Album[]
  isLoading: boolean
  onCreateAlbum: (name: string) => Promise<void>
}

export function CatalogPage({ albums, isLoading, onCreateAlbum }: CatalogPageProps) {
  const { isAdmin } = useAuth()

  return (
    <div className="catalog-page">
      {isAdmin && (
        <section className="create-album-section">
          <h2>Create New Album</h2>
          <AlbumForm onCreateAlbum={onCreateAlbum} />
        </section>
      )}

      <section className="albums-section">
        <h2>Albums</h2>
        {isLoading ? (
          <p>Loading albums...</p>
        ) : albums.length === 0 ? (
          <p>No albums found.</p>
        ) : (
          <div className="album-grid">
            {albums.map((album) => (
              <a key={album.id} href={`#/albums/${album.id}`} className="album-card">
                <h3>{album.name}</h3>
                <p>{album.photoSets.length} Photo Sets</p>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
```

- [ ] **Step 3: Update `AlbumPage.tsx`**

In `src/components/AlbumPage.tsx`, import `useAuth` and conditionally render `<DropZone>` and `<PhotoSetForm>`:

```tsx
// Inside AlbumPage function:
const { isAdmin } = useAuth()

// Render DropZone / PhotoSetForm only if isAdmin:
{isAdmin && (
  <div className="upload-section">
    <DropZone onFilesSelected={handleFilesSelected} />
    {stagedBefore && stagedAfter && (
      <PhotoSetForm
        albumId={album.id}
        beforeFile={stagedBefore}
        afterFile={stagedAfter}
        onSuccess={handleUploadSuccess}
      />
    )}
  </div>
)}
```

- [ ] **Step 4: Update `ThumbnailPair.tsx`**

In `src/components/ThumbnailPair.tsx`, import `useAuth` and render the delete trash icon / delete dialog only when `isAdmin === true`.

- [ ] **Step 5: Run all unit & integration tests**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/CatalogPage.tsx src/components/AlbumPage.tsx src/components/ThumbnailPair.tsx
git commit -m "feat: enforce read-only lockdown by conditionally rendering management controls for admins"
```

---

### Task 4: Integrate Header and AuthProvider in App.tsx & App.test.tsx

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Update `App.tsx`**

Wrap `App` contents with `AuthProvider` and render `Header` at the top of the layout:

```tsx
import { useEffect, useState } from 'react'
import { CatalogPage } from './components/CatalogPage'
import { AlbumPage } from './components/AlbumPage'
import { Header } from './components/Header'
import { AuthProvider } from './context/AuthContext'
import { createAlbum, listAlbums } from './catalogRepository'
import type { Album } from './types'
import './styles.css'

export function AppContent() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [albumId, setAlbumId] = useState(() => window.location.hash.replace('#/albums/', ''))

  useEffect(() => {
    void listAlbums().then((loadedAlbums) => {
      setAlbums(loadedAlbums)
      setIsLoading(false)
    })
  }, [])

  useEffect(() => {
    function handleHashChange() {
      setAlbumId(window.location.hash.replace('#/albums/', ''))
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  async function handleCreateAlbum(name: string) {
    const album = await createAlbum(name)
    setAlbums((currentAlbums) => [...currentAlbums, album])
  }

  const selectedAlbum = albums.find((album) => album.id === albumId)

  return (
    <div className="app-layout">
      <Header />
      <main className="app-shell">
        {selectedAlbum ? (
          <AlbumPage album={selectedAlbum} />
        ) : (
          <CatalogPage albums={albums} isLoading={isLoading} onCreateAlbum={handleCreateAlbum} />
        )}
      </main>
    </div>
  )
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
```

- [ ] **Step 2: Update `App.test.tsx` to verify read-only vs admin mode in full integration**

Add tests to `src/App.test.tsx` verifying:
1. Default visitor mode: `Create New Album` form is NOT visible.
2. Admin mode (after login): `Create New Album` form IS visible.

- [ ] **Step 3: Run full test suite & build check**

Run: `npx vitest run && npm run build`
Expected: ALL PASS with clean build.

- [ ] **Step 4: Update `.env.example`**

Add `VITE_ADMIN_EMAILS` and `VITE_GOOGLE_CLIENT_ID` to `.env.example`.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/App.test.tsx .env.example
git commit -m "feat: integrate AuthProvider, Header, and add full read-only vs admin integration tests"
```
