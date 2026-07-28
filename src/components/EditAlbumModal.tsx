import React, { useState } from 'react'
import type { Album } from '../types'
import { validateAlbumName } from '../validation'

export interface EditAlbumModalProps {
  album: Album
  onClose: () => void
  onSave: (name: string, description?: string) => Promise<void> | void
}

export function EditAlbumModal({ album, onClose, onSave }: EditAlbumModalProps) {
  const [name, setName] = useState(album.name)
  const [description, setDescription] = useState(album.description ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validateAlbumName(name)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)
    try {
      await onSave(name.trim(), description.trim() || undefined)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content edit-album-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Edit Album"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Edit Album</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="edit-album-name">Album name</label>
            <input
              id="edit-album-name"
              aria-label="Album name"
              aria-describedby={error ? 'edit-album-name-error' : undefined}
              aria-invalid={Boolean(error)}
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError(null)
              }}
            />
            {error && (
              <p id="edit-album-name-error" className="form-error">
                {error}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="edit-album-description">Description (optional)</label>
            <textarea
              id="edit-album-description"
              aria-label="Description (optional)"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
