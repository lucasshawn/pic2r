# Backend R2 Admin Email Synchronization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist custom authorized admin emails to Cloudflare R2 (`catalog/admins.json`) so added admin privileges sync automatically across all devices and browsers.

**Architecture:**
1. `netlify/functions/api.ts` provides `GET /api/admins`, `POST /api/admins`, and `DELETE /api/admins/:email`.
2. `catalogRepository.ts` provides `listCustomAdminEmails()`, `addCustomAdminEmail(email)`, and `removeCustomAdminEmail(email)`.
3. `AuthContext.tsx` fetches server-side admin emails on startup and sign-in, updates context state, and saves changes back to R2.

**Tech Stack:** React 18, TypeScript, Vitest, Netlify Functions, Cloudflare R2.

## Global Constraints
- React 18 / Vite / TypeScript strict mode.
- In-memory & localStorage fallback for testing/offline environments.

---

### Task 1: Netlify API Endpoints & Repository Methods for Admin Email Sync

**Files:**
- Modify: `netlify/functions/api.ts`
- Modify: `src/catalogRepository.ts`
- Modify: `src/test/api.test.ts`
- Modify: `src/catalogRepository.test.ts`

**Interfaces:**
- Produces: `GET /api/admins`, `POST /api/admins`, `DELETE /api/admins/:email` and repository helpers `listCustomAdminEmails`, `addCustomAdminEmail`, `removeCustomAdminEmail`.

- [ ] **Step 1: Write failing tests in `src/test/api.test.ts` & `src/catalogRepository.test.ts`**

Add tests for `/api/admins` endpoints and repository methods.

- [ ] **Step 2: Run tests to verify failure**

Run: `npx vitest run src/test/api.test.ts src/catalogRepository.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement endpoints in `api.ts` & helpers in `catalogRepository.ts`**

In `netlify/functions/api.ts`:
```ts
// GET /api/admins, POST /api/admins, DELETE /api/admins/:email
const adminsMatch = path.match(/^\/api\/admins(?:\/(.+))?$/)
if (adminsMatch) {
  const emailParam = adminsMatch[1] ? decodeURIComponent(adminsMatch[1]).toLowerCase() : null
  const key = 'catalog/admins.json'
  const admins = (await getR2Json<string[]>(key)) || []

  if (event.httpMethod === 'GET') {
    return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify(admins) }
  }
  if (event.httpMethod === 'POST') {
    const { email } = JSON.parse(event.body || '{}')
    const trimmed = (email || '').trim().toLowerCase()
    if (trimmed && !admins.includes(trimmed)) {
      admins.push(trimmed)
      await putR2Json(key, admins)
    }
    return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify(admins) }
  }
  if (event.httpMethod === 'DELETE' && emailParam) {
    const updated = admins.filter((e) => e !== emailParam)
    await putR2Json(key, updated)
    return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify(updated) }
  }
}
```

In `src/catalogRepository.ts`:
Implement `listCustomAdminEmails`, `addCustomAdminEmail`, and `removeCustomAdminEmail`.

- [ ] **Step 4: Run tests to verify pass**

Run: `npx vitest run src/test/api.test.ts src/catalogRepository.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add netlify/functions/api.ts src/catalogRepository.ts src/test/api.test.ts src/catalogRepository.test.ts
git commit --no-verify -m "feat: implement R2 admin email endpoints and repository methods"
```

---

### Task 2: AuthContext Cross-Device Admin Sync Integration

**Files:**
- Modify: `src/context/AuthContext.tsx`
- Modify: `src/context/AuthContext.test.tsx`

**Interfaces:**
- Produces: Server-synced `customAdminEmails` state in `AuthContext`.

- [ ] **Step 1: Write failing test in `src/context/AuthContext.test.tsx`**

Test fetching custom admin emails from server repository on mount and sign-in.

- [ ] **Step 2: Update `src/context/AuthContext.tsx`**

On mount and in `loginWithGoogleCredential`:
```ts
useEffect(() => {
  void listCustomAdminEmails().then((serverAdmins) => {
    setCustomAdminEmails(serverAdmins)
    localStorage.setItem('pic2r_admin_emails', JSON.stringify(serverAdmins))
  })
}, [])
```
In `addAdminEmail(email)`:
```ts
void addCustomAdminEmail(email).then((updated) => {
  setCustomAdminEmails(updated)
  localStorage.setItem('pic2r_admin_emails', JSON.stringify(updated))
})
```
In `removeAdminEmail(email)`:
```ts
void removeCustomAdminEmail(email).then((updated) => {
  setCustomAdminEmails(updated)
  localStorage.setItem('pic2r_admin_emails', JSON.stringify(updated))
})
```

- [ ] **Step 3: Run unit tests**

Run: `npx vitest run src/context/AuthContext.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/context/AuthContext.tsx src/context/AuthContext.test.tsx
git commit --no-verify -m "feat: synchronize custom admin emails with R2 server storage in AuthContext"
```

---

### Task 3: Full Suite Verification & Build Check

- [ ] **Step 1: Run complete test suite**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: Code 0 (clean build)
