import { useEffect, useState } from 'react'
import { CatalogPage } from './components/CatalogPage'
import { AlbumPage } from './components/AlbumPage'
import { createAlbum, listAlbums } from './catalogRepository'
import type { Album } from './types'
import './styles.css'

export function App() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [albumId, setAlbumId] = useState(() => window.location.hash.replace('#/albums/', ''))

  useEffect(() => {
    void listAlbums().then((loadedAlbums) => {
      setAlbums(loadedAlbums)
      setIsLoading(false)
    })
  }, [])

  useEffect(() => {
    function handleHashChange() {
      setAlbumId(window.location.hash.replace('#/albums/', ''))
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  async function handleCreateAlbum(name: string) {
    const album = await createAlbum(name)
    setAlbums((currentAlbums) => [...currentAlbums, album])
  }

  const selectedAlbum = albums.find((album) => album.id === albumId)

  return (
    <main className="app-shell">
      <h1>Picture Catalog</h1>
      {selectedAlbum ? (
        <AlbumPage album={selectedAlbum} />
      ) : (
        <CatalogPage albums={albums} isLoading={isLoading} onCreateAlbum={handleCreateAlbum} />
      )}
    </main>
  )
}
