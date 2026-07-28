import { useEffect, useState } from 'react'
import type { PhotoSet } from '../types'

interface PhotoLightboxModalProps {
  photoSet: PhotoSet
  onClose: () => void
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

export function PhotoLightboxModal({ photoSet, onClose }: PhotoLightboxModalProps) {
  const [urls, setUrls] = useState<{ before: string; after: string } | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

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

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Enlarged Before & After view"
      className="lightbox-overlay"
      onClick={handleOverlayClick}
    >
      <div className="lightbox-modal">
        <button
          type="button"
          className="lightbox-close-btn"
          aria-label="Close enlarged view"
          onClick={onClose}
        >
          ✕
        </button>
        <div className="lightbox-images">
          <div className="image-wrapper">
            <span className="image-badge">BEFORE</span>
            <img src={urls.before} alt={`${photoSet.name} before`} />
          </div>
          <div className="image-wrapper">
            <span className="image-badge">AFTER</span>
            <img src={urls.after} alt={`${photoSet.name} after`} />
          </div>
        </div>
        <div className="lightbox-info">
          <h3>{photoSet.name}</h3>
          <span className="photo-date">
            {photoSet.takenAt
              ? `Taken ${formatDate(photoSet.takenAt)}`
              : `Created ${formatDate(photoSet.createdAt)}`}
          </span>
          {photoSet.description && (
            <p className="lightbox-description">{photoSet.description}</p>
          )}
        </div>
      </div>
    </div>
  )
}
