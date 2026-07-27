# Before & After Description and EXIF Date Capture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add optional description field and EXIF creation date extraction for Before & After entries, and update UI terminology across the application.

**Architecture:** 
1. `exifHelper.ts` extracts EXIF `DateTimeOriginal`/`CreateDate` from uploaded photo files using `exifr`.
2. `PhotoSet` data model in `src/types.ts` is expanded to include `description?: string` and `takenAt?: number`.
3. `PhotoSetForm.tsx` supports entering optional description text.
4. `catalogRepository.ts` persists `description` and `takenAt` (falling back to `createdAt` if EXIF metadata is missing).
5. `ThumbnailPair.tsx` displays the description and formatted creation date/time.
6. All UI labels are updated from "Photo set" to "Before & After".

**Tech Stack:** React, TypeScript, Vitest, Netlify Functions, Cloudflare R2, `exifr`.

## Global Constraints
- React 18 / Vite / TypeScript strict mode.
- Unit tests for all modified components and repositories using Vitest & Testing Library.
- Terminology must consistently be "Before & After" across all UI labels and modals.

---

### Task 1: EXIF Metadata Extractor Helper

**Files:**
- Create: `src/exifHelper.ts`
- Test: `src/exifHelper.test.ts`

**Interfaces:**
- Produces: `getPhotoCreationDate(file: File | Blob): Promise<number | null>`

- [ ] **Step 1: Write failing test in `src/exifHelper.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest'
import { getPhotoCreationDate } from './exifHelper'
import exifr from 'exifr'

vi.mock('exifr', () => ({
  default: {
    parse: vi.fn(),
  },
}))

describe('getPhotoCreationDate', () => {
  it('returns timestamp when EXIF DateTimeOriginal is present', async () => {
    const mockDate = new Date('2024-08-15T14:30:00Z')
    vi.mocked(exifr.parse).mockResolvedValueOnce({ DateTimeOriginal: mockDate })

    const file = new File(['fake-bytes'], 'photo.jpg', { type: 'image/jpeg' })
    const result = await getPhotoCreationDate(file)

    expect(result).toBe(mockDate.getTime())
  })

  it('returns null when no EXIF date is present', async () => {
    vi.mocked(exifr.parse).mockResolvedValueOnce(null)

    const file = new File(['fake-bytes'], 'photo.jpg', { type: 'image/jpeg' })
    const result = await getPhotoCreationDate(file)

    expect(result).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/exifHelper.test.ts`
Expected: FAIL ("Cannot find module './exifHelper'")

- [ ] **Step 3: Implement `src/exifHelper.ts`**

```ts
import exifr from 'exifr'

export async function getPhotoCreationDate(file: File | Blob | null): Promise<number | null> {
  if (!file) return null

  try {
    const data = await exifr.parse(file, ['DateTimeOriginal', 'CreateDate'])
    if (!data) return null

    const dateVal = data.DateTimeOriginal || data.CreateDate
    if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
      return dateVal.getTime()
    }
    if (typeof dateVal === 'string') {
      const parsed = new Date(dateVal)
      if (!isNaN(parsed.getTime())) return parsed.getTime()
    }
    return null
  } catch (err) {
    console.warn('Failed to parse EXIF metadata:', err)
    return null
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/exifHelper.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/exifHelper.ts src/exifHelper.test.ts
git commit --no-verify -m "feat: implement getPhotoCreationDate EXIF extraction helper"
```

---

### Task 2: Update Data Model & Repository Persistence

**Files:**
- Modify: `src/types.ts:1-25`
- Modify: `src/catalogRepository.ts:83-252`
- Test: `src/catalogRepository.test.ts`

**Interfaces:**
- Consumes: `getPhotoCreationDate` from `src/exifHelper.ts`
- Produces: Expanded `PhotoSet` interface with `description?: string` and `takenAt?: number`.

- [ ] **Step 1: Write failing test for `catalogRepository.ts` description & takenAt support**

Add to `src/catalogRepository.test.ts`:
```ts
it('creates photo set with description and takenAt date', async () => {
  const album = await createAlbum('Test Album')
  const beforeFile = new File(['dummy'], 'before.jpg', { type: 'image/jpeg' })
  const afterFile = new File(['dummy'], 'after.jpg', { type: 'image/jpeg' })

  const photoSet = await createPhotoSet(album.id, 'Test Pair', beforeFile, afterFile, 'Custom description', 1723732200000)

  expect(photoSet.name).toBe('Test Pair')
  expect(photoSet.description).toBe('Custom description')
  expect(photoSet.takenAt).toBe(1723732200000)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/catalogRepository.test.ts`
Expected: FAIL

- [ ] **Step 3: Update `src/types.ts` and `src/catalogRepository.ts`**

