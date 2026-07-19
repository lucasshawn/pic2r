import { useState } from 'react'
import type { Album } from '../types'
import { AlbumForm } from './AlbumForm'

interface CatalogPageProps {
  albums: Album[]
  isLoading: boolean
  onCreateAlbum: (name: string) => Promise<void>
}

export function CatalogPage({ albums, isLoading, onCreateAlbum }: CatalogPageProps) {
  const [isCreating, setIsCreating] = useState(false)

  async function handleSave(name: string) {
    await onCreateAlbum(name)
    setIsCreating(false)
  }

  return (
    <section aria-labelledby="catalog-heading">
      <div className="page-heading">
        <div>
          <h2 id="catalog-heading">Albums</h2>
          <p>Organize before-and-after photos by project.</p>
        </div>
        {!isCreating && <button onClick={() => setIsCreating(true)}>Create album</button>}
      </div>

      {isCreating && <AlbumForm onCancel={() => setIsCreating(false)} onSave={handleSave} />}

      {isLoading ? (
        <p className="empty-state" role="status">Loading albums…</p>
      ) : albums.length === 0 ? (
        <p className="empty-state">No albums yet. Create an album to start your catalog.</p>
      ) : (
        <div className="album-grid">
          {albums.map((album) => (
            <a className="album-card" href={`#/albums/${album.id}`} key={album.id}>
              <h3>{album.name}</h3>
              <span>View album</span>
            </a>
          ))}
        </div>
      )}
    </section>
  )
}
