# Design Specification: Google Auth & Read-Only Admin Lockdown

## Overview
This feature locks down the Picture Catalog web application to **read-only mode** for standard visitors and non-admins. Admin status is granted by logging in via Google Auth, matching the authenticated email against a configured list of admin emails (`VITE_ADMIN_EMAILS`).

When authenticated as an admin, all catalog and photo set management capabilities (creating albums, uploading photo sets, deleting photo sets) are revealed in the UI.

---

## 1. Authentication Architecture & State Management

### `AuthContext` (`src/context/AuthContext.tsx`)
- Provides user authentication state across the React component tree.
- State structure:
  ```typescript
  export interface UserProfile {
    email: string
    name: string
    picture?: string
    isAdmin: boolean
  }

  export interface AuthContextType {
    user: UserProfile | null
    isAdmin: boolean
    loginWithGoogleCredential: (credentialResponse: string) => void
    mockDevLogin: (email?: string) => void
    logout: () => void
  }
  ```

### Admin Email Resolution
- Reads `import.meta.env.VITE_ADMIN_EMAILS` (comma-separated, case-insensitive).
- Decodes Google JWT ID tokens (using `jwt-decode` or standard base64 payload decoding).
- Evaluates `isAdmin`:
  ```typescript
  const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
  const isAdmin = adminEmails.includes(userEmail.toLowerCase())
  ```

### Session Persistence
- Persists active `user` in `localStorage` under key `pic2r_auth_user`.
- On application load, checks `localStorage` and restores user session.

### Dev Mode & Google Client ID Fallback
- Configured via `import.meta.env.VITE_GOOGLE_CLIENT_ID`.
- If `VITE_GOOGLE_CLIENT_ID` is present and valid, renders standard Google OAuth Sign-In button (`@react-oauth/google` / Google Identity Services).
- If `VITE_GOOGLE_CLIENT_ID` is absent or set to `mock` in development environment, renders a "Dev Login (Admin / Visitor)" toggle to facilitate rapid offline testing.

---

## 2. UI Component Modifications & Read-Only Lockdown

### Application Shell (`src/App.tsx`)
- Wraps application in `AuthProvider`.
- Renders header bar containing:
  - App title ("Picture Catalog").
  - Navigation / Album breadcrumbs.
  - Auth widget: Google Login button or User Profile badge (Avatar, Name, Admin tag, and Sign Out button).

### Catalog Page (`src/components/CatalogPage.tsx`)
- **Non-Admin**: Renders list of existing albums. `AlbumForm` (Create New Album) is hidden.
- **Admin**: Renders list of existing albums and `AlbumForm`.

### Album Page (`src/components/AlbumPage.tsx`)
- **Non-Admin**: Renders album title, description, and list of photo sets. `DropZone` and `PhotoSetForm` (Upload Photo Set) are hidden.
- **Admin**: Renders full album page with `DropZone` and `PhotoSetForm`.

### Photo Set & Deletion (`src/components/ThumbnailPair.tsx`)
- **Non-Admin**: Photo set cards render image pairs and metadata without hover action overlays for deletion.
- **Admin**: Photo set cards render hover delete action and trigger `DeletePhotoSetDialog`.

---

## 3. Configuration & Environment Variables

Updated `.env.example`:
```env
# Google OAuth 2.0 Client ID (from Google Cloud Console)
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Comma-separated list of admin email addresses
VITE_ADMIN_EMAILS=admin@example.com,user@example.com
```

---

## 4. Verification Plan

- **Unit Tests**:
  - Test `AuthContext` admin email resolution logic (case-insensitivity, trim, multi-email support).
  - Test `App.test.tsx` in non-admin mode: assert `AlbumForm`, `DropZone`, and delete buttons are NOT present in the DOM.
  - Test `App.test.tsx` in admin mode: assert `AlbumForm`, `DropZone`, and delete buttons ARE present in the DOM.
- **Integration Tests**:
  - Verify login/logout flow restores and clears session in `localStorage`.