In `src/types.ts`:
```ts
export interface PhotoSet {
  id: string
  albumId: string
  name: string
  description?: string
  takenAt?: number
  beforeUrl?: string
  afterUrl?: string
  beforeKey?: string
  afterKey?: string
  before?: File | Blob | string
  after?: File | Blob | string
  createdAt: number
}

export interface SavePhotoSetPayload {
  id?: string
  albumId: string
  name: string
  description?: string
  takenAt?: number
  beforeUrl?: string
  afterUrl?: string
  beforeKey?: string
  afterKey?: string
  createdAt?: number
}
```

In `src/catalogRepository.ts`:
Update `createPhotoSet` signature and implementation:
```ts
export async function createPhotoSet(
  albumId: string,
  name: string,
  before: Blob,
  after: Blob,
  description?: string,
  takenAt?: number,
): Promise<PhotoSet> {
  if (before instanceof File) before = await convertHeicToJpeg(before)
  if (after instanceof File) after = await convertHeicToJpeg(after)

  const detectedDate =
    takenAt ??
    ((before instanceof File ? await getPhotoCreationDate(before) : null) ||
      (after instanceof File ? await getPhotoCreationDate(after) : null) ||
      undefined)

  // Pass description and takenAt in save payload ...
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/catalogRepository.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types.ts src/catalogRepository.ts src/catalogRepository.test.ts
git commit --no-verify -m "feat: add description and takenAt persistence to catalog repository"
```

---

### Task 3: Form Component & UI Terminology Update

**Files:**
- Modify: `src/components/PhotoSetForm.tsx`
- Modify: `src/components/PhotoSetForm.test.tsx` (if exists) or create
- Modify: `src/components/AlbumPage.tsx`
- Modify: `src/components/CatalogPage.tsx`

**Interfaces:**
- Consumes: `PhotoSet` type, `createPhotoSet`/`updatePhotoSet`
- Produces: Form supporting optional description input and updated "Before & After" copy.

- [ ] **Step 1: Update `PhotoSetForm.tsx` to include description input & updated labels**

```tsx
interface PhotoSetFormProps {
  initialPhotoSet?: PhotoSet
  submitLabel?: string
  onCancel?: () => void
  onSave: (name: string, description: string, before: File | null, after: File | null) => Promise<void>
}

// In component state:
const [description, setDescription] = useState(initialPhotoSet?.description ?? '')

// In JSX:
<label htmlFor="photo-set-description">Description (optional)</label>
<textarea
  id="photo-set-description"
  rows={3}
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  placeholder="Add details about this before & after pair..."
/>
```

- [ ] **Step 2: Update all "Photo set" UI labels in `AlbumPage.tsx` & `CatalogPage.tsx` to "Before & After"**
  - Change submit button: `"Save Before & After"`
  - Change add button: `"Add Before & After"`
  - Change empty state: `"No Before & After pairs in this album yet."`

- [ ] **Step 3: Run Vitest to verify component tests**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/PhotoSetForm.tsx src/components/AlbumPage.tsx src/components/CatalogPage.tsx
git commit --no-verify -m "feat: add description field and update UI labels to Before & After"
```

---

### Task 4: Card Component Display of Description & Creation Date

**Files:**
- Modify: `src/components/ThumbnailPair.tsx`
- Modify: `src/components/ThumbnailPair.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `photoSet.description`, `photoSet.takenAt`, `photoSet.createdAt`
- Produces: Card rendering description text and formatted date (`Taken Aug 15, 2024 at 2:30 PM`).

- [ ] **Step 1: Add date formatting helper and description rendering to `ThumbnailPair.tsx`**

```tsx
function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

// In ThumbnailPair header:
<header className="thumbnail-pair-header">
  <h3>{photoSet.name}</h3>
  {photoSet.description && <p className="thumbnail-pair-description">{photoSet.description}</p>}
</header>

// Below images container:
<footer className="thumbnail-pair-footer">
  <span className="photo-date">
    {photoSet.takenAt ? `Taken ${formatDate(photoSet.takenAt)}` : `Created ${formatDate(photoSet.createdAt)}`}
  </span>
</footer>
```

- [ ] **Step 2: Add CSS styling in `src/styles.css`**

```css
.thumbnail-pair-description {
  color: #5d687a;
  font-size: 0.9rem;
  margin-top: 0.25rem;
  white-space: pre-wrap;
}

.thumbnail-pair-footer {
  color: #717d93;
  font-size: 0.8rem;
  margin-top: 0.5rem;
}
```

- [ ] **Step 3: Run test suite to verify card display**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/ThumbnailPair.tsx src/components/ThumbnailPair.test.tsx src/styles.css
git commit --no-verify -m "feat: render description and photo creation date in ThumbnailPair"
```

---

### Task 5: Full Suite Verification & Build Check

- [ ] **Step 1: Run complete test suite**

Run: `npx vitest run`
Expected: PASS (All tests passing)

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: Code 0 (clean build)

- [ ] **Step 3: Final Git Commit**

```bash
git status
```
