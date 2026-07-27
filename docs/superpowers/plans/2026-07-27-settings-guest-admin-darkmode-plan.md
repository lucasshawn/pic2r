# Settings Panel, Guest Badge, Admin Management, and Dark Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Guest user badge when logged out, a Settings modal button, Light/Dark theme switching, and dynamic Admin email authorization.

**Architecture:**
1. `AuthContext.tsx` is expanded to manage dynamic admin emails (`addAdminEmail`, `removeAdminEmail`) and theme state (`theme`, `setTheme`).
2. `Header.tsx` renders a `"Guest"` badge when logged out and a `"⚙️ Settings"` button for all users.
3. `SettingsModal.tsx` renders theme controls for all users, plus admin email management for admins.
4. `src/styles.css` incorporates CSS custom variables and `[data-theme="dark"]` rules for complete dark mode support.

**Tech Stack:** React, TypeScript, Vitest, CSS Custom Variables, `localStorage`.

## Global Constraints
- React 18 / Vite / TypeScript strict mode.
- Theme preference persisted in `localStorage` (`pic2r_theme`) and updated on `document.documentElement.setAttribute('data-theme', theme)`.
- Custom admin emails persisted in `localStorage` (`pic2r_admin_emails`).

---

### Task 1: AuthContext Dynamic Admin Emails & Theme Management

**Files:**
- Modify: `src/context/AuthContext.tsx`
- Modify: `src/context/AuthContext.test.tsx`

**Interfaces:**
- Produces: `addAdminEmail(email)`, `removeAdminEmail(email)`, `customAdminEmails`, `theme`, `setTheme(theme)` in `useAuth()` context.

- [ ] **Step 1: Write failing test in `src/context/AuthContext.test.tsx` for custom admin emails and theme**

```tsx
it('allows adding custom admin email that grants isAdmin status', () => {
  // Test adding admin email and verifying isAdmin becomes true for that email
})
it('allows setting and persisting light/dark theme', () => {
  // Test setting theme to dark and checking data-theme attribute
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/context/AuthContext.test.tsx`
Expected: FAIL

- [ ] **Step 3: Update `src/context/AuthContext.tsx`**

```tsx
export type Theme = 'light' | 'dark'

interface AuthContextType {
  user: User | null
  isAdmin: boolean
  theme: Theme
  customAdminEmails: string[]
  login: (email: string) => void
  logout: () => void
  setTheme: (theme: Theme) => void
  addAdminEmail: (email: string) => void
  removeAdminEmail: (email: string) => void
}

// Implement theme persistence, data-theme attribute on <html>, and custom admin email management
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/context/AuthContext.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/context/AuthContext.tsx src/context/AuthContext.test.tsx
git commit --no-verify -m "feat: add dynamic admin email management and theme state to AuthContext"
```

---

### Task 2: CSS Theme Design System & Dark Mode Styles

**Files:**
- Modify: `src/styles.css`

**Interfaces:**
- Produces: CSS custom variables (`--bg-page`, `--bg-card`, `--text-primary`, `--text-secondary`, `--border-color`, `--input-bg`) and `[data-theme="dark"]` rules.

- [ ] **Step 1: Add CSS variable design tokens and dark mode overrides in `src/styles.css`**

```css
:root {
  --bg-page: #f8fafc;
  --bg-card: #ffffff;
  --text-primary: #0f172a;
  --text-secondary: #5d687a;
  --border-color: #d9dfeb;
  --input-bg: #ffffff;
  --card-shadow: 0 0.25rem 1rem rgb(23 32 51 / 0.06);
}

[data-theme="dark"] {
  --bg-page: #0f172a;
  --bg-card: #1e293b;
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --border-color: #334155;
  --input-bg: #0f172a;
  --card-shadow: 0 0.25rem 1rem rgb(0 0 0 / 0.3);
}

body { background-color: var(--bg-page); color: var(--text-primary); }
.app-header, .album-card, .thumbnail-pair, .album-form, .photo-set-form, .delete-dialog { background-color: var(--bg-card); color: var(--text-primary); border-color: var(--border-color); }
```

- [ ] **Step 2: Run test suite to verify no style regressions**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/styles.css
git commit --no-verify -m "style: add CSS custom variables and dark mode theme rules"
```

---

### Task 3: SettingsModal Component

**Files:**
- Create: `src/components/SettingsModal.tsx`
- Create: `src/components/SettingsModal.test.tsx`

**Interfaces:**
- Consumes: `useAuth()` context (`theme`, `setTheme`, `isAdmin`, `customAdminEmails`, `addAdminEmail`, `removeAdminEmail`)
- Produces: `SettingsModal` dialog with theme toggle and admin email management.

- [ ] **Step 1: Write failing test in `src/components/SettingsModal.test.tsx`**

```tsx
describe('SettingsModal', () => {
  it('allows toggling theme between light and dark', async () => { ... })
  it('renders admin email management section only for admin users', async () => { ... })
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run src/components/SettingsModal.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement `src/components/SettingsModal.tsx`**

```tsx
interface SettingsModalProps {
  onClose: () => void
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { theme, setTheme, isAdmin, customAdminEmails, addAdminEmail, removeAdminEmail } = useAuth()
  const [newAdminEmail, setNewAdminEmail] = useState('')

  // Render Theme section (Light vs Dark)
  // If isAdmin, render Manage Admins section with input + Add button + list of custom emails with remove buttons
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/SettingsModal.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/SettingsModal.tsx src/components/SettingsModal.test.tsx
git commit --no-verify -m "feat: create SettingsModal component with theme selector and admin management"
```

---

### Task 4: Header Guest Badge & Settings Button Integration

**Files:**
- Modify: `src/components/Header.tsx`
- Modify: `src/components/Header.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

**Interfaces:**
- Produces: Guest badge when logged out, Settings button, and SettingsModal trigger in Header/App shell.

- [ ] **Step 1: Update `src/components/Header.test.tsx`**

Add tests verifying Guest badge when logged out and Settings button click.

- [ ] **Step 2: Update `src/components/Header.tsx` & `src/App.tsx`**

In `Header.tsx`:
```tsx
{user ? (
  <div className="user-profile-badge">...</div>
) : (
  <span className="guest-badge">Guest</span>
)}
<button type="button" className="btn-settings" onClick={onOpenSettings}>
  ⚙️ Settings
</button>
```

In `App.tsx`:
Render `SettingsModal` when `isSettingsOpen` state is true.

- [ ] **Step 3: Run test suite**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/Header.tsx src/components/Header.test.tsx src/App.tsx src/App.test.tsx
git commit --no-verify -m "feat: render Guest badge when logged out and integrate SettingsModal in Header"
```

---

### Task 5: Full Suite Verification & Build Check

- [ ] **Step 1: Run complete test suite**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: Code 0 (clean build)
