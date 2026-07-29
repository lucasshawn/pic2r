# Full-Page Lightbox & Responsive Mobile Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the enlarged card view to occupy the entire viewport page (`100vw` × `100vh`), fitting images snugly left-to-right on mobile devices with "AFTER" stacked below "BEFORE".

**Architecture:**
1. `PhotoLightboxModal.tsx` updates container structure to support full-page scrolling and fixed floating top-right `✕` close button.
2. `src/styles.css` adds full-page overlay rules, mobile `@media (max-width: 768px)` vertical stacking rules, and snug full-width image fitting.

**Tech Stack:** React 18, TypeScript, Vitest, CSS Media Queries.

## Global Constraints
- React 18 / Vite / TypeScript strict mode.
- Full responsive support for mobile (`<= 768px`) and desktop screens (`> 768px`).

---

### Task 1: Full-Page Lightbox Container & Mobile CSS Layout Rules

**Files:**
- Modify: `src/components/PhotoLightboxModal.tsx`
- Modify: `src/components/PhotoLightboxModal.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Produces: Full-page lightbox modal and mobile CSS responsive layout.

- [ ] **Step 1: Write failing test in `src/components/PhotoLightboxModal.test.tsx`**

Test that lightbox overlay and modal render with full-page container classes and fixed close button.

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run src/components/PhotoLightboxModal.test.tsx`
Expected: FAIL or update asserts

- [ ] **Step 3: Update `PhotoLightboxModal.tsx` & `src/styles.css`**

In `PhotoLightboxModal.tsx`:
Ensure close button has `position: fixed` or top-right container placement, and modal container wraps full-page scroll content.

In `src/styles.css`:
```css
.lightbox-overlay {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.92);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  z-index: 1000;
  display: flex;
  overflow: hidden;
}

.lightbox-modal {
  position: relative;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  border-radius: 0;
  border: none;
  background: var(--bg-page);
  color: var(--text-primary);
  overflow-y: auto;
  padding: 2rem;
  box-sizing: border-box;
}

.lightbox-close-btn {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1010;
  background: rgba(0, 0, 0, 0.65);
  color: #ffffff;
  border: 0;
  border-radius: 50%;
  width: 3rem;
  height: 3rem;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

@media (max-width: 768px) {
  .lightbox-modal {
    padding: 1rem 0.75rem;
  }

  .lightbox-images {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }

  .lightbox-images img,
  .lightbox-single-image img {
    width: 100%;
    max-height: none;
    object-fit: cover;
    border-radius: 0.5rem;
  }
}
```

- [ ] **Step 4: Run unit tests**

Run: `npx vitest run src/components/PhotoLightboxModal.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/PhotoLightboxModal.tsx src/components/PhotoLightboxModal.test.tsx src/styles.css
git commit --no-verify -m "feat: make enlarged lightbox full-page and add responsive mobile vertical stacking"
```

---

### Task 2: Full Suite Verification & Build Check

- [ ] **Step 1: Run complete test suite**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: Code 0 (clean build)
