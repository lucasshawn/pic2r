# Design Spec: Backend R2 Admin Email Synchronization

## Overview
This specification details the server-side persistence of authorized admin email addresses to Cloudflare R2 (`catalog/admins.json`). This ensures that when an admin adds an email address in the Settings panel, that email address is recognized as an Admin across all devices, browsers, and user sessions.

---

## 1. Backend API & R2 Storage (`netlify/functions/api.ts`)

### Storage
- Storage Key in R2: `catalog/admins.json`
- Format: `string[]` (e.g. `["admin1@gmail.com", "admin2@gmail.com"]`).

### API Endpoints
- `GET /api/admins`: Returns JSON array of custom authorized admin emails.
- `POST /api/admins`: Body `{ email: string }`. Appends trimmed lowercased email to `catalog/admins.json` in R2 and returns updated array.
- `DELETE /api/admins/:email`: Removes the specified email from `catalog/admins.json` in R2 and returns updated array.

---

## 2. Repository Functions (`src/catalogRepository.ts`)
- `listCustomAdminEmails(): Promise<string[]>`: Fetches `GET /api/admins`.
- `addCustomAdminEmail(email: string): Promise<string[]>`: Posts `POST /api/admins` with body `{ email }`.
- `removeCustomAdminEmail(email: string): Promise<string[]>`: Sends `DELETE /api/admins/${encodeURIComponent(email)}`.

---

## 3. AuthContext Integration (`src/context/AuthContext.tsx`)
- On `AuthProvider` mount, call `listCustomAdminEmails()`, update `customAdminEmails` state, and sync to `localStorage` fallback.
- In `addAdminEmail(email)`: Call `addCustomAdminEmail(email)` to persist to R2, then update `customAdminEmails` state and `localStorage`.
- In `removeAdminEmail(email)`: Call `removeCustomAdminEmail(email)` to persist to R2, then update `customAdminEmails` state and `localStorage`.
- In `loginWithGoogleCredential(token)`: Call `listCustomAdminEmails()` upon sign-in to ensure the latest server-side admin list is evaluated before setting `isAdmin` status.

---

## Testing Plan
1. **Unit Tests**:
   - `src/test/api.test.ts`: Test `GET /api/admins`, `POST /api/admins`, and `DELETE /api/admins/:email`.
   - `src/catalogRepository.test.ts`: Test `listCustomAdminEmails`, `addCustomAdminEmail`, and `removeCustomAdminEmail`.
   - `src/context/AuthContext.test.tsx`: Test fetching custom admin emails from backend and verifying cross-session admin status.
2. **Integration Tests**:
   - `src/App.test.tsx`: Test adding an admin email and logging in as that user.
