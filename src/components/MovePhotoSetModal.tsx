import React, { useState } from 'react'
import type { Album, PhotoSet } from '../types'

export interface MovePhotoSetModalProps {
  photoSet: PhotoSet
  currentAlbumId: string
  albums: Album[]
  onClose: () => void
  onConfirmMove: (targetAlbumId: string) => Promise<void> | void
}

export function MovePhotoSetModal({
  photoSet,
  currentAlbumId,
  albums,
  onClose,
  onConfirmMove,
}: MovePhotoSetModalProps) {
  const availableAlbums = albums.filter((a) => a.id !== currentAlbumId)
  const [selectedAlbumId, setSelectedAlbumId] = useState(availableAlbums[0]?.id ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAlbumId) return

    setIsSubmitting(true)
    try {
      await onConfirmMove(selectedAlbumId)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content move-photoset-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Move Before & After"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Move Before & After</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <p className="modal-description">
          Move “{photoSet.name}” to another album:
        </p>

        {availableAlbums.length === 0 ? (
          <div>
            <p className="empty-albums-message">No other albums available.</p>
            <div className="modal-actions">
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="target-album-select">Select Target Album</label>
              <select
                id="target-album-select"
                aria-label="Select Target Album"
                value={selectedAlbumId}
                onChange={(e) => setSelectedAlbumId(e.target.value)}
              >
                {availableAlbums.map((album) => (
                  <option key={album.id} value={album.id}>
                    {album.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-actions">
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedAlbumId}
                className="btn-primary"
              >
                {isSubmitting ? 'Moving...' : 'Move'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
