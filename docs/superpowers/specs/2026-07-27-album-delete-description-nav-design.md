# Design Spec: Album Navigation, Deletion, and Optional Description

## Overview
This specification details three new capabilities for `pic2r`:
1. Making the top header title "Before and Afters" a clickable home link.
2. Allowing admin users to delete an entire album (catalog) and all its photo sets.
3. Adding an optional description field when creating and displaying albums (catalogs).

---

## 1. Header Home Navigation
- In `src/components/Header.tsx`: Wrap "Before and Afters" title in `<a href="#">` or `<a href="#/">`.
- Styling in `src/styles.css`: Title link is unstyled/styled consistently with header text, removing default underline, and showing hand pointer on hover (`cursor: pointer`).

---

## 2. Album Deletion for Admin Users

### API & Backend Updates (`netlify/functions/api.ts`)
- Add `DELETE /api/albums/:albumId` endpoint.
- Deletes album record from `catalog/albums.json`.
- Deletes associated album photo sets file `albums/:albumId.json` and associated R2 image objects (`albums/:albumId/...`).

### Repository Updates (`src/catalogRepository.ts`)
- Function `deleteAlbum(id: string): Promise<void>`.
- Sends `DELETE /api/albums/${id}`. Updates in-memory fallback list if API fails.

### UI & Modal (`src/components/AlbumPage.tsx`)
- Display `"Delete Album"` button next to album title for admin users (`isAdmin === true`).
- Display confirmation modal with prompt: `"Are you sure you want to delete this album and all its Before & After entries?"`
- On confirm: invoke `deleteAlbum(album.id)` and navigate to home (`#/`).

---

## 3. Optional Album Description

### Data Model Updates (`src/types.ts`)
```ts
export interface Album {
  id: string
  name: string
  description?: string
  createdAt: number
}
```

### Creation Form (`src/components/AlbumForm.tsx`)
- Add `description` state (`const [description, setDescription] = useState('')`).
- Render optional multiline input `<textarea id="album-description" value={description} ... />`.
- Update `onSave(name, description)`.

### Album Display
- **Catalog Page** (`src/components/CatalogPage.tsx`): Display `album.description` inside `.album-card` below the album title.
- **Album Page** (`src/components/AlbumPage.tsx`): Display `album.description` below the main `<h2>{album.name}</h2>` heading.

---

## Testing Plan
1. **Unit Tests**:
   - `src/components/Header.test.tsx`: Test that clicking "Before and Afters" links to home `#`.
   - `src/components/AlbumForm.test.tsx`: Test description input rendering and submitting optional description.
   - `src/components/AlbumPage.test.tsx`: Test Delete Album button rendering for admin and deletion callback.
   - `src/test/api.test.ts`: Test `DELETE /api/albums/:id` handler.
2. **Integration Tests**:
   - `src/App.test.tsx`: Test creating an album with description and deleting an album as admin.
