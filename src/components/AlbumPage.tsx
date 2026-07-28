import { useEffect, useState } from 'react'
import { createPhotoSet, deleteAlbum, deletePhotoSet, listPhotoSets, movePhotoSet, reorderPhotoSets, updateAlbum, updatePhotoSet } from '../catalogRepository'
import type { Album, PhotoSet } from '../types'
import { DeletePhotoSetDialog } from './DeletePhotoSetDialog'
import { EditAlbumModal } from './EditAlbumModal'
import { MovePhotoSetModal } from './MovePhotoSetModal'
import { PhotoLightboxModal } from './PhotoLightboxModal'
import { PhotoSetForm } from './PhotoSetForm'
import { ThumbnailPair } from './ThumbnailPair'
import { useAuth } from '../context/AuthContext'

interface AlbumPageProps {
  album: Album
  albums?: Album[]
  onDeleteAlbum?: (albumId: string) => void
  onUpdateAlbum?: (album: Album) => void
}

export function AlbumPage({ album, albums, onDeleteAlbum, onUpdateAlbum }: AlbumPageProps) {
  const { isAdmin } = useAuth()
  const [currentAlbum, setCurrentAlbum] = useState<Album>(album)
  const [photoSets, setPhotoSets] = useState<PhotoSet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [saveError, setSaveError] = useState('')
  const [activeEdit, setActiveEdit] = useState<PhotoSet | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [isEditingAlbum, setIsEditingAlbum] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<PhotoSet | null>(null)
  const [isDeletingAlbum, setIsDeletingAlbum] = useState(false)
  const [movingPhotoSet, setMovingPhotoSet] = useState<PhotoSet | null>(null)
  const [activeLightboxSet, setActiveLightboxSet] = useState<PhotoSet | null>(null)

  useEffect(() => {
    setCurrentAlbum(album)
  }, [album])

  async function loadPhotoSets() {
    const loadedPhotoSets = await listPhotoSets(currentAlbum.id)
    setPhotoSets(loadedPhotoSets)
    setIsLoading(false)
  }

  useEffect(() => {
    setIsLoading(true)
    void loadPhotoSets()
  }, [currentAlbum.id])

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
        await createPhotoSet(currentAlbum.id, name, before, after, description)
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
      await deletePhotoSet(pendingDelete.id, currentAlbum.id)
      setPendingDelete(null)
      await loadPhotoSets()
    } catch {
      setSaveError('Unable to delete this Before & After.')
    }
  }

  async function handleMoveUp(index: number) {
    if (index <= 0) return
    const newPhotoSets = [...photoSets]
    const temp = newPhotoSets[index]
    newPhotoSets[index] = newPhotoSets[index - 1]
    newPhotoSets[index - 1] = temp
    setPhotoSets(newPhotoSets)
    const newOrderedIds = newPhotoSets.map((ps) => ps.id)
    await reorderPhotoSets(currentAlbum.id, newOrderedIds)
  }

  async function handleMoveDown(index: number) {
    if (index >= photoSets.length - 1) return
    const newPhotoSets = [...photoSets]
    const temp = newPhotoSets[index]
    newPhotoSets[index] = newPhotoSets[index + 1]
    newPhotoSets[index + 1] = temp
    setPhotoSets(newPhotoSets)
    const newOrderedIds = newPhotoSets.map((ps) => ps.id)
    await reorderPhotoSets(currentAlbum.id, newOrderedIds)
  }

  async function handleConfirmMove(targetAlbumId: string) {
    if (!movingPhotoSet) return
    await movePhotoSet(movingPhotoSet.id, currentAlbum.id, targetAlbumId)
    setPhotoSets((prev) => prev.filter((ps) => ps.id !== movingPhotoSet.id))
    setMovingPhotoSet(null)
  }

  return (
    <section className="album-page" aria-labelledby="album-heading">
      <a href="#/">← Back to albums</a>
      <div className="page-heading">
        <div>
          <h2 id="album-heading">{currentAlbum.name}</h2>
          {currentAlbum.description ? (
            <p className="album-description">{currentAlbum.description}</p>
          ) : (
            <p>Save before-and-after image pairs to this album.</p>
          )}
        </div>
        {isAdmin && !isAdding && !activeEdit && (
          <div className="album-actions">
            <button type="button" onClick={() => setIsEditingAlbum(true)}>
              Edit Album
            </button>
            <button type="button" onClick={() => setIsAdding(true)}>+ Add Before & After</button>
            <button type="button" className="btn-delete-album" onClick={() => setIsDeletingAlbum(true)}>
              Delete Album
            </button>
          </div>
        )}
      </div>
      {isEditingAlbum && (
        <EditAlbumModal
          album={currentAlbum}
          onClose={() => setIsEditingAlbum(false)}
          onSave={async (name, description) => {
            const updated = await updateAlbum(currentAlbum.id, name, description)
            setCurrentAlbum(updated)
            onUpdateAlbum?.(updated)
            setIsEditingAlbum(false)
          }}
        />
      )}
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
                await deleteAlbum(currentAlbum.id)
                onDeleteAlbum?.(currentAlbum.id)
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
          {photoSets.map((photoSet, index) => (
            <ThumbnailPair
              key={photoSet.id}
              photoSet={photoSet}
              onSelect={setActiveLightboxSet}
              onEdit={setActiveEdit}
              onDelete={setPendingDelete}
              isPendingDelete={pendingDelete?.id === photoSet.id}
              onConfirmDelete={handleDelete}
              onCancelDelete={() => setPendingDelete(null)}
              canMoveUp={index > 0}
              canMoveDown={index < photoSets.length - 1}
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
              onOpenMoveModal={() => setMovingPhotoSet(photoSet)}
            />
          ))}
        </div>
      )}
      {movingPhotoSet && (
        <MovePhotoSetModal
          photoSet={movingPhotoSet}
          currentAlbumId={currentAlbum.id}
          albums={albums || []}
          onClose={() => setMovingPhotoSet(null)}
          onConfirmMove={handleConfirmMove}
        />
      )}
      {activeLightboxSet && (
        <PhotoLightboxModal
          photoSet={activeLightboxSet}
          onClose={() => setActiveLightboxSet(null)}
        />
      )}
    </section>
  )
}
