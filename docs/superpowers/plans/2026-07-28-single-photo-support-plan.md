# Single Photo Support & Optional "After" Photo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to upload single-photo entries (making the "After" photo optional) and remove all "BEFORE" / "AFTER" badge overlays and pair references when displaying single-photo entries.

**Architecture:**
1. `src/types.ts` makes `after`, `afterUrl`, and `afterKey` optional on `PhotoSet` and payload interfaces.
2. `src/validation.ts` updates validation so only `name` and `before` photo are required.
3. `PhotoSetForm.tsx` updates DropZone 2 to be optional and enables saving when `name` and `before` photo are present.
4. `catalogRepository.ts` and `netlify/functions/api.ts` update pre-signed URL generation and saving logic for single photo uploads.
5. `ThumbnailPair.tsx` and `PhotoLightboxModal.tsx` check if an entry is a pair vs single photo, rendering single photos without `BEFORE` / `AFTER` badges and in a single image container.

**Tech Stack:** React 18, TypeScript, Vitest, Netlify Functions, Cloudflare R2.

## Global Constraints
- React 18 / Vite / TypeScript strict mode.
- Backward compatibility for existing Before & After pairs.
- Unit tests for all modified components, validation, API handlers, and repository functions.

---

### Task 1: Type Definitions, Validation, Repository, and Netlify API Updates

**Files:**
- Modify: `src/types.ts`
- Modify: `src/validation.ts`
- Modify: `src/validation.test.ts`
- Modify: `src/catalogRepository.ts`
- Modify: `src/catalogRepository.test.ts`
- Modify: `netlify/functions/api.ts`
- Modify: `src/test/api.test.ts`

**Interfaces:**
- Produces: Optional `after` photo support in data model, validation, API, and repository.

- [ ] **Step 1: Update `src/types.ts` & `src/validation.ts`**

In `types.ts`:
Make `after?: Blob | string`, `afterUrl?: string`, `afterKey?: string` optional on `PhotoSet` and payload types.

In `validation.ts`:
```ts
export function validatePhotoSet(fields: { name: string; before: File | Blob | string | null; after?: File | Blob | string | null }) {
  const errors: Record<string, string> = {}
  if (!fields.name.trim()) errors.name = 'Set name is required.'
  if (!fields.before) errors.before = 'Choose an image file.'
  return errors
}
```

- [ ] **Step 2: Update `src/catalogRepository.ts` & `netlify/functions/api.ts`**

In `catalogRepository.ts`:
`createPhotoSet` signature: `after: Blob | null` (optional).
Only include `afterFileName` in upload-urls request if `after` is a Blob/File.
Only upload `after` to R2 if `afterUploadUrl` is present.

In `netlify/functions/api.ts`:
In `POST /api/albums/:id/photos`: Accept single photo where `afterUrl` / `afterKey` are empty string. Required: `name` and `beforeUrl` / `beforeKey`.

- [ ] **Step 3: Run unit tests for Task 1**

Run: `npx vitest run src/validation.test.ts src/catalogRepository.test.ts src/test/api.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/types.ts src/validation.ts src/validation.test.ts src/catalogRepository.ts src/catalogRepository.test.ts netlify/functions/api.ts src/test/api.test.ts
git commit --no-verify -m "feat: add single photo support to data types, validation, repository, and netlify API"
```

---

### Task 2: PhotoSetForm & DropZone Optional After Photo Support

**Files:**
- Modify: `src/components/PhotoSetForm.tsx`
- Modify: `src/components/PhotoSetForm.test.tsx`

**Interfaces:**
- Produces: `PhotoSetForm` with optional After Photo dropzone.

- [ ] **Step 1: Update `src/components/PhotoSetForm.test.tsx`**

Add tests verifying form is valid and submittable with only `name` and `before` photo selected.

- [ ] **Step 2: Update `src/components/PhotoSetForm.tsx`**

- Change DropZone 2 label to `"After photo (optional)"`.
- Update submit validation: enabled when `name.trim()` is present and `before` (or `initialPhotoSet.before`) is present.

- [ ] **Step 3: Run unit tests for Task 2**

Run: `npx vitest run src/components/PhotoSetForm.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/PhotoSetForm.tsx src/components/PhotoSetForm.test.tsx
git commit --no-verify -m "feat: make After photo optional in PhotoSetForm"
```

---

### Task 3: ThumbnailPair & PhotoLightboxModal Single Photo Rendering (No Badges)

**Files:**
- Modify: `src/components/ThumbnailPair.tsx`
- Modify: `src/components/ThumbnailPair.test.tsx`
- Modify: `src/components/PhotoLightboxModal.tsx`
- Modify: `src/components/PhotoLightboxModal.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Produces: Single photo card and lightbox modal rendering without `BEFORE`/`AFTER` badges.

- [ ] **Step 1: Update `src/components/ThumbnailPair.tsx`**

Check `isPair = Boolean(urls.after)`:
- If `isPair === false`:
  Render single image wrapper without `BEFORE` or `AFTER` badges (`<div className="single-image-wrapper"><img src={urls.before} alt={photoSet.name} /></div>`).
- If `isPair === true`:
  Render existing 2-column grid with `BEFORE` and `AFTER` badges.

- [ ] **Step 2: Update `src/components/PhotoLightboxModal.tsx`**

Check `isPair = Boolean(urls.after)`:
- If `isPair === false`: Render 1 enlarged centered image without `BEFORE` or `AFTER` badges.
- If `isPair === true`: Render 2 enlarged images with `BEFORE` and `AFTER` badges.

- [ ] **Step 3: Update `src/styles.css`**

Add styling for `.single-image-wrapper` (`width: 100%`, `aspect-ratio: 16/9` or `4/3`, `border-radius: 0.6rem`, `object-fit: cover`).

- [ ] **Step 4: Run unit tests**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ThumbnailPair.tsx src/components/ThumbnailPair.test.tsx src/components/PhotoLightboxModal.tsx src/components/PhotoLightboxModal.test.tsx src/styles.css
git commit --no-verify -m "feat: render single photo entries without BEFORE and AFTER badges in ThumbnailPair and PhotoLightboxModal"
```

---

### Task 4: Full Suite Verification & Build Check

- [ ] **Step 1: Run complete test suite**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: Code 0 (clean build)
