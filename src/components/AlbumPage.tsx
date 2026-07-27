import { useEffect, useState } from 'react'
import { createPhotoSet, deleteAlbum, deletePhotoSet, listPhotoSets, updatePhotoSet } from '../catalogRepository'
import type { Album, PhotoSet } from '../types'
import { DeletePhotoSetDialog } from './DeletePhotoSetDialog'
import { PhotoSetForm } from './PhotoSetForm'
import { ThumbnailPair } from './ThumbnailPair'
import { useAuth } from '../context/AuthContext'

interface AlbumPageProps {
  album: Album
}

export function AlbumPage({ album }: AlbumPageProps) {
  const { isAdmin } = useAuth()
  const [photoSets, setPhotoSets] = useState<PhotoSet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [saveError, setSaveError] = useState('')
  const [activeEdit, setActiveEdit] = useState<PhotoSet | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<PhotoSet | null>(null)
  const [isDeletingAlbum, setIsDeletingAlbum] = useState(false)

  async function loadPhotoSets() {
    const loadedPhotoSets = await listPhotoSets(album.id)
    setPhotoSets(loadedPhotoSets)
    setIsLoading(false)
  }

  useEffect(() => {
    setIsLoading(true)
    void loadPhotoSets()
  }, [album.id])

  async function handleSave(name: string, description: string, before: File | null, after: File | null) {
    setSaveError('')
    try {
      if (activeEdit) {
        await updatePhotoSet({
          ...activeEdit,
          name,
          description,
          before: before ?? activeEdit.before,
          after: after ?? activeEdit.after,
        })
        setActiveEdit(null)
      } else if (before && after) {
        await createPhotoSet(album.id, name, before, after, description)
        setIsAdding(false)
      }
      await loadPhotoSets()
    } catch {
      setSaveError('Unable to save this Before & After.')
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return

    setSaveError('')
    try {
      await deletePhotoSet(pendingDelete.id, album.id)
      setPendingDelete(null)
      await loadPhotoSets()
    } catch {
      setSaveError('Unable to delete this Before & After.')
    }
  }

  return (
    <section className="album-page" aria-labelledby="album-heading">
      <a href="#/">← Back to albums</a>
      <div className="page-heading">
        <div>
          <h2 id="album-heading">{album.name}</h2>
          {album.description && <p className="album-description">{album.description}</p>}
          <p>Save before-and-after image pairs to this album.</p>
        </div>
        {isAdmin && !isAdding && !activeEdit && (
          <div className="album-actions">
            <button onClick={() => setIsAdding(true)}>+ Add Before & After</button>
            <button type="button" className="btn-delete-album" onClick={() => setIsDeletingAlbum(true)}>
              Delete Album
            </button>
          </div>
        )}
      </div>
      {isDeletingAlbum && (
        <div className="delete-dialog" role="dialog" aria-modal="true" aria-label="Delete Album">
          <h3>Delete Album</h3>
          <p>Are you sure you want to delete this album and all its Before & After entries?</p>
          <div className="form-actions">
            <button type="button" onClick={() => setIsDeletingAlbum(false)}>Cancel</button>
            <button
              type="button"
              className="btn-delete-album"
              onClick={async () => {
                await deleteAlbum(album.id)
                window.location.hash = '#/'
              }}
            >
              Delete Album
            </button>
          </div>
        </div>
      )}
      {isAdmin && (isAdding || activeEdit) && (
        <PhotoSetForm
          key={activeEdit?.id ?? 'new'}
          initialPhotoSet={activeEdit ?? undefined}
          submitLabel={activeEdit ? 'Save changes' : undefined}
          onCancel={activeEdit ? () => setActiveEdit(null) : () => setIsAdding(false)}
          onSave={handleSave}
        />
      )}
      {saveError && <p className="form-error" role="alert">{saveError}</p>}
      {!isLoading && photoSets.length === 0 && <p className="empty-state">No Before & After pairs in this album yet.</p>}
      {photoSets.length > 0 && (
        <div className="photo-set-history">
          {photoSets.map((photoSet) => (
            <ThumbnailPair
              key={photoSet.id}
              photoSet={photoSet}
              onEdit={setActiveEdit}
              onDelete={setPendingDelete}
              isPendingDelete={pendingDelete?.id === photoSet.id}
              onConfirmDelete={handleDelete}
              onCancelDelete={() => setPendingDelete(null)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
