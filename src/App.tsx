import { useEffect, useState } from 'react'
import { CatalogPage } from './components/CatalogPage'
import { createAlbum, listAlbums } from './catalogRepository'
import type { Album } from './types'
import './styles.css'

export function App() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    void listAlbums().then((loadedAlbums) => {
      setAlbums(loadedAlbums)
      setIsLoading(false)
    })
  }, [])

  async function handleCreateAlbum(name: string) {
    const album = await createAlbum(name)
    setAlbums((currentAlbums) => [...currentAlbums, album])
  }

  return (
    <main className="app-shell">
      <h1>Picture Catalog</h1>
      <CatalogPage albums={albums} isLoading={isLoading} onCreateAlbum={handleCreateAlbum} />
    </main>
  )
}
