# Album Renaming & Photoset Description Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide admin capability to rename albums and enhance photoset description display on cards in Instagram caption style.

**Architecture:**
1. `netlify/functions/api.ts` implements `PUT /api/albums/:id` to update album name and description.
2. `catalogRepository.ts` implements `updateAlbum(id, name, description)`.
3. `EditAlbumModal.tsx` provides a modal dialog for editing album details.
4. `ThumbnailPair.tsx` and `src/styles.css` render photoset descriptions prominently below image cards in Instagram caption layout.
5. `AlbumPage.tsx` and `App.tsx` handle album updates and sync local and parent state.

**Tech Stack:** React, TypeScript, Vitest, Netlify Functions, Cloudflare R2.

## Global Constraints
- React 18 / Vite / TypeScript strict mode.
- Unit tests for all modified/new endpoints, repository methods, and UI components.

---

### Task 1: API Endpoint & Repository Method for Updating Albums

**Files:**
- Modify: `netlify/functions/api.ts`
- Modify: `src/catalogRepository.ts`
- Modify: `src/test/api.test.ts`
- Modify: `src/catalogRepository.test.ts`

**Interfaces:**
- Produces: `updateAlbum(id: string, name: string, description?: string): Promise<Album>` and `PUT /api/albums/:id`.

- [ ] **Step 1: Write failing test in `src/test/api.test.ts` and `src/catalogRepository.test.ts`**

Add unit tests verifying updating album name and description via API and repository helper.

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run src/test/api.test.ts src/catalogRepository.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `PUT /api/albums/:id` in `api.ts` & `updateAlbum` in `catalogRepository.ts`**

In `netlify/functions/api.ts`:
```ts
const updateAlbumMatch = path.match(/^\/api\/albums\/([^\/]+)$/)
if (event.httpMethod === 'PUT' && updateAlbumMatch) {
  const albumId = updateAlbumMatch[1]
  const { name, description } = JSON.parse(event.body || '{}')
  const albums = (await getR2Json<Album[]>('catalog/albums.json')) || []
  const album = albums.find((a) => a.id === albumId)
  if (album) {
    album.name = name
    album.description = description
    await putR2Json('catalog/albums.json', albums)
    return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify(album) }
  }
  return { statusCode: 404, headers: jsonHeaders, body: JSON.stringify({ error: 'Album not found' }) }
}
```

In `src/catalogRepository.ts`:
```ts
export async function updateAlbum(id: string, name: string, description?: string): Promise<Album> {
  const data = await apiFetch<Album>(`/api/albums/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description }),
  })
  if (data !== null) {
    const idx = memoryAlbums.findIndex((a) => a.id === id)
    if (idx >= 0) memoryAlbums[idx] = data
    return data
  }
  const existing = memoryAlbums.find((a) => a.id === id)
  if (existing) {
    existing.name = name
    existing.description = description
    return { ...existing }
  }
  throw new Error('Album not found')
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npx vitest run src/test/api.test.ts src/catalogRepository.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add netlify/functions/api.ts src/catalogRepository.ts src/test/api.test.ts src/catalogRepository.test.ts
git commit --no-verify -m "feat: implement PUT album endpoint and repository update function"
```

---

### Task 2: EditAlbumModal Component

**Files:**
- Create: `src/components/EditAlbumModal.tsx`
- Create: `src/components/EditAlbumModal.test.tsx`

**Interfaces:**
- Produces: `EditAlbumModal` component for modifying album name & description.

- [ ] **Step 1: Write failing test in `src/components/EditAlbumModal.test.tsx`**

Test pre-filling name and description, submitting changes, and invoking `onSave(name, description)`.

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run src/components/EditAlbumModal.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement `src/components/EditAlbumModal.tsx`**

```tsx
interface EditAlbumModalProps {
  album: Album
  onClose: () => void
  onSave: (name: string, description?: string) => Promise<void>
}

export function EditAlbumModal({ album, onClose, onSave }: EditAlbumModalProps) {
  const [name, setName] = useState(album.name)
  const [description, setDescription] = useState(album.description ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Form with name input, description textarea, Cancel and Save buttons
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `npx vitest run src/components/EditAlbumModal.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/EditAlbumModal.tsx src/components/EditAlbumModal.test.tsx
git commit --no-verify -m "feat: create EditAlbumModal component for renaming albums"
```

---

### Task 3: Prominent Instagram Caption Photoset Description Display & Album Rename UI

**Files:**
- Modify: `src/components/ThumbnailPair.tsx`
- Modify: `src/components/ThumbnailPair.test.tsx`
- Modify: `src/components/AlbumPage.tsx`
- Modify: `src/components/AlbumPage.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Produces: Caption-style photoset description below image grid, and Edit Album button & modal trigger in `AlbumPage`.

- [ ] **Step 1: Update `src/components/ThumbnailPair.tsx` & `src/styles.css`**

In `ThumbnailPair.tsx`: Move/render description below images in `.thumbnail-pair-caption`:
```tsx
<div className="thumbnail-pair-images">...</div>
{photoSet.description && (
  <div className="thumbnail-pair-caption">
    <span className="caption-title">{photoSet.name}</span>
    <p className="thumbnail-pair-description">{photoSet.description}</p>
  </div>
)}
```

In `src/styles.css`:
Add `.thumbnail-pair-caption`, `.caption-title`, and `.thumbnail-pair-description` caption rules.

- [ ] **Step 2: Update `src/components/AlbumPage.tsx` & `src/App.tsx`**

Add `onUpdateAlbum?: (album: Album) => void` to `AlbumPageProps`.
Render "Edit Album" button for admins next to "Add Before & After".
Render `EditAlbumModal` when `isEditingAlbum` state is true.

In `App.tsx`:
Implement `handleUpdateAlbum(updatedAlbum)` that updates `albums` state array.

- [ ] **Step 3: Run unit tests**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/ThumbnailPair.tsx src/components/ThumbnailPair.test.tsx src/components/AlbumPage.tsx src/components/AlbumPage.test.tsx src/App.tsx src/styles.css
git commit --no-verify -m "feat: render photoset descriptions in Instagram caption layout and integrate Edit Album capability"
```

---

### Task 4: Full Suite Verification & Build Check

- [ ] **Step 1: Run complete test suite**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: Code 0 (clean build)
