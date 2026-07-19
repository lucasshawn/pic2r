# Task 1 report — Bootstrap the React test environment

## Scope completed

Created the minimal Vite + React + TypeScript scaffold, test setup, smoke test, and
the `Picture Catalog` heading implementation. The test setup imports
`@testing-library/jest-dom` and `fake-indexeddb/auto`, and clears the
`picture-catalog` IndexedDB database after each test.

Commit: `bcb07e8af33a67ee44c2da7d7c4ead34b1709d5c` (`chore: scaffold picture catalog app`)

## TDD evidence

### Red

Command:

```sh
npm test -- --run src/App.test.tsx
```

Output before scaffolding:

```text
npm error code ENOENT
npm error path /Users/shlucas/repos/lucasshawn/pic2r/package.json
npm error enoent Could not read package.json: ENOENT: no such file or directory
```

This is the expected failure because the project had neither `package.json` nor
the `App` module.

### Green

Commands:

```sh
npm install
npm test -- --run src/App.test.tsx
npm run build
git diff --check
```

Final smoke-test output:

```text
✓ src/App.test.tsx (1 test)
Test Files  1 passed (1)
Tests  1 passed (1)
```

Build output:

```text
vite v6.4.3 building for production...
✓ 28 modules transformed.
✓ built in 348ms
```

`git diff --check` completed with no output (no whitespace errors).

## Note

The initial green test attempt exposed Vitest's missing global `expect` for
`@testing-library/jest-dom`; `globals: true` was added to the Vitest config as
the minimal required configuration. The subsequent smoke test and build passed.

---

## Follow-up fix — fail blocked IndexedDB cleanup

### Finding addressed

`src/test/setup.ts` previously resolved its cleanup promise when
`indexedDB.deleteDatabase('picture-catalog')` emitted `onblocked`. A still-open
database connection can prevent deletion, so resolving allowed later tests to
run against persisted state and broke test isolation.

### TDD evidence

Added `src/test/setup.test.ts`, which supplies a database deletion request that
emits `blocked` and asserts that `deletePictureCatalog` rejects.

Red command:

```sh
npm test -- --run src/test/setup.test.ts
```

Red output before the implementation:

```text
× deletePictureCatalog > rejects when a database connection blocks deletion
TypeError: (0 , deletePictureCatalog) is not a function
```

### Fix

Extracted the cleanup operation into `deletePictureCatalog`. Its `onblocked`
handler now rejects with `Deleting picture-catalog was blocked`; the existing
`afterEach` awaits this helper. A blocked deletion therefore fails the current
test rather than silently continuing with a possibly retained database.

### Verification

```text
npm test -- --run src/test/setup.test.ts
✓ src/test/setup.test.ts (1 test)
Test Files  1 passed (1)
Tests  1 passed (1)

npm test -- --run src/App.test.tsx
✓ src/App.test.tsx (1 test)
Test Files  1 passed (1)
Tests  1 passed (1)

npm run build
✓ 28 modules transformed.
✓ built in 384ms
```
