import type { PhotoSet } from '../types'

interface DeletePhotoSetDialogProps {
  photoSet: PhotoSet
  onConfirm: () => void
  onCancel: () => void
}

export function DeletePhotoSetDialog({ photoSet, onConfirm, onCancel }: DeletePhotoSetDialogProps) {
  const title = `Delete ${photoSet.name}`

  return (
    <div className="delete-dialog" role="dialog" aria-modal="true" aria-label={title}>
      <h3>{title}</h3>
      <p>Delete “{photoSet.name}”? This cannot be undone.</p>
      <div className="form-actions">
        <button type="button" onClick={onCancel}>Cancel</button>
        <button type="button" onClick={onConfirm}>Delete</button>
      </div>
    </div>
  )
}
