import { useEffect, useState } from 'react'
import type { PhotoSet } from '../types'
import { useAuth } from '../context/AuthContext'
import { DeletePhotoSetDialog } from './DeletePhotoSetDialog'

interface ThumbnailPairProps {
  photoSet: PhotoSet
  onEdit: (photoSet: PhotoSet) => void
  onDelete: (photoSet: PhotoSet) => void
  isPendingDelete?: boolean
  onConfirmDelete?: () => void
  onCancelDelete?: () => void
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function ThumbnailPair({
  photoSet,
  onEdit,
  onDelete,
  isPendingDelete,
  onConfirmDelete,
  onCancelDelete,
}: ThumbnailPairProps) {
  const { isAdmin } = useAuth()
  const [urls, setUrls] = useState<{ before: string; after: string } | null>(null)

  useEffect(() => {
    let beforeUrl = ''
    let afterUrl = ''
    let createdBeforeObj = false
    let createdAfterObj = false

    if (typeof photoSet.before === 'string') {
      beforeUrl = photoSet.before
    } else if (photoSet.beforeUrl) {
      beforeUrl = photoSet.beforeUrl
    } else if (photoSet.before instanceof Blob) {
      beforeUrl = URL.createObjectURL(photoSet.before)
      createdBeforeObj = true
    }

    if (typeof photoSet.after === 'string') {
      afterUrl = photoSet.after
    } else if (photoSet.afterUrl) {
      afterUrl = photoSet.afterUrl
    } else if (photoSet.after instanceof Blob) {
      afterUrl = URL.createObjectURL(photoSet.after)
      createdAfterObj = true
    }

    setUrls({ before: beforeUrl, after: afterUrl })

    return () => {
      if (createdBeforeObj && beforeUrl) URL.revokeObjectURL(beforeUrl)
      if (createdAfterObj && afterUrl) URL.revokeObjectURL(afterUrl)
    }
  }, [photoSet])

  if (!urls) return null

  return (
    <article className="thumbnail-pair">
      <header className="thumbnail-pair-header">
        <h3>{photoSet.name}</h3>
        {photoSet.description && <p className="thumbnail-pair-description">{photoSet.description}</p>}
      </header>
      <div className="thumbnail-pair-images">
        <img src={urls.before} alt={`${photoSet.name} before`} />
        <img src={urls.after} alt={`${photoSet.name} after`} />
      </div>
      <footer className="thumbnail-pair-footer">
        <span className="photo-date">
          {photoSet.takenAt ? `Taken ${formatDate(photoSet.takenAt)}` : `Created ${formatDate(photoSet.createdAt)}`}
        </span>
      </footer>
      {isAdmin && (
        <div className="thumbnail-pair-actions">
          <button type="button" onClick={() => onEdit(photoSet)}>Edit {photoSet.name}</button>
          <button type="button" onClick={() => onDelete(photoSet)}>Delete {photoSet.name}</button>
        </div>
      )}
      {isAdmin && isPendingDelete && onConfirmDelete && onCancelDelete && (
        <DeletePhotoSetDialog
          photoSet={photoSet}
          onConfirm={onConfirmDelete}
          onCancel={onCancelDelete}
        />
      )}
    </article>
  )
}
