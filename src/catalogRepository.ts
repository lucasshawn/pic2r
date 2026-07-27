import type { Album, PhotoSet, UploadUrlsResponse } from './types'
import { convertHeicToJpeg } from './heicHelper'

// In-memory fallback for local dev / offline / test environment when server API is unavailable
const memoryAlbums: Album[] = []
const memoryPhotoSets: Map<string, PhotoSet[]> = new Map()
const photoSetAlbumMap: Map<string, string> = new Map()

export function resetMemoryCatalog(): void {
  memoryAlbums.length = 0
  memoryPhotoSets.clear()
  photoSetAlbumMap.clear()
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, options)
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

function formatPhotoSet(ps: any): PhotoSet {
  const beforeUrl = ps.beforeUrl || (typeof ps.before === 'string' ? ps.before : '')
  const afterUrl = ps.afterUrl || (typeof ps.after === 'string' ? ps.after : '')
  const formatted: PhotoSet = {
    ...ps,
    beforeUrl,
    afterUrl,
    before: ps.before ?? beforeUrl,
    after: ps.after ?? afterUrl,
  }
  if (formatted.id && formatted.albumId) {
    photoSetAlbumMap.set(formatted.id, formatted.albumId)
  }
  return formatted
}

export async function listAlbums(): Promise<Album[]> {
  const data = await apiFetch<Album[]>('/api/albums')
  if (data !== null) {
    return data
  }
  return [...memoryAlbums].sort((a, b) => a.createdAt - b.createdAt)
}

export async function createAlbum(name: string): Promise<Album> {
  const data = await apiFetch<Album>('/api/albums', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })

  if (data !== null) {
    return data
  }

  // Fallback
  const newAlbum: Album = {
    id: crypto.randomUUID(),
    name,
    createdAt: Date.now(),
  }
  memoryAlbums.push(newAlbum)
  return newAlbum
}

export async function getAlbum(id: string): Promise<Album | undefined> {
  const albums = await listAlbums()
  return albums.find((a) => a.id === id)
}

export async function listPhotoSets(albumId: string): Promise<PhotoSet[]> {
  const data = await apiFetch<PhotoSet[]>(`/api/albums/${albumId}/photos`)
  if (data !== null) {
    return data.map(formatPhotoSet).sort((a, b) => a.createdAt - b.createdAt)
  }
  const sets = memoryPhotoSets.get(albumId) || []
  return [...sets].map(formatPhotoSet).sort((a, b) => a.createdAt - b.createdAt)
}

