import { useEffect, useState } from 'react'
import { createPhotoSet, deletePhotoSet, listPhotoSets, updatePhotoSet } from '../catalogRepository'
import type { Album, PhotoSet } from '../types'
import { DeletePhotoSetDialog } from './DeletePhotoSetDialog'
import { PhotoSetForm } from './PhotoSetForm'
import { ThumbnailPair } from './ThumbnailPair'

interface AlbumPageProps {
  album: Album
}

export function AlbumPage({ album }: AlbumPageProps) {
  const [photoSets, setPhotoSets] = useState<PhotoSet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [saveError, setSaveError] = useState('')
  const [activeEdit, setActiveEdit] = useState<PhotoSet | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PhotoSet | null>(null)

  async function loadPhotoSets() {
    const loadedPhotoSets = await listPhotoSets(album.id)
    setPhotoSets(loadedPhotoSets)
    setIsLoading(false)
  }

  useEffect(() => {
    setIsLoading(true)
    void loadPhotoSets()
  }, [album.id])

  async function handleSave(name: string, before: File | null, after: File | null) {
    setSaveError('')
    try {
      if (activeEdit) {
        await updatePhotoSet({
          ...activeEdit,
          name,
          before: before ?? activeEdit.before,
          after: after ?? activeEdit.after,
        })
        setActiveEdit(null)
      } else if (before && after) {
        await createPhotoSet(album.id, name, before, after)
      }
      await loadPhotoSets()
    } catch {
      setSaveError('Unable to save this photo set.')
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return

    setSaveError('')
    try {
      await deletePhotoSet(pendingDelete.id)
      setPendingDelete(null)
      await loadPhotoSets()
    } catch {
      setSaveError('Unable to delete this photo set.')
    }
  }

  return (
    <section aria-labelledby="album-heading">
      <a href="#/">← Back to albums</a>
      <div className="page-heading">
        <div>
          <h2 id="album-heading">{album.name}</h2>
          <p>Save before-and-after image pairs to this album.</p>
        </div>
      </div>
      <PhotoSetForm
        key={activeEdit?.id ?? 'new'}
        initialPhotoSet={activeEdit ?? undefined}
        submitLabel={activeEdit ? 'Save changes' : undefined}
        onCancel={activeEdit ? () => setActiveEdit(null) : undefined}
        onSave={handleSave}
      />
      {saveError && <p className="form-error" role="alert">{saveError}</p>}
      {pendingDelete && (
        <DeletePhotoSetDialog
          photoSet={pendingDelete}
          onCancel={() => setPendingDelete(null)}
          onConfirm={handleDelete}
        />
      )}
      {!isLoading && photoSets.length === 0 && <p className="empty-state">No photo sets yet.</p>}
      {photoSets.length > 0 && (
        <div className="photo-set-history">
          {photoSets.map((photoSet) => (
            <ThumbnailPair key={photoSet.id} photoSet={photoSet} onEdit={setActiveEdit} onDelete={setPendingDelete} />
          ))}
        </div>
      )}
    </section>
  )
}
