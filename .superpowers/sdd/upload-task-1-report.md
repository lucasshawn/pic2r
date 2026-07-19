# Upload Task 1 Report

## Scope

Implemented the validated paired-image controls only:

- `src/components/DropZone.tsx`
- `src/components/PhotoSetForm.tsx`
- `src/App.test.tsx`
- `src/styles.css`

`DropZone` accepts the first selected or dropped file, prevents browser drag/drop defaults, exposes drag-over styling, and renders previews only for image files. Object URLs are revoked when the selected file changes or the component unmounts.

`PhotoSetForm` derives its save state from `validatePhotoSet`, shows rejected-file validation, preserves fields after a rejected input or failed save, and clears all fields only after a successful save.

## TDD Evidence

### Red

Command:

```sh
npm test -- --run src/App.test.tsx
```

Result: failed as expected before implementation because Vite could not resolve `./components/PhotoSetForm` from `src/App.test.tsx`.

### Green

Command:

```sh
npm test -- --run src/App.test.tsx
```

Result:

```text
✓ src/App.test.tsx (5 tests)
Test Files  1 passed (1)
Tests  5 passed (5)
```

## Verification

Commands run immediately before commit:

```sh
npm test -- --run src/App.test.tsx
npm run build
npm test -- --run
git diff --check
```

Results:

```text
✓ src/App.test.tsx (5 tests)
Test Files  1 passed (1)
Tests  5 passed (5)

vite build: ✓ built in 400ms

Test Files  4 passed (4)
Tests  9 passed (9)

git diff --check: no output (clean)
```

## Commit

`5f89650 feat: add paired image upload form`

## Scope Note

The form is deliberately not yet mounted from `App`; that integration belongs to a later upload task. In jsdom, `URL.createObjectURL` is unavailable, so previews are omitted only in that environment. Browsers create and revoke previews as required.
# Task 1 review — `183588897995856ec77ebee67cfa242942880f84..5f89650`

## Verdict

**Changes requested.** The paired image form is broadly aligned with the brief, but it does not preserve a previously selected valid image when a later picker/drop selection is rejected. This violates the stated requirement to preserve fields on rejected input.

## Strengths

- `PhotoSetForm` uses `validatePhotoSet` to derive the Save button state and checks it again on submit.
- Both chooser and drop paths feed the same `onFileChange` handler; validation therefore reports the same non-image error for either path.
- The save callback has the requested `(name, before, after) => Promise<void>` signature, trims the submitted name, clears the form only after the awaited callback resolves, and leaves it intact if it rejects.
- `DropZone` prevents default drag handling, exposes a labelled hidden `image/*` input, supports drag-over styling, and cleans up created preview object URLs on change/unmount.
- The focused tests cover the requested enabling and invalid-drop cases. Per review instructions, the reported test command was not rerun.

## Findings

### Important — rejected image selection overwrites an existing valid field

`DropZone.selectFile` forwards every selected file to the parent ([`src/components/DropZone.tsx:29`](../../src/components/DropZone.tsx)), and `PhotoSetForm.handleFileChange` immediately assigns that file to state before recording its error ([`src/components/PhotoSetForm.tsx:17-21`](../../src/components/PhotoSetForm.tsx)). Thus, after choosing a valid Before image, dropping or selecting `notes.txt` replaces the valid file, removes its preview, and disables Save. The input was identified as invalid, but the field was not preserved as the brief requires. Validate the candidate before committing it to `before`/`after` (or make `DropZone` reject it before invoking `onFileChange`) while still surfacing the error.

### Minor — no regression coverage for the preservation requirement or failed save

The two added tests prove initial enablement and invalid-drop messaging, but do not prove that picker and drop keep an existing valid file after a rejected selection, nor that rejected `onSave` preserves all fields. Adding these would protect the required behavior above.

## Task quality

Small, scoped implementation with clear component boundaries and no unrelated product-area changes. Test coverage hits the requested happy-path and invalid-drop examples, but it misses the most stateful requirement: rejection must not discard selected images.

## Review fix — preserve selected images on rejected input

### Root cause

`PhotoSetForm.handleFileChange` calculated the candidate file's validation error but then unconditionally stored that candidate in `before` or `after`. A rejected non-image therefore replaced the valid selected image and removed its browser preview.

### Red

Added picker and drop regression tests that select `before.png`, then provide `notes.txt`, and assert both the validation message and the retained `before.png` label. The picker test uses `userEvent.setup({ applyAccept: false })` so it exercises validation despite the input's `accept="image/*"` hint.

`npm test -- --run src/App.test.tsx` failed before the fix with 2 failures: the picker and drop preservation tests. Both failures showed `notes.txt` in the Before field and could not find `before.png`.

### Green

`handleFileChange` now records the candidate validation error and returns before mutating the corresponding file state. Valid candidates retain the existing update behavior.

Commands run after the fix:

- `npm test -- --run src/App.test.tsx`: 7 tests passed.
- `npm run build`: Vite build completed in 370ms.
- `git diff --check`: no output (clean).