export async function createPhotoSet(
  albumId: string,
  name: string,
  before: Blob,
  after: Blob,
): Promise<PhotoSet> {
  if (before instanceof File) {
    before = await convertHeicToJpeg(before)
  }
  if (after instanceof File) {
    after = await convertHeicToJpeg(after)
  }

  // Step 1: Request pre-signed URLs
  const uploadUrlsRes = await apiFetch<UploadUrlsResponse>(
    `/api/albums/${albumId}/photos/upload-urls`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        beforeFileName: before instanceof File ? before.name : 'before.jpg',
        afterFileName: after instanceof File ? after.name : 'after.jpg',
      }),
    },
  )

  if (uploadUrlsRes) {
    const { photoSetId, beforeUploadUrl, beforeKey, afterUploadUrl, afterKey } = uploadUrlsRes

    // Direct PUT upload to R2
    if (beforeUploadUrl) {
      await fetch(beforeUploadUrl, {
        method: 'PUT',
        body: before,
        headers: { 'Content-Type': before.type || 'application/octet-stream' },
      })
    }
    if (afterUploadUrl) {
      await fetch(afterUploadUrl, {
        method: 'PUT',
        body: after,
        headers: { 'Content-Type': after.type || 'application/octet-stream' },
      })
    }

    const beforeUrl = beforeKey ? `/api/image/${beforeKey}` : ''
    const afterUrl = afterKey ? `/api/image/${afterKey}` : ''

    const saveRes = await apiFetch<PhotoSet>(`/api/albums/${albumId}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photoSet: {
          id: photoSetId,
          albumId,
          name,
          beforeUrl,
          afterUrl,
          beforeKey,
          afterKey,
        },
      }),
    })

    if (saveRes) {
      return formatPhotoSet(saveRes)
    }
  }

  // Fallback
  const newSet: PhotoSet = {
    id: crypto.randomUUID(),
    albumId,
    name,
    beforeUrl: '',
    afterUrl: '',
    before,
    after,
    createdAt: Date.now(),
  }
  const existing = memoryPhotoSets.get(albumId) || []
  existing.push(newSet)
  memoryPhotoSets.set(albumId, existing)
  photoSetAlbumMap.set(newSet.id, albumId)
  return newSet
}

export async function updatePhotoSet(photoSet: PhotoSet): Promise<PhotoSet> {
  let updatedBefore = photoSet.before
  let updatedAfter = photoSet.after

  if (updatedBefore instanceof File) {
    updatedBefore = await convertHeicToJpeg(updatedBefore)
  }
  if (updatedAfter instanceof File) {
    updatedAfter = await convertHeicToJpeg(updatedAfter)
  }

  const normalizedPhotoSet: PhotoSet = {
    ...photoSet,
    before: updatedBefore,
    after: updatedAfter,
  }

  let beforeUrl = normalizedPhotoSet.beforeUrl
  let afterUrl = normalizedPhotoSet.afterUrl
  let beforeKey = normalizedPhotoSet.beforeKey
  let afterKey = normalizedPhotoSet.afterKey

  // Check if before or after were updated with new File/Blob objects
  const hasNewBefore = normalizedPhotoSet.before instanceof Blob
  const hasNewAfter = normalizedPhotoSet.after instanceof Blob

  if (hasNewBefore || hasNewAfter) {
    const uploadUrlsRes = await apiFetch<UploadUrlsResponse>(
      `/api/albums/${photoSet.albumId}/photos/upload-urls`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beforeFileName: hasNewBefore
            ? photoSet.before instanceof File
              ? photoSet.before.name
              : 'before.png'
            : undefined,
          afterFileName: hasNewAfter
            ? photoSet.after instanceof File
              ? photoSet.after.name
              : 'after.png'
            : undefined,
        }),
      },
    )

    if (uploadUrlsRes) {
      if (hasNewBefore && uploadUrlsRes.beforeUploadUrl) {
        await fetch(uploadUrlsRes.beforeUploadUrl, {
          method: 'PUT',
          body: photoSet.before as Blob,
          headers: {
            'Content-Type': (photoSet.before as Blob).type || 'application/octet-stream',
          },
        })
        beforeKey = uploadUrlsRes.beforeKey
      }
      if (hasNewAfter && uploadUrlsRes.afterUploadUrl) {
        await fetch(uploadUrlsRes.afterUploadUrl, {
          method: 'PUT',
          body: photoSet.after as Blob,
          headers: {
            'Content-Type': (photoSet.after as Blob).type || 'application/octet-stream',
          },
        })
        afterKey = uploadUrlsRes.afterKey
      }
      if (beforeKey) beforeUrl = `/api/image/${beforeKey}`
      if (afterKey) afterUrl = `/api/image/${afterKey}`
    }
  }

  const saveRes = await apiFetch<PhotoSet>(`/api/albums/${photoSet.albumId}/photos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      photoSet: {
        id: photoSet.id,
        albumId: photoSet.albumId,
        name: photoSet.name,
        beforeUrl,
        afterUrl,
        beforeKey,
        afterKey,
        createdAt: photoSet.createdAt,
      },
    }),
  })

  if (saveRes) {
    return formatPhotoSet(saveRes)
  }

  // Fallback
  const existing = memoryPhotoSets.get(photoSet.albumId) || []
  const idx = existing.findIndex((s) => s.id === photoSet.id)
  if (idx >= 0) {
    existing[idx] = photoSet
  } else {
    existing.push(photoSet)
  }
  memoryPhotoSets.set(photoSet.albumId, existing)
  photoSetAlbumMap.set(photoSet.id, photoSet.albumId)
  return photoSet
}

export async function deletePhotoSet(id: string, albumId?: string): Promise<void> {
  let targetAlbumId = albumId || photoSetAlbumMap.get(id)
  if (!targetAlbumId) {
    for (const [aId, sets] of memoryPhotoSets.entries()) {
      if (sets.some((s) => s.id === id)) {
        targetAlbumId = aId
        break
      }
    }
  }

  if (targetAlbumId) {
    await apiFetch(`/api/albums/${targetAlbumId}/photos/${id}`, { method: 'DELETE' })
    const existing = memoryPhotoSets.get(targetAlbumId) || []
    memoryPhotoSets.set(
      targetAlbumId,
      existing.filter((s) => s.id !== id),
    )
    photoSetAlbumMap.delete(id)
  }
}
