import { useEffect, useState } from 'react'
import { CatalogPage } from './components/CatalogPage'
import { AlbumPage } from './components/AlbumPage'
import { Header } from './components/Header'
import { AuthProvider } from './context/AuthContext'
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

  async function handleCreateAlbum(name: string, description?: string) {
    const album = await createAlbum(name, description)
    setAlbums((currentAlbums) => [...currentAlbums, album])
  }

  const selectedAlbum = albums.find((album) => album.id === albumId)

  return (
    <AuthProvider>
      <Header />
      <main className="app-shell">
        {selectedAlbum ? (
          <AlbumPage album={selectedAlbum} />
        ) : (
          <CatalogPage albums={albums} isLoading={isLoading} onCreateAlbum={handleCreateAlbum} />
        )}
      </main>
    </AuthProvider>
  )
}
