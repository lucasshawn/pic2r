# Design Spec: Before & After Description and EXIF Date Capture

## Overview
This specification details three enhancements to photo management in `pic2r`:
1. Renaming all UI terminology from "Photo set" / "photoset" to "Before & After" / "before & after".
2. Adding an optional `description` field for each Before & After record.
3. Automatically extracting EXIF creation dates (`DateTimeOriginal` / `CreateDate`) from uploaded photo files, falling back to `createdAt` when unavailable, and displaying the timestamp below the images.

---

## 1. UI Terminology Rename
- Form submit buttons: `"Save Before & After"` (instead of `"Save photo set"`).
- Add new item button: `"Add Before & After"` (instead of `"Add photo set"`).
- Delete confirmation modal: `"Delete Before & After"` (instead of `"Delete photo set"`).
- Empty state text: `"No Before & After pairs in this album yet."`

---

## 2. Optional Description Field

### Data Model Updates (`src/types.ts`)
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
```

### Form Component (`src/components/PhotoSetForm.tsx`)
- Add `description` state (`const [description, setDescription] = useState(initialPhotoSet?.description ?? '')`).
- Render optional multiline input `<textarea id="photo-set-description" value={description} ... />`.
- Pass `description` to `onSave(name, description, before, after)`.

### Card Display (`src/components/ThumbnailPair.tsx`)
- Render description text below the title header if `photoSet.description` is non-empty.

---

## 3. EXIF Creation Date Extraction & Display

### Extraction Helper (`src/exifHelper.ts`)
- Function `getPhotoCreationDate(file: File): Promise<number | null>`
- Uses `exifr.parse(file, ['DateTimeOriginal', 'CreateDate'])`.
- If Date object is returned, convert to Unix timestamp `date.getTime()`.
- Return `null` if no EXIF date metadata is found or parsing fails.

### Storage & Fallback (`src/catalogRepository.ts`)
- When creating or updating a `PhotoSet`:
  - Extract EXIF date from `before` image (or `after` image if `before` is missing EXIF).
  - Store as `takenAt: number` in R2 JSON database payload.
  - If no EXIF date is found, `takenAt` defaults to `createdAt`.

### Display Component (`src/components/ThumbnailPair.tsx`)
- Render formatted timestamp below the Before/After images.
- Formatting helper `formatDisplayDate(timestamp: number): string` (e.g. `Jul 27, 2026, 3:12 PM`).
- Display label: `Taken Jul 27, 2026 at 3:12 PM` (or `Created Jul 27, 2026 at 3:12 PM`).

---

## Testing Plan
1. **Unit Tests**:
   - `src/exifHelper.test.ts`: Verify EXIF date parsing with mock Date outputs and graceful fallback to `null`.
   - `src/components/PhotoSetForm.test.tsx`: Verify description input rendering and submission.
   - `src/components/ThumbnailPair.test.tsx`: Verify description rendering and timestamp display.
2. **Integration Tests**:
   - `src/App.test.tsx`: Verify creating/editing a Before & After entry with description and checking card rendering.
