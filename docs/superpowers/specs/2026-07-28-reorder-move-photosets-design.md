# Design Spec: Reorder Photo Sets & Move Photo Sets Between Albums

## Overview
This specification details two new admin capabilities for `pic2r`:
1. Reordering Before & After photo sets within an album (moving items up/down in sequence).
2. Moving a Before & After photo set from its current album to any other destination album.

---

## 1. Reordering Photo Sets Within an Album

### API & Backend Updates (`netlify/functions/api.ts`)
- Add `PUT /api/albums/:albumId/photos/reorder` endpoint.
- Accepts body `{ photoSetIds: string[] }`.
- Reorders the photo set array stored in `albums/:albumId.json` to match the given ID list and persists to R2.

### Repository Updates (`src/catalogRepository.ts`)
- Function `reorderPhotoSets(albumId: string, orderedIds: string[]): Promise<PhotoSet[]>`.
- Sends `PUT /api/albums/${albumId}/photos/reorder`. Updates in-memory map `memoryPhotoSets.set(albumId, reordered)`.

### UI & Component Controls (`src/components/ThumbnailPair.tsx` & `src/components/AlbumPage.tsx`)
- On `ThumbnailPair.tsx`: For admins, render `Move Up` (`↑` / `←`) and `Move Down` (`↓` / `→`) buttons.
- `onMoveUp?: (photoSet: PhotoSet) => void`, `onMoveDown?: (photoSet: PhotoSet) => void`.
- Disabled `Move Up` for the first item, disabled `Move Down` for the last item.
- In `AlbumPage.tsx`: `handleMoveUp` and `handleMoveDown` shift array elements, update UI state immediately, and invoke `reorderPhotoSets(album.id, newOrderedIds)`.

---

## 2. Moving Photo Sets Between Albums

### API & Backend Updates (`netlify/functions/api.ts`)
- Add `PUT /api/albums/:sourceAlbumId/photos/:photoSetId/move` endpoint.
- Body `{ targetAlbumId: string }`.
- Reads `albums/:sourceAlbumId.json` and `albums/:targetAlbumId.json`.
- Removes photo set from `sourceAlbumId.json`.
- Updates `photoSet.albumId = targetAlbumId` and appends to `targetAlbumId.json`.
- Persists both updated JSON files to R2.

### Repository Updates (`src/catalogRepository.ts`)
- Function `movePhotoSet(photoSetId: string, sourceAlbumId: string, targetAlbumId: string): Promise<void>`.
- Sends `PUT /api/albums/${sourceAlbumId}/photos/${photoSetId}/move`.
- Updates in-memory maps (`memoryPhotoSets` for both source and target, plus `photoSetAlbumMap`).

### UI & Modal (`src/components/MovePhotoSetModal.tsx`)
- Render modal dialog overlay when admin clicks **"Move to Album..."** on a card.
- Displays dropdown list of all albums (excluding current album `sourceAlbumId`).
- `onConfirmMove(targetAlbumId: string)`: Calls `movePhotoSet(photoSet.id, album.id, targetAlbumId)` and refreshes album view.

---

## Testing Plan
1. **Unit Tests**:
   - `src/catalogRepository.test.ts`: Test `reorderPhotoSets` and `movePhotoSet`.
   - `src/components/ThumbnailPair.test.tsx`: Test Move Up / Move Down and Move to Album button triggers.
   - `src/components/MovePhotoSetModal.test.tsx`: Test album selection dropdown and confirm/cancel callbacks.
   - `src/test/api.test.ts`: Test `PUT /api/albums/:id/photos/reorder` and `PUT /api/albums/:id/photos/:setKey/move` endpoints.
2. **Integration Tests**:
   - `src/App.test.tsx`: Test reordering items and moving a photo set between two albums as admin.
