# Design Spec: Click-to-Enlarge Card Lightbox

## Overview
This specification details a new lightbox feature for `pic2r`. Clicking a Before & After card or its images opens a full-screen enlarged lightbox view of the photo pair, complete with high-resolution image rendering, title, description, creation date, and a prominent `✕` button to return to the album photoset view.

---

## 1. Trigger & Interactivity
- On `src/components/ThumbnailPair.tsx`: Wrap image grid in a clickable container with `cursor: pointer` and `onClick={onSelect}`.
- Pressing `Enter` or `Space` while focused on the image grid also triggers `onSelect`.
- Admin action buttons (`Edit`, `Delete`, `Move`) stop event propagation (`e.stopPropagation()`) so clicking management buttons does not open the lightbox.

---

## 2. Lightbox Component (`src/components/PhotoLightboxModal.tsx`)
- **Modal Overlay**: `role="dialog"`, `aria-modal="true"`, `aria-label="Enlarged Before & After view"`.
- **Top Bar**: Right-aligned close button (`✕`) with `aria-label="Close enlarged view"` and `onClick={onClose}`.
- **Enlarged Media View**: Side-by-side Before & After images occupying up to 85vh / 90vw with `object-fit: contain` for full image view.
- **Overlay Labels**: `BEFORE` and `AFTER` badges in the top corners of the enlarged images.
- **Metadata Section**: Photoset title (`<h3>`), creation/taken date, and full description text (`white-space: pre-wrap`).
- **Keyboard & Backdrop Support**: Pressing `Escape` key or clicking outside the lightbox content closes the modal.

---

## 3. Styling (`src/styles.css`)
- `.lightbox-overlay`: Fixed overlay covering `100vw` / `100vh` with dark translucent backdrop (`background: rgba(0, 0, 0, 0.85)`).
- `.lightbox-modal`: Clean card container with `max-width: 64rem`, `max-height: 90vh`, overflow-y auto.
- `.lightbox-images`: Side-by-side grid with high-resolution image scaling.
- `.lightbox-close-btn`: Top-right positioned floating close button (`font-size: 1.5rem`, `background: rgba(0, 0, 0, 0.5)`, `color: #fff`, `border-radius: 50%`, `width: 2.5rem`, `height: 2.5rem`).

---

## Testing Plan
1. **Unit Tests**:
   - `src/components/PhotoLightboxModal.test.tsx`: Test rendering enlarged view, image badges, metadata, close button click, `Escape` keypress, and backdrop click.
   - `src/components/ThumbnailPair.test.tsx`: Test clicking images triggers `onSelect` callback.
   - `src/components/AlbumPage.test.tsx`: Test opening and closing lightbox from album page.
2. **Integration Tests**:
   - `src/App.test.tsx`: Test end-to-end lightbox opening and closing.
