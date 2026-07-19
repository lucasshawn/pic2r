import { useEffect, useState } from 'react'
import { createPhotoSet, listPhotoSets } from '../catalogRepository'
import type { Album, PhotoSet } from '../types'
import { PhotoSetForm } from './PhotoSetForm'
import { ThumbnailPair } from './ThumbnailPair'

interface AlbumPageProps {
  album: Album
}

export function AlbumPage({ album }: AlbumPageProps) {
  const [photoSets, setPhotoSets] = useState<PhotoSet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [saveError, setSaveError] = useState('')

  async function loadPhotoSets() {
    const loadedPhotoSets = await listPhotoSets(album.id)
    setPhotoSets(loadedPhotoSets)
    setIsLoading(false)
  }

  useEffect(() => {
    setIsLoading(true)
    void loadPhotoSets()
  }, [album.id])

  async function handleSave(name: string, before: File, after: File) {
    setSaveError('')
    try {
      await createPhotoSet(album.id, name, before, after)
      await loadPhotoSets()
    } catch {
      setSaveError('Unable to save this photo set.')
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
      <PhotoSetForm onSave={handleSave} />
      {saveError && <p className="form-error" role="alert">{saveError}</p>}
      {!isLoading && photoSets.length === 0 && <p className="empty-state">No photo sets yet.</p>}
      {photoSets.length > 0 && (
        <div className="photo-set-history">
          {photoSets.map((photoSet) => <ThumbnailPair key={photoSet.id} photoSet={photoSet} />)}
        </div>
      )}
    </section>
  )
}
