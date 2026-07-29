# Design Spec: Full-Page Lightbox & Responsive Mobile Layout

## Overview
This specification details a full-page enlarged lightbox view in `pic2r`. When a user clicks a photo card to view it enlarged, the card occupies the full page viewport (`100vw` × `100vh`). On mobile screens (`<= 768px`), photos fit snugly left to right, and Before & After pairs stack vertically with "AFTER" positioned below "BEFORE".

---

## 1. Full-Page Container & Floating Close Controls (`src/styles.css`)
- `.lightbox-overlay`: Fixed overlay covering `100vw` and `100vh` (`inset: 0`), `z-index: 1000`, `background: rgba(0, 0, 0, 0.92)`.
- `.lightbox-modal`: Full viewport container (`width: 100%`, `height: 100%`, `max-width: 100%`, `max-height: 100%`, `border-radius: 0`, `overflow-y: auto`, `padding: 1rem`).
- `.lightbox-close-btn`: Fixed top-right floating button (`top: 1rem`, `right: 1rem`, `position: fixed`, `z-index: 1010`, `background: rgba(0, 0, 0, 0.7)`, `color: #ffffff`, `width: 3rem`, `height: 3rem`, `font-size: 1.5rem`, `border-radius: 50%`).

---

## 2. Desktop vs Mobile Layout Rules (`src/styles.css`)

### Desktop Layout (`> 768px`)
- `.lightbox-images`: 2-column grid (`grid-template-columns: repeat(2, minmax(0, 1fr))`, `gap: 1.5rem`).
- `.lightbox-images img`: `max-height: 75vh`, `object-fit: contain`, `width: 100%`.

### Mobile Responsive Layout (`@media (max-width: 768px)`)
- `.lightbox-modal`: Edge-to-edge padding (`padding: 0.75rem`), full height scrolling container.
- `.lightbox-images`: Single column layout (`grid-template-columns: 1fr`, `gap: 1.25rem`).
- `.lightbox-images .image-wrapper`: `width: 100%`, `position: relative`.
- `.lightbox-images img`: `width: 100%`, `max-height: none`, `object-fit: cover`, `border-radius: 0.5rem` (snug left-to-right fit).
- For Before & After pairs: "BEFORE" image renders first, and "AFTER" image renders directly below it.

---

## Testing Plan
1. **Unit Tests**:
   - `src/components/PhotoLightboxModal.test.tsx`: Test full-page lightbox dialog structure, responsive class names, close button floating position, and keyboard `Escape` dismiss.
2. **Integration & CSS Verification**:
   - Verify `npx vitest run` passes all 142+ unit and integration tests.
   - Verify `npm run build` succeeds cleanly.
