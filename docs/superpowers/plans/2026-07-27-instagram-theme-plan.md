# Instagram-Inspired Aesthetic and Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the visual theme and layout of `pic2r` to have an Instagram-inspired look and feel, including gradient brand typography, sticky translucent header, feed post-style Before & After cards, overlay badges, and Instagram Light & OLED Dark mode palettes.

**Architecture:**
1. `src/styles.css` is updated with Instagram color tokens, CSS variables, gradient text, sticky blur header, Instagram post feed cards, and rounded image overlays.
2. `ThumbnailPair.tsx` is updated to include BEFORE and AFTER pill badges on the respective image containers for an Instagram feed post feel.
3. `Header.tsx` is updated with sticky translucent backdrop blur layout and Instagram-style gradient brand title.

**Tech Stack:** CSS Custom Variables, Modern Flexbox/Grid, React, Vitest.

## Global Constraints
- Light mode palette: `#fafafa` canvas, `#ffffff` cards, `#262626` text, `#dbdbdb` borders.
- Dark mode palette: `#000000` canvas, `#121212` cards, `#f5f5f5` text, `#262626` borders.
- Instagram gradient accent: `linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)`.

---

### Task 1: CSS Theme Tokens & Instagram Design System

**Files:**
- Modify: `src/styles.css`

**Interfaces:**
- Produces: Complete Instagram design system with variables, typography, buttons, inputs, cards, and dark mode rules.

- [ ] **Step 1: Update `src/styles.css` with Instagram design tokens and theme rules**

```css
:root {
  --bg-page: #fafafa;
  --bg-card: #ffffff;
  --text-primary: #262626;
  --text-secondary: #8e8e8e;
  --border-color: #dbdbdb;
  --input-bg: #fafafa;
  --card-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  --ig-gradient: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
  --ig-blue: #0095f6;
  --ig-blue-hover: #1877f2;

  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: var(--text-primary);
  background-color: var(--bg-page);
}

[data-theme="dark"] {
  --bg-page: #000000;
  --bg-card: #121212;
  --text-primary: #f5f5f5;
  --text-secondary: #a8a8a8;
  --border-color: #262626;
  --input-bg: #121212;
  --card-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
}
```

Update buttons:
```css
button {
  border: 0;
  border-radius: 0.5rem;
  background: var(--ig-blue);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  padding: 0.6rem 1.25rem;
  transition: background 0.15s ease, transform 0.1s ease;
}

button:hover {
  background: var(--ig-blue-hover);
}
```

- [ ] **Step 2: Run test suite to verify no style regressions**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/styles.css
git commit --no-verify -m "style: update CSS with Instagram design system tokens, buttons, and theme rules"
```

---

### Task 2: Sticky Translucent Header & Instagram Gradient Title

**Files:**
- Modify: `src/components/Header.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Produces: Sticky blur header with Instagram gradient text logo.

- [ ] **Step 1: Update `src/styles.css` for Header and Title**

```css
.app-header {
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background-color: rgba(255, 255, 255, 0.85);
  border-bottom: 1px solid var(--border-color);
  padding: 0.85rem 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

[data-theme="dark"] .app-header {
  background-color: rgba(18, 18, 18, 0.85);
}

.header-title-link {
  background: var(--ig-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 800;
  font-size: 1.75rem;
  letter-spacing: -0.025em;
  text-decoration: none;
}
```

- [ ] **Step 2: Run test suite**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/Header.tsx src/styles.css
git commit --no-verify -m "style: apply sticky blur layout and Instagram gradient title to Header"
```

---

### Task 3: Feed Post Style Thumbnail Pair Cards & Image Overlays

**Files:**
- Modify: `src/components/ThumbnailPair.tsx`
- Modify: `src/components/ThumbnailPair.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Produces: Instagram feed post card with `BEFORE` and `AFTER` image overlay badges.

- [ ] **Step 1: Update `src/components/ThumbnailPair.tsx` to include image overlay badges**

```tsx
<div className="thumbnail-pair-images">
  <div className="image-wrapper">
    <span className="image-badge">BEFORE</span>
    <img src={urls.before} alt={`${photoSet.name} before`} />
  </div>
  <div className="image-wrapper">
    <span className="image-badge">AFTER</span>
    <img src={urls.after} alt={`${photoSet.name} after`} />
  </div>
</div>
```

- [ ] **Step 2: Add CSS rules for `.image-wrapper` and `.image-badge` in `src/styles.css`**

```css
.image-wrapper {
  position: relative;
  overflow: hidden;
  border-radius: 0.6rem;
}

.image-badge {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  background: rgba(0, 0, 0, 0.65);
  color: #ffffff;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 0.2rem 0.5rem;
  border-radius: 0.3rem;
  backdrop-filter: blur(4px);
  z-index: 2;
}

.thumbnail-pair img {
  aspect-ratio: 1;
  border-radius: 0.6rem;
  object-fit: cover;
  width: 100%;
  transition: transform 0.25s ease;
}

.thumbnail-pair img:hover {
  transform: scale(1.02);
}
```

- [ ] **Step 3: Run test suite**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/ThumbnailPair.tsx src/components/ThumbnailPair.test.tsx src/styles.css
git commit --no-verify -m "feat: add BEFORE and AFTER overlay badges and Instagram feed styling to ThumbnailPair"
```

---

### Task 4: Full Suite Verification & Build Check

- [ ] **Step 1: Run complete test suite**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: Code 0 (clean build)
