# Before and Afters

## Deploy with Netlify

1. Push the repository to GitHub and connect it in Netlify.
2. Netlify reads `netlify.toml`, which sets the build command to `npm run build` and the publish directory to `dist`.
3. Configure the production branch as `main`; each push to `main` deploys the site.

Catalog data is stored in the browser's IndexedDB, so it is local to each visitor and device. It is not shared between browsers or devices.
