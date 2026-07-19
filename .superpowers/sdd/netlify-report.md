# Netlify deployment configuration report

- Added root `netlify.toml` with `npm run build` and `dist` as the publish directory.
- No SPA redirect was added: the app does not use client-side routing, so a catch-all redirect is unnecessary.
- Added GitHub-connected Netlify deployment instructions and IndexedDB storage scope to `README.md`.
- Verification: `npm run build`.
