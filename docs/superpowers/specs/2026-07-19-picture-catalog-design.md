# Picture Catalog Design

## Goal

Create a local web application for browsing albums of named before-and-after photo sets. Any visitor to the local URL can create albums and upload photos.

## Scope

- Start with an empty album catalog and a clear Create album action.
- Navigate from the catalog to an album by its name.
- In an album, add a named photo set by supplying one Before image and one After image.
- Show saved photo sets as labelled thumbnail pairs.
- Open a selected set in a modal that presents Before and After images side by side at a large size.
- Persist albums, metadata, and image blobs in the browser with IndexedDB, so a refresh on the same browser retains the catalog.
- Validate required names, image type, and both required photos before saving.
- Keep all creation and upload controls available to any visitor of the local URL.

## Out of Scope

- Accounts, authentication, or permissions.
- Shared storage between browsers or devices.
- Hosting or a production backend.
- Editing, deleting, reordering, or image manipulation.

## Architecture

Use a React single-page application built with Vite. Route state is maintained in the client and uses the URL hash for album navigation. A small repository layer isolates IndexedDB reads and writes from UI components.

The main UI pieces are CatalogPage, AlbumPage, AlbumForm, PhotoSetForm, ThumbnailPair, and ComparisonModal. The persistence layer stores Albums and PhotoSets; each PhotoSet stores its Before and After image Blob with the set metadata. UI previews use temporary object URLs and release them when no longer required.

## User Flow

1. A visitor opens the empty catalog and chooses Create album.
2. They enter an album name and are taken to that album.
3. They choose Add photo set, enter a set name, and select a Before and an After image.
4. The app previews the selections, validates the form, and stores the completed set locally.
5. The saved thumbnail pair appears under its name.
6. Selecting the pair opens a labelled, full-size side-by-side comparison. Escape, backdrop click, and the close control dismiss the modal.

## Error Handling

The application provides inline, accessible messages for blank names, unsupported image files, missing image selections, failed local storage writes, and an album URL that does not exist. A failed save leaves form data in place so the visitor can retry.

## Testing

Unit tests cover the model validation and IndexedDB repository behavior. Browser-level tests cover the primary journey: creating an album, saving a photo set with two image files, seeing its labelled thumbnails, and opening/dismissing the comparison modal.

## Future Hosting

The repository interface is the boundary for replacing browser-only persistence with shared hosted storage. No server implementation is included in this version.
