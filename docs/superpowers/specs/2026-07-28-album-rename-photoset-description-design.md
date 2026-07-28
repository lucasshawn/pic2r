# Design Spec: Album Renaming and Prominent Photoset Description Display

## Overview
This specification details two capabilities for `pic2r`:
1. Admin ability to edit and rename an album (name and optional description).
2. Prominent, Instagram caption-style rendering of photoset descriptions on Before & After cards.

---

## 1. Album Renaming Capability

### API & Backend Updates (`netlify/functions/api.ts`)
- Add `PUT /api/albums/:albumId` endpoint.
- Body: `{ name: string, description?: string }`.
- Updates album entry in `catalog/albums.json` and saves to R2. Returns updated `Album` object.

### Repository Updates (`src/catalogRepository.ts`)
- Function `updateAlbum(id: string, name: string, description?: string): Promise<Album>`.
- Sends `PUT /api/albums/${id}`. Updates in-memory list `memoryAlbums`.

### UI & Modal (`src/components/EditAlbumModal.tsx` & `src/components/AlbumPage.tsx`)
- On `AlbumPage.tsx`: Render **`Edit Album`** button for admins next to "Add Before & After".
- Open `EditAlbumModal` with pre-filled inputs for Album Name and Description.
- On save: invokes `updateAlbum(album.id, name, description)` and triggers callback `onUpdateAlbum(updatedAlbum)` to sync `App.tsx` state and local heading.

---

## 2. Prominent Photoset Description Display

### UI Component Updates (`src/components/ThumbnailPair.tsx`)
- Render photoset description prominently below the image showcase in Instagram caption style:
  ```tsx
  {photoSet.description && (
    <div className="thumbnail-pair-caption">
      <span className="caption-title">{photoSet.name}</span>
      <p className="thumbnail-pair-description">{photoSet.description}</p>
    </div>
  )}
  ```

### Styling (`src/styles.css`)
- `.thumbnail-pair-caption`: Displays caption below images with high-contrast text (`color: var(--text-primary)`).
- `.caption-title`: `font-weight: 700; margin-right: 0.5rem; color: var(--text-primary);`.
- `.thumbnail-pair-description`: `color: var(--text-primary); font-size: 0.95rem; line-height: 1.45; white-space: pre-wrap; margin-top: 0.25rem;`.

---

## Testing Plan
1. **Unit Tests**:
   - `src/catalogRepository.test.ts`: Test `updateAlbum`.
   - `src/test/api.test.ts`: Test `PUT /api/albums/:id` endpoint.
   - `src/components/EditAlbumModal.test.tsx`: Test editing album name & description.
   - `src/components/ThumbnailPair.test.tsx`: Test caption & description rendering below images.
   - `src/components/AlbumPage.test.tsx`: Test Edit Album modal trigger and save flow.
2. **Integration Tests**:
   - `src/App.test.tsx`: Test renaming an album as admin.
