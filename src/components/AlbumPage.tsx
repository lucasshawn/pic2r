import type { Album } from '../types'

interface AlbumPageProps {
  album: Album
}

export function AlbumPage({ album }: AlbumPageProps) {
  return (
    <section aria-labelledby="album-heading">
      <a href="#/">← Back to albums</a>
      <div className="page-heading">
        <div>
          <h2 id="album-heading">{album.name}</h2>
          <p>Photo sets will appear here.</p>
        </div>
      </div>
    </section>
  )
}
