# Design Spec: Single Photo Support & Optional "After" Photo

## Overview
This specification details support for single-photo entries in `pic2r`. The "After" photo is now optional. When a single photo is submitted, the entry renders as a single photo card without any "BEFORE" or "AFTER" badges or references in the UI, feed cards, or enlarged lightbox modal views.

---

## 1. Data Model & Types (`src/types.ts`)
```ts
export interface PhotoSet {
  id: string
  albumId: string
  name: string
  description?: string
  before: Blob | string
  after?: Blob | string
  beforeUrl?: string
  afterUrl?: string
  beforeKey?: string
  afterKey?: string
  takenAt?: number
  createdAt: number
}
```

---

## 2. Validation (`src/validation.ts`)
- `validatePhotoSet({ name, before, after })`:
  - `name`: Required (non-empty string).
  - `before`: Required (must be present as File, Blob, or non-empty string).
  - `after`: Optional (no validation error if missing/null).

---

## 3. Form Component (`src/components/PhotoSetForm.tsx`)
- DropZone 1: Primary Photo (Required).
- DropZone 2: "After Photo (optional)" (Optional).
- Save button enabled when `name` and `before` photo are selected.

---

## 4. Repository & API Updates (`src/catalogRepository.ts` & `netlify/functions/api.ts`)
- `createPhotoSet(albumId, name, before, after?, description?, takenAt?)`:
  - `after` parameter is optional (`Blob | null`).
  - If `after` is omitted/null, `afterFileName` is not sent to `upload-urls`, no second R2 upload occurs, and `afterUrl` / `afterKey` are omitted or empty string.
- Netlify API handler (`POST /api/albums/:id/photos`):
  - Validates `name` and `beforeUrl` / `beforeKey`.
  - Saves record with `afterUrl` / `afterKey` as empty string or undefined if only 1 photo was provided.

---

## 5. UI Card & Lightbox Rendering (`ThumbnailPair.tsx` & `PhotoLightboxModal.tsx`)
- **Single Photo Entry** (`!photoSet.afterUrl` and `!(photoSet.after instanceof Blob)` or `typeof photoSet.after !== 'string'`):
  - `ThumbnailPair.tsx`: Render 1 column container (`.single-image-wrapper`).
  - **No `BEFORE` or `AFTER` overlay badges** are rendered.
  - `PhotoLightboxModal.tsx`: Render 1 enlarged image centered without any `BEFORE` or `AFTER` overlay badges.
- **Pair Entry** (when both before and after exist):
  - Render existing 2-column grid layout with `BEFORE` and `AFTER` overlay badges.

---

## Testing Plan
1. **Unit Tests**:
   - `src/validation.test.ts`: Test validation passing with name and single photo (`before` only).
   - `src/catalogRepository.test.ts`: Test creating single-photo entries.
   - `src/test/api.test.ts`: Test API handler with single-photo payload.
   - `src/components/PhotoSetForm.test.tsx`: Test form submission with only 1 photo.
   - `src/components/ThumbnailPair.test.tsx`: Test single photo rendering without `BEFORE`/`AFTER` badges.
   - `src/components/PhotoLightboxModal.test.tsx`: Test single photo enlarged view without `BEFORE`/`AFTER` badges.
2. **Integration Tests**:
   - `src/App.test.tsx`: Test end-to-end creation and display of a single photo entry.
