# Design Spec: Settings Panel, Guest Badge, Admin Management, and Dark Mode

## Overview
This specification details the design for:
1. Displaying a "Guest" badge in the header when logged out.
2. Adding a "Settings" button in the header that opens a Settings modal dialog.
3. Light / Dark mode theme selection for all users (Guest, Reader, Admin), persisted in `localStorage`.
4. Admin Email Management in the Settings modal for Admin users, allowing admins to dynamically grant admin privileges to additional email addresses.

---

## 1. Header & Guest User Badge (`src/components/Header.tsx`)
- **Logged-Out State**: Render `<span className="guest-badge">Guest</span>` next to the Google Sign-In button.
- **Settings Button**: Render `<button type="button" className="btn-settings" onClick={onOpenSettings}>⚙️ Settings</button>` in the header.

---

## 2. Auth Context & Admin Email Management (`src/context/AuthContext.tsx`)
- **Dynamic Admin Emails**: Maintain `extraAdminEmails` state initialized from `localStorage` (`pic2r_admin_emails`).
- `isAdmin`: Checked against `VITE_ADMIN_EMAILS` array OR `extraAdminEmails` array.
- Function `addAdminEmail(email: string): void`: Adds `email` to `extraAdminEmails` and persists to `localStorage`.
- Function `removeAdminEmail(email: string): void`: Removes custom added `email`.

---

## 3. Theme Context / Dark Mode Support (`src/context/ThemeContext.tsx` or `AuthContext.tsx`)
- State `theme`: `'light' | 'dark'`, initialized from `localStorage` (`pic2r_theme`) or system `prefers-color-scheme`.
- `setTheme(theme: 'light' | 'dark')`: Persists to `localStorage` and sets `data-theme="dark"` attribute on `document.documentElement` (`<html>`).

### Dark Mode Styling (`src/styles.css`)
- Define CSS variable root tokens:
  ```css
  :root {
    --bg-page: #f8fafc;
    --bg-card: #ffffff;
    --text-primary: #172033;
    --text-secondary: #5d687a;
    --border-color: #d9dfeb;
    --input-bg: #ffffff;
  }
  [data-theme="dark"] {
    --bg-page: #0f172a;
    --bg-card: #1e293b;
    --text-primary: #f8fafc;
    --text-secondary: #94a3b8;
    --border-color: #334155;
    --input-bg: #0f172a;
  }
  ```
- Use variables for body background, cards, header, forms, dropzones, and text.

---

## 4. Settings Modal Component (`src/components/SettingsModal.tsx`)
- **Header**: "Settings" title with close (X) button.
- **Section 1: Theme Preference (All Users)**:
  - Radio buttons / toggle: "Light Mode" vs "Dark Mode".
- **Section 2: Manage Admin Emails (Admin Users Only)**:
  - Input field for email address + "Add Admin" button.
  - List of allowed admin emails with remove buttons for custom added emails.

---

## Testing Plan
1. **Unit Tests**:
   - `src/components/Header.test.tsx`: Test Guest badge rendering when logged out, and Settings button presence.
   - `src/components/SettingsModal.test.tsx`: Test theme toggling and admin email addition/removal.
   - `src/context/AuthContext.test.tsx`: Test custom added admin emails granting `isAdmin === true`.
2. **Integration Tests**:
   - `src/App.test.tsx`: Test opening settings modal, toggling theme, and adding an admin email.
