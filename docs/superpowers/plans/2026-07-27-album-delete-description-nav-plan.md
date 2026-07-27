# Album Navigation, Deletion, and Optional Description Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make header title link home, add album deletion capability for admins, and add optional album description field.

**Architecture:**
1. `Header.tsx` wraps "Before and Afters" in a link (`<a href="#">`).
2. `Album` data model in `src/types.ts` is expanded with `description?: string`.
3. `AlbumForm.tsx` supports entering optional description text.
4. `catalogRepository.ts` and Netlify function `api.ts` support saving album description and handling `DELETE /api/albums/:id`.
5. `AlbumPage.tsx` displays description and admin "Delete Album" button with confirmation dialog.
6. `CatalogPage.tsx` displays descriptions on album cards.

**Tech Stack:** React, TypeScript, Vitest, Netlify Functions, Cloudflare R2.

## Global Constraints
- React 18 / Vite / TypeScript strict mode.
- Unit tests for all modified components and repository methods using Vitest & Testing Library.

---

### Task 1: Header Home Navigation Link

**Files:**
- Modify: `src/components/Header.tsx`
- Modify: `src/components/Header.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Produces: Clickable "Before and Afters" header link leading to `#`.

- [ ] **Step 1: Update `src/components/Header.test.tsx` to verify home link**

Add test:
```tsx
it('renders Before and Afters title as a link to home (#)', () => {
  render(
    <AuthContext.Provider value={defaultAuth}>
      <Header />
    </AuthContext.Provider>
  )
  const link = screen.getByRole('link', { name: /before and afters/i })
  expect(link).toHaveAttribute('href', '#')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Header.test.tsx`
Expected: FAIL ("Unable to find an element with role link")

- [ ] **Step 3: Update `src/components/Header.tsx` & `src/styles.css`**

In `Header.tsx`:
```tsx
<h1>
  <a href="#" className="header-title-link">Before and Afters</a>
</h1>
```

In `src/styles.css`:
```css
.header-title-link {
  color: inherit;
  text-decoration: none;
}
.header-title-link:hover {
  text-decoration: underline;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/Header.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/Header.tsx src/components/Header.test.tsx src/styles.css
git commit --no-verify -m "feat: make Header title a link to home page"
```

---

### Task 2: Album Description Data Model & Creation Form

**Files:**
- Modify: `src/types.ts`
- Modify: `src/components/AlbumForm.tsx`
- Modify: `src/components/CatalogPage.tsx`
- Modify: `src/catalogRepository.ts`
- Test: `src/components/CatalogPage.test.tsx`

**Interfaces:**
- Produces: `Album` with `description?: string`, `AlbumForm` with description textarea, `CatalogPage` displaying card descriptions.

- [ ] **Step 1: Update `src/types.ts`**

```ts
export interface Album {
  id: string
  name: string
  description?: string
  createdAt: number
}
```

- [ ] **Step 2: Update `src/components/AlbumForm.tsx`**

```tsx
interface AlbumFormProps {
  onSave: (name: string, description?: string) => Promise<void>
}

export function AlbumForm({ onSave }: AlbumFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  // ...
  await onSave(name.trim(), description.trim() || undefined)
```

Render optional `<textarea id="album-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" />`.

- [ ] **Step 3: Update `src/catalogRepository.ts` & `CatalogPage.tsx`**

In `catalogRepository.ts`:
```ts
export async function createAlbum(name: string, description?: string): Promise<Album> {
  const data = await apiFetch<Album>('/api/albums', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description }),
  })
```

In `CatalogPage.tsx`:
Render `{album.description && <p className="album-card-description">{album.description}</p>}` inside `.album-card`.

- [ ] **Step 4: Run tests to verify pass**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types.ts src/components/AlbumForm.tsx src/components/CatalogPage.tsx src/catalogRepository.ts
git commit --no-verify -m "feat: add optional album description field to creation form and cards"
```

---

### Task 3: Backend API & Repository Album Deletion

**Files:**
- Modify: `netlify/functions/api.ts`
- Modify: `src/catalogRepository.ts`
- Test: `src/test/api.test.ts`
- Test: `src/catalogRepository.test.ts`

**Interfaces:**
- Produces: `deleteAlbum(id: string): Promise<void>` and `DELETE /api/albums/:albumId` API endpoint.

- [ ] **Step 1: Write failing test in `src/test/api.test.ts` for DELETE /api/albums/:id**

```ts
it('deletes an album and its associated photos', async () => {
  // Mock API call to DELETE /api/albums/:id
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/api.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `DELETE /api/albums/:id` in `netlify/functions/api.ts` & `deleteAlbum` in `src/catalogRepository.ts`**

In `netlify/functions/api.ts`:
```ts
const deleteAlbumMatch = path.match(/^\/api\/albums\/([^\/]+)$/)
if (event.httpMethod === 'DELETE' && deleteAlbumMatch) {
  const albumId = deleteAlbumMatch[1]
  const albums = (await getR2Json<Album[]>('catalog/albums.json')) || []
  const updatedAlbums = albums.filter((a) => a.id !== albumId)
  await putR2Json('catalog/albums.json', updatedAlbums)
  // Delete album photo sets file
  await deleteR2Objects([`albums/${albumId}.json`])
  return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify({ success: true }) }
}
```

In `src/catalogRepository.ts`:
```ts
export async function deleteAlbum(id: string): Promise<void> {
  await apiFetch(`/api/albums/${id}`, { method: 'DELETE' })
  const idx = memoryAlbums.findIndex((a) => a.id === id)
  if (idx >= 0) memoryAlbums.splice(idx, 1)
  memoryPhotoSets.delete(id)
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add netlify/functions/api.ts src/catalogRepository.ts src/test/api.test.ts src/catalogRepository.test.ts
git commit --no-verify -m "feat: implement DELETE album endpoint and repository function"
```

---

### Task 4: Album Page Delete UI & Description Display

**Files:**
- Modify: `src/components/AlbumPage.tsx`
- Modify: `src/components/AlbumPage.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `deleteAlbum(id)`, `album.description`
- Produces: Album Page header with description display, admin "Delete Album" button, and confirmation modal.

- [ ] **Step 1: Update `src/components/AlbumPage.tsx`**

- Display `album.description` below `<h2>{album.name}</h2>`.
- Add "Delete Album" button next to "Add Before & After" for admins.
- Add confirmation modal state `const [isDeletingAlbum, setIsDeletingAlbum] = useState(false)`.
- On confirm: `await deleteAlbum(album.id)`, navigate to `window.location.hash = '#/'`.

- [ ] **Step 2: Add CSS styling in `src/styles.css`**

```css
.album-description {
  color: #5d687a;
  margin-top: 0.25rem;
}
.btn-delete-album {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}
```

- [ ] **Step 3: Update unit tests in `src/components/AlbumPage.test.tsx`**

Verify Delete Album button renders for admin and triggers `deleteAlbum` callback.

- [ ] **Step 4: Run test suite**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/AlbumPage.tsx src/components/AlbumPage.test.tsx src/styles.css
git commit --no-verify -m "feat: add Delete Album button and description display on AlbumPage"
```

---

### Task 5: Full Suite Verification & Build Check

- [ ] **Step 1: Run complete test suite**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: Code 0 (clean build)
