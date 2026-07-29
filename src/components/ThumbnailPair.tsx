import { useEffect, useState } from 'react'
import type { PhotoSet } from '../types'
import { useAuth } from '../context/AuthContext'
import { DeletePhotoSetDialog } from './DeletePhotoSetDialog'

interface ThumbnailPairProps {
  photoSet: PhotoSet
  onSelect?: (photoSet: PhotoSet) => void
  onEdit: (photoSet: PhotoSet) => void
  onDelete: (photoSet: PhotoSet) => void
  isPendingDelete?: boolean
  onConfirmDelete?: () => void
  onCancelDelete?: () => void
  canMoveUp?: boolean
  canMoveDown?: boolean
  onMoveUp?: () => void
  onMoveDown?: () => void
  onOpenMoveModal?: () => void
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
  onSelect,
  onEdit,
  onDelete,
  isPendingDelete,
  onConfirmDelete,
  onCancelDelete,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onOpenMoveModal,
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

    if (typeof photoSet.after === 'string' && photoSet.after.trim() !== '') {
      afterUrl = photoSet.after
    } else if (photoSet.afterUrl && photoSet.afterUrl.trim() !== '') {
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

  const isPair = Boolean(urls.after && urls.after.trim() !== '')

  return (
    <article className="thumbnail-pair">
      <header className="thumbnail-pair-header">
        <h3>{photoSet.name}</h3>
      </header>
      <div
        className="thumbnail-pair-media-trigger"
        role="button"
        tabIndex={0}
        onClick={() => onSelect?.(photoSet)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect?.(photoSet)
          }
        }}
      >
        {isPair ? (
          <div className="thumbnail-pair-images">
            <div className="image-wrapper">
              <span className="image-badge">BEFORE</span>
              <img src={urls.before} alt={`${photoSet.name} before`} />
            </div>
            <div className="image-wrapper">
              <span className="image-badge">AFTER</span>
              <img src={urls.after} alt={`${photoSet.name} after`} />
            </div>
          </div>
        ) : (
          <div className="single-image-wrapper">
            <img src={urls.before} alt={photoSet.name} />
          </div>
        )}
      </div>
      {photoSet.description && (
        <div className="thumbnail-pair-caption">
          <span className="caption-title">{photoSet.name}</span>
          <p className="thumbnail-pair-description">{photoSet.description}</p>
        </div>
      )}
      <footer className="thumbnail-pair-footer">
        <span className="photo-date">
          {photoSet.takenAt ? `Taken ${formatDate(photoSet.takenAt)}` : `Created ${formatDate(photoSet.createdAt)}`}
        </span>
      </footer>
      {isAdmin && (
        <div className="thumbnail-pair-actions">
          <button type="button" onClick={onMoveUp} disabled={!canMoveUp}>
            ← Move
          </button>
          <button type="button" onClick={onMoveDown} disabled={!canMoveDown}>
            Move →
          </button>
          <button type="button" onClick={onOpenMoveModal}>
            Move to Album...
          </button>
          <button type="button" onClick={() => onEdit(photoSet)}>
            Edit {photoSet.name}
          </button>
          <button type="button" onClick={() => onDelete(photoSet)}>
            Delete {photoSet.name}
          </button>
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
