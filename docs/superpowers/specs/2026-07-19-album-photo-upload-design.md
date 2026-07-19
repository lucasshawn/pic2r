# Album Photo Upload Design

## Goal

Allow an album visitor to create a named before-and-after photo set by dragging images into paired upload zones, then save it and immediately see it in the album history.

## Scope

- Add an upload area to each album page with a required set name and labelled Before and After zones.
- Each zone accepts an image through drag and drop or its click-to-browse file picker.
- Show an image preview in the relevant zone after selection; replacing a selection affects only that side.
- Keep Save photo set disabled until the name and both valid image selections are present.
- Persist the named pair as browser-local IndexedDB blobs only after Save photo set is selected.
- Clear the completed form after a successful save and refresh the album history immediately.
- Render all existing sets in the album as named pairs of Before and After thumbnails.

## Interaction

Drop zones visibly indicate drag-over state, accept only the first dropped file, and reject non-image files with an inline message. The file-picker fallback has the same validation behavior. A failed save retains all selected files and the name so the visitor can retry.

## Architecture

`AlbumPage` loads its photo sets using the existing repository. `PhotoSetForm` owns draft name, files, previews, drag state, and validation. `DropZone` is a focused reusable control for one labelled image side. `ThumbnailPair` renders each persisted photo set. The form returns a successful save to `AlbumPage`, which reloads the history.

## Testing

Browser-level component tests cover selecting or dropping image files, rejecting non-images, enabling Save only when valid, saving a named pair, refreshing the history, and rendering both thumbnail labels. Repository persistence remains covered by the existing IndexedDB test.

## Exclusions

No automatic saving, editing, deletion, reordering, image processing, remote uploads, shared storage, or changes to the full-size comparison view are included.
