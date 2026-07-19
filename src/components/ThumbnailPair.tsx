import { useEffect, useState } from 'react'
import type { PhotoSet } from '../types'

interface ThumbnailPairProps {
  photoSet: PhotoSet
}

export function ThumbnailPair({ photoSet }: ThumbnailPairProps) {
  const [urls, setUrls] = useState<{ before: string; after: string } | null>(null)

  useEffect(() => {
    const before = URL.createObjectURL(photoSet.before)
    const after = URL.createObjectURL(photoSet.after)
    setUrls({ before, after })

    return () => {
      URL.revokeObjectURL(before)
      URL.revokeObjectURL(after)
    }
  }, [photoSet])

  if (!urls) return null

  return (
    <article className="thumbnail-pair">
      <h3>{photoSet.name}</h3>
      <div className="thumbnail-pair-images">
        <img src={urls.before} alt={`${photoSet.name} before`} />
        <img src={urls.after} alt={`${photoSet.name} after`} />
      </div>
    </article>
  )
}
