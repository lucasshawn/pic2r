# Design Spec: Instagram-Inspired Aesthetic and Theme

## Overview
This specification details the visual redesign of `pic2r` into an Instagram-inspired web application interface. It introduces a refined design system, sticky translucent navigation, gradient brand accents, Instagram feed-style cards for Before & After pairs, Story-highlight style album cards, and polished Light and OLED Dark mode themes.

---

## 1. Design System Tokens & Color Palette (`src/styles.css`)

### CSS Custom Variables
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

---

## 2. Header & Branding (`src/components/Header.tsx` & `src/styles.css`)
- **Sticky Blur Header**: `position: sticky; top: 0; z-index: 50; backdrop-filter: blur(12px); background: rgba(255,255,255,0.85);` (or dark counterpart `rgba(18,18,18,0.85)`).
- **Gradient Brand Title**: `.header-title-link` styled with background-clip text gradient:
  ```css
  .header-title-link {
    background: var(--ig-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 800;
    letter-spacing: -0.02em;
  }
  ```
- Buttons & Badges: Round 9999px pills with subtle borders and smooth hover transitions.

---

## 3. Album Cards (Story Highlight Style)
- Grid layout with 1rem gaps.
- `.album-card` styled with clean rounded corners (`border-radius: 1rem`), 1px border, and optional gradient highlight ring on hover.
- Title in bold `#262626`, secondary description in `#8e8e8e`.

---

## 4. Before & After Cards (Feed Post Style) (`src/components/ThumbnailPair.tsx`)
- `.thumbnail-pair` container styled like an Instagram Feed post (`border-radius: 0.75rem`, `border: 1px solid var(--border-color)`).
- **Header Row**: Left-aligned bold title, creation date, and right-aligned admin action controls.
- **Image Showcase**: Side-by-side Before & After images with relative position badges (`BEFORE` and `AFTER` pill overlays in top corner of each image).
- **Image Frames**: 8px border-radius, object-fit cover, subtle hover scale (`transform: scale(1.02); transition: transform 0.2s;`).
- **Caption & Details**: Description formatted directly below images in feed typography (`font-size: 0.95rem`, `color: var(--text-primary)`).

---

## 5. Form & Modal Controls
- Primary action buttons (e.g., `+ Add Before & After`, `Create album`) use Instagram primary blue (`#0095f6`) or gradient backgrounds.
- Input fields use soft rounded borders (`border-radius: 0.5rem`, `padding: 0.75rem`) and blue focus rings.

---

## Testing & Verification Plan
1. **Unit Tests**: Run `npx vitest run` to verify that all component, header, thumbnail pair, album page, and catalog page test suites pass cleanly.
2. **Build Test**: Run `npm run build` to verify clean production compilation.
