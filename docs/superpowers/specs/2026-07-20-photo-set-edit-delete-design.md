# Photo Set Edit and Delete Design

## Goal

Allow visitors to revise or remove an existing named before-and-after set directly from an album history.

## Edit Interaction

- Every thumbnail pair has Edit and Delete controls.
- Edit reveals an inline draft form prefilled with the saved name and current Before and After previews.
- The visitor may change the name, replace either image, replace both, or keep both existing images.
- Save requires a nonblank name. Unreplaced image sides retain their saved blobs.
- Save updates the IndexedDB record, closes the editor, and refreshes the history.
- Cancel closes the editor and discards all draft changes without persistence.

## Delete Interaction

- Delete opens an accessible confirmation dialog that names the target set.
- Confirm removes the record from IndexedDB and refreshes the history.
- Cancel closes the dialog without deleting anything.

## Responsive Behavior

- On narrow viewports, thumbnail actions and edit controls stack full width with minimum 44px tap targets.
- On larger screens, actions are compact alongside the thumbnail title and image inputs remain side by side.

## Testing

Tests cover changing only the name, replacing one image while retaining the other, saving with no image replacement, cancelling edits, cancelling deletion, confirming deletion, and rendering responsive action controls.

## Exclusions

No bulk actions, undo, reordering, remote synchronization, automatic saving, or changes to album-level editing are included.
