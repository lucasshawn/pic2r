# Task 2 report: Define and validate catalog data

## Red phase

Command:

```sh
npm test -- --run src/validation.test.ts
```

Output (exit 1):

```text
FAIL  src/validation.test.ts [ src/validation.test.ts ]
Error: Failed to resolve import "./validation" from "src/validation.test.ts". Does the file exist?
Test Files  1 failed (1)
Tests  no tests
```

This was the expected failure because `src/validation.ts` did not yet exist.

## Green phase

Command:

```sh
npm test -- --run src/validation.test.ts
```

Output (exit 0):

```text
✓ src/validation.test.ts (2 tests) 2ms
Test Files  1 passed (1)
Tests  2 passed (2)
```

## Build verification

Command:

```sh
npm run build
```

Output (exit 0):

```text
✓ 28 modules transformed.
✓ built in 358ms
```

## Delivered

- `src/types.ts`: `Album`, `PhotoSet`, and `PhotoSetInput` interfaces.
- `src/validation.ts`: album-name and photo-set input validation with the specified messages.
- `src/validation.test.ts`: requested empty-album and missing-photo-pair tests.
