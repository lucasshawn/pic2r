# Album Upload Panel and Mobile Design

## Goal

Keep album history visible by default, reveal the before-and-after uploader only when requested, and make the complete album experience comfortable on mobile devices.

## Interaction

- Place a `+ Add photos` button beside the album title.
- Selecting it reveals the named paired-image upload form.
- The form has a Cancel action that clears name, images, previews, and errors before hiding the form.
- A successful save also clears and hides the form; the refreshed thumbnail history remains visible.
- The form is not rendered while closed, so unfinished state cannot remain visible.

## Responsive Behavior

- Keep main content fluid with a constrained desktop maximum width.
- On viewports 36rem and narrower, header controls are full width, upload zones stack vertically, thumbnail history has one column, and buttons have a minimum 44px tap target.
- On larger screens, paired upload zones and thumbnail images remain side by side.

## Testing

Component tests cover opening the upload panel, Cancel clearing a drafted set, and successful save closing the panel. CSS contains the mobile breakpoint rules for stacked zones, single-column history, and touch targets.

## Exclusions

No modal uploader, automatic save, draft persistence, editing, deletion, or changes to IndexedDB storage are included.
