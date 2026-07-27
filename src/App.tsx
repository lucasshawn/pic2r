import { useEffect, useState } from 'react'
import { CatalogPage } from './components/CatalogPage'
import { AlbumPage } from './components/AlbumPage'
import { Header } from './components/Header'
import { SettingsModal } from './components/SettingsModal'
import { AuthProvider } from './context/AuthContext'
import { createAlbum, listAlbums } from './catalogRepository'
import type { Album } from './types'
import './styles.css'

export function App() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [albumId, setAlbumId] = useState(() => window.location.hash.replace('#/albums/', ''))
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  async function refreshAlbums() {
    const loadedAlbums = await listAlbums()
    setAlbums(loadedAlbums)
  }

  useEffect(() => {
    void refreshAlbums().finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    function handleHashChange() {
      setAlbumId(window.location.hash.replace('#/albums/', ''))
      void refreshAlbums()
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  async function handleCreateAlbum(name: string, description?: string) {
    const album = await createAlbum(name, description)
    setAlbums((currentAlbums) => [...currentAlbums, album])
  }

  function handleDeleteAlbum(deletedId: string) {
    setAlbums((currentAlbums) => currentAlbums.filter((a) => a.id !== deletedId))
    void refreshAlbums()
  }

  const selectedAlbum = albums.find((album) => album.id === albumId)

  return (
    <AuthProvider>
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />
      <main className="app-shell">
        {selectedAlbum ? (
          <AlbumPage album={selectedAlbum} onDeleteAlbum={handleDeleteAlbum} />
        ) : (
          <CatalogPage albums={albums} isLoading={isLoading} onCreateAlbum={handleCreateAlbum} />
        )}
      </main>
      {isSettingsOpen && (
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      )}
    </AuthProvider>
  )
}
