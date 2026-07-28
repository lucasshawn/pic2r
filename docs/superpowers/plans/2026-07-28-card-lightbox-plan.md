# Click-to-Enlarge Card Lightbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to click on any Before & After photo card to view a large, high-resolution lightbox modal with an `✕` button, `Escape` key dismiss, and backdrop close.

**Architecture:**
1. `PhotoLightboxModal.tsx` provides a full-screen overlay component displaying enlarged images, BEFORE/AFTER badges, metadata, and close controls.
2. `ThumbnailPair.tsx` adds `onSelect?: (photoSet: PhotoSet) => void` triggered when clicking the card image wrapper.
3. `AlbumPage.tsx` manages `activeLightboxSet` state and renders `PhotoLightboxModal` when set.
4. `src/styles.css` provides dark translucent backdrop blur overlay, enlarged image grid scaling, and floating `✕` close button styling.

**Tech Stack:** React 18, TypeScript, Vitest, CSS Flexbox/Grid.

## Global Constraints
- React 18 / Vite / TypeScript strict mode.
- Keyboard support (`Escape` key closes lightbox).
- Unit tests for component interaction, keyboard events, and modal state.

---

### Task 1: PhotoLightboxModal Component

**Files:**
- Create: `src/components/PhotoLightboxModal.tsx`
- Create: `src/components/PhotoLightboxModal.test.tsx`

**Interfaces:**
- Produces: `PhotoLightboxModal` component.

- [ ] **Step 1: Write failing test in `src/components/PhotoLightboxModal.test.tsx`**

Test rendering enlarged images, BEFORE/AFTER badges, metadata title/date/description, close button (`✕`) click calling `onClose`, backdrop click calling `onClose`, and `Escape` key calling `onClose`.

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run src/components/PhotoLightboxModal.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement `src/components/PhotoLightboxModal.tsx`**

```tsx
interface PhotoLightboxModalProps {
  photoSet: PhotoSet
  onClose: () => void
}

export function PhotoLightboxModal({ photoSet, onClose }: PhotoLightboxModalProps) {
  // Listen for Escape key on window
  // Resolve image URLs (Blob or string)
  // Render dark backdrop, floating ✕ button, enlarged before/after images, and title/description metadata
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `npx vitest run src/components/PhotoLightboxModal.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/PhotoLightboxModal.tsx src/components/PhotoLightboxModal.test.tsx
git commit --no-verify -m "feat: create PhotoLightboxModal component for enlarged Before & After view"
```

---

### Task 2: ThumbnailPair Click Trigger & AlbumPage Integration

**Files:**
- Modify: `src/components/ThumbnailPair.tsx`
- Modify: `src/components/ThumbnailPair.test.tsx`
- Modify: `src/components/AlbumPage.tsx`
- Modify: `src/components/AlbumPage.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `PhotoLightboxModal` in `AlbumPage`.
- Produces: Clickable card image wrapper in `ThumbnailPair` that opens lightbox.

- [ ] **Step 1: Update `src/components/ThumbnailPair.tsx`**

Add `onSelect?: (photoSet: PhotoSet) => void` to `ThumbnailPairProps`.
Wrap image grid in clickable container (`onClick={() => onSelect?.(photoSet)}`, `role="button"`, `tabIndex={0}`, `aria-label={`Enlarge ${photoSet.name}`}`).

- [ ] **Step 2: Update `src/components/AlbumPage.tsx`**

Add state `const [activeLightboxSet, setActiveLightboxSet] = useState<PhotoSet | null>(null)`.
Pass `onSelect={setActiveLightboxSet}` to `<ThumbnailPair />`.
Render `{activeLightboxSet && <PhotoLightboxModal photoSet={activeLightboxSet} onClose={() => setActiveLightboxSet(null)} />}`.

- [ ] **Step 3: Update `src/styles.css`**

Add styling for `.lightbox-overlay`, `.lightbox-modal`, `.lightbox-close-btn`, `.lightbox-images`, and hover pointer for card images.

- [ ] **Step 4: Run unit tests**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ThumbnailPair.tsx src/components/ThumbnailPair.test.tsx src/components/AlbumPage.tsx src/components/AlbumPage.test.tsx src/styles.css
git commit --no-verify -m "feat: integrate click-to-enlarge lightbox in ThumbnailPair and AlbumPage"
```

---

### Task 3: Full Suite Verification & Build Check

- [ ] **Step 1: Run complete test suite**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: Code 0 (clean build)
