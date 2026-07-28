# Reorder Photo Sets & Move Photo Sets Between Albums Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow admin users to reorder Before & After photo sets within an album and move photo sets to other albums.

**Architecture:**
1. `netlify/functions/api.ts` provides `PUT /api/albums/:id/photos/reorder` and `PUT /api/albums/:id/photos/:photoSetId/move`.
2. `catalogRepository.ts` implements `reorderPhotoSets(albumId, photoSetIds)` and `movePhotoSet(photoSetId, sourceAlbumId, targetAlbumId)`.
3. `MovePhotoSetModal.tsx` provides a modal dialog for selecting the target destination album.
4. `ThumbnailPair.tsx` adds `Move Up` / `Move Down` / `Move to Album` action controls for admins.
5. `AlbumPage.tsx` manages reorder/move interactions, updates state immediately, and persists to R2.

**Tech Stack:** React, TypeScript, Vitest, Netlify Functions, Cloudflare R2.

## Global Constraints
- React 18 / Vite / TypeScript strict mode.
- Unit tests for all new endpoints, repository methods, and components.

---

### Task 1: Netlify API Endpoints & Repository Methods for Reorder & Move

**Files:**
- Modify: `netlify/functions/api.ts`
- Modify: `src/catalogRepository.ts`
- Modify: `src/test/api.test.ts`
- Modify: `src/catalogRepository.test.ts`

**Interfaces:**
- Produces: `reorderPhotoSets(albumId, orderedIds)` and `movePhotoSet(photoSetId, sourceAlbumId, targetAlbumId)`.

- [ ] **Step 1: Write failing tests in `src/test/api.test.ts` & `src/catalogRepository.test.ts`**

Add tests for reordering photo sets in an album and moving a photo set to a different album.

- [ ] **Step 2: Run tests to verify failure**

Run: `npx vitest run src/test/api.test.ts src/catalogRepository.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement endpoints in `netlify/functions/api.ts` & helpers in `src/catalogRepository.ts`**

In `netlify/functions/api.ts`:
```ts
// PUT /api/albums/:albumId/photos/reorder
const reorderMatch = path.match(/^\/api\/albums\/([^\/]+)\/photos\/reorder$/)
if (event.httpMethod === 'PUT' && reorderMatch) {
  const albumId = reorderMatch[1]
  const { photoSetIds } = JSON.parse(event.body || '{}')
  const existing = (await getR2Json<PhotoSet[]>(`albums/${albumId}.json`)) || []
  const reordered = photoSetIds.map((id: string) => existing.find((p) => p.id === id)).filter(Boolean)
  await putR2Json(`albums/${albumId}.json`, reordered)
  return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify(reordered) }
}

// PUT /api/albums/:albumId/photos/:photoSetId/move
const moveMatch = path.match(/^\/api\/albums\/([^\/]+)\/photos\/([^\/]+)\/move$/)
if (event.httpMethod === 'PUT' && moveMatch) {
  const [_, sourceAlbumId, photoSetId] = moveMatch
  const { targetAlbumId } = JSON.parse(event.body || '{}')
  const sourceList = (await getR2Json<PhotoSet[]>(`albums/${sourceAlbumId}.json`)) || []
  const targetList = (await getR2Json<PhotoSet[]>(`albums/${targetAlbumId}.json`)) || []
  const itemToMove = sourceList.find((p) => p.id === photoSetId)
  if (itemToMove) {
    const updatedSource = sourceList.filter((p) => p.id !== photoSetId)
    const movedItem = { ...itemToMove, albumId: targetAlbumId }
    targetList.push(movedItem)
    await putR2Json(`albums/${sourceAlbumId}.json`, updatedSource)
    await putR2Json(`albums/${targetAlbumId}.json`, targetList)
  }
  return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify({ success: true }) }
}
```

In `src/catalogRepository.ts`:
Implement `reorderPhotoSets` and `movePhotoSet`.

- [ ] **Step 4: Run tests to verify pass**

Run: `npx vitest run src/test/api.test.ts src/catalogRepository.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add netlify/functions/api.ts src/catalogRepository.ts src/test/api.test.ts src/catalogRepository.test.ts
git commit --no-verify -m "feat: implement API endpoints and repository functions for reordering and moving photo sets"
```

---

### Task 2: MovePhotoSetModal Component

**Files:**
- Create: `src/components/MovePhotoSetModal.tsx`
- Create: `src/components/MovePhotoSetModal.test.tsx`

**Interfaces:**
- Produces: `MovePhotoSetModal` component allowing selection of target album.

- [ ] **Step 1: Write failing test in `src/components/MovePhotoSetModal.test.tsx`**

Test rendering dropdown of target albums (excluding source album) and invoking `onConfirm(targetAlbumId)`.

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run src/components/MovePhotoSetModal.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement `src/components/MovePhotoSetModal.tsx`**

```tsx
interface MovePhotoSetModalProps {
  photoSet: PhotoSet
  currentAlbumId: string
  albums: Album[]
  onClose: () => void
  onConfirmMove: (targetAlbumId: string) => Promise<void>
}

export function MovePhotoSetModal({ photoSet, currentAlbumId, albums, onClose, onConfirmMove }: MovePhotoSetModalProps) {
  const availableAlbums = albums.filter((a) => a.id !== currentAlbumId)
  const [selectedAlbumId, setSelectedAlbumId] = useState(availableAlbums[0]?.id ?? '')
  // Render modal with select dropdown, Cancel, and Move buttons
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `npx vitest run src/components/MovePhotoSetModal.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/MovePhotoSetModal.tsx src/components/MovePhotoSetModal.test.tsx
git commit --no-verify -m "feat: create MovePhotoSetModal component"
```

---

### Task 3: Card Actions in ThumbnailPair & Reorder/Move Handler in AlbumPage

**Files:**
- Modify: `src/components/ThumbnailPair.tsx`
- Modify: `src/components/ThumbnailPair.test.tsx`
- Modify: `src/components/AlbumPage.tsx`
- Modify: `src/components/AlbumPage.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Produces: Reorder controls (`Move Up` / `Move Down`) and `Move to...` button on `ThumbnailPair.tsx`, handled by `AlbumPage.tsx`.

- [ ] **Step 1: Update `src/components/ThumbnailPair.tsx`**

Add props: `canMoveUp?: boolean`, `canMoveDown?: boolean`, `onMoveUp?: () => void`, `onMoveDown?: () => void`, `onOpenMoveModal?: () => void`.
When `isAdmin === true`, render:
- `Move Up` button (disabled if `!canMoveUp`)
- `Move Down` button (disabled if `!canMoveDown`)
- `Move to Album...` button

- [ ] **Step 2: Update `src/components/AlbumPage.tsx`**

Pass all available `albums` into `AlbumPageProps`.
Implement `handleMoveUp`, `handleMoveDown`, and `handleMoveToAlbum(photoSet, targetAlbumId)` handlers.

- [ ] **Step 3: Update `src/styles.css`**

Add styling for reorder button controls and move modal layout.

- [ ] **Step 4: Run unit tests**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ThumbnailPair.tsx src/components/ThumbnailPair.test.tsx src/components/AlbumPage.tsx src/components/AlbumPage.test.tsx src/styles.css
git commit --no-verify -m "feat: integrate reordering and album migration controls into ThumbnailPair and AlbumPage"
```

---

### Task 4: Full Suite Verification & Build Check

- [ ] **Step 1: Run complete test suite**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: Code 0 (clean build)
