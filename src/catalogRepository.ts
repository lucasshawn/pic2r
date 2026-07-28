import type { Album, PhotoSet, UploadUrlsResponse } from './types'
import { convertHeicToJpeg } from './heicHelper'
import { getPhotoCreationDate } from './exifHelper'

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

export async function createAlbum(name: string, description?: string): Promise<Album> {
  const data = await apiFetch<Album>('/api/albums', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description }),
  })

  if (data !== null) {
    return data
  }

  // Fallback
  const newAlbum: Album = {
    id: crypto.randomUUID(),
    name,
    description,
    createdAt: Date.now(),
  }
  memoryAlbums.push(newAlbum)
  return newAlbum
}

export async function getAlbum(id: string): Promise<Album | undefined> {
  const albums = await listAlbums()
  return albums.find((a) => a.id === id)
}

export async function updateAlbum(id: string, name: string, description?: string): Promise<Album> {
  const data = await apiFetch<Album>(`/api/albums/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description }),
  })

  if (data !== null) {
    const idx = memoryAlbums.findIndex((a) => a.id === id)
    if (idx >= 0) {
      memoryAlbums[idx] = data
    } else {
      memoryAlbums.push(data)
    }
    return data
  }

  // Fallback
  const idx = memoryAlbums.findIndex((a) => a.id === id)
  if (idx >= 0) {
    const updatedAlbum: Album = {
      ...memoryAlbums[idx],
      name,
      ...(description !== undefined ? { description } : {}),
    }
    memoryAlbums[idx] = updatedAlbum
    return updatedAlbum
  }

  const newAlbum: Album = {
    id,
    name,
    description,
    createdAt: Date.now(),
  }
  memoryAlbums.push(newAlbum)
  return newAlbum
}

export async function deleteAlbum(id: string): Promise<void> {
  await apiFetch(`/api/albums/${id}`, { method: 'DELETE' })
  const idx = memoryAlbums.findIndex((a) => a.id === id)
  if (idx >= 0) memoryAlbums.splice(idx, 1)
  memoryPhotoSets.delete(id)
}

export async function listPhotoSets(albumId: string): Promise<PhotoSet[]> {
  const data = await apiFetch<PhotoSet[]>(`/api/albums/${albumId}/photos`)
  if (data !== null) {
    return data.map(formatPhotoSet)
  }
  const sets = memoryPhotoSets.get(albumId) || []
  return [...sets].map(formatPhotoSet)
}

export async function reorderPhotoSets(albumId: string, photoSetIds: string[]): Promise<PhotoSet[]> {
  const data = await apiFetch<PhotoSet[]>(`/api/albums/${albumId}/photos/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ photoSetIds }),
  })

  if (data !== null) {
    const formatted = data.map(formatPhotoSet)
    memoryPhotoSets.set(albumId, formatted)
    return formatted
  }

  const existing = memoryPhotoSets.get(albumId) || []
  const reordered = photoSetIds.map((id) => existing.find((p) => p.id === id)).filter(Boolean) as PhotoSet[]
  memoryPhotoSets.set(albumId, reordered)
  return reordered.map(formatPhotoSet)
}

export async function movePhotoSet(photoSetId: string, sourceAlbumId: string, targetAlbumId: string): Promise<void> {
  await apiFetch(`/api/albums/${sourceAlbumId}/photos/${photoSetId}/move`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetAlbumId }),
  })

  const sourceList = memoryPhotoSets.get(sourceAlbumId) || []
  const itemToMove = sourceList.find((ps) => ps.id === photoSetId)
  if (itemToMove) {
    memoryPhotoSets.set(
      sourceAlbumId,
      sourceList.filter((ps) => ps.id !== photoSetId),
    )
    const movedItem: PhotoSet = { ...itemToMove, albumId: targetAlbumId }
    const targetList = memoryPhotoSets.get(targetAlbumId) || []
    targetList.push(movedItem)
    memoryPhotoSets.set(targetAlbumId, targetList)
  }
  photoSetAlbumMap.set(photoSetId, targetAlbumId)
}

export async function createPhotoSet(
  albumId: string,
  name: string,
  before: Blob,
  after: Blob,
  description?: string,
  takenAt?: number,
): Promise<PhotoSet> {
  const detectedDate =
    takenAt ??
    ((before instanceof File ? await getPhotoCreationDate(before) : null) ||
      (after instanceof File ? await getPhotoCreationDate(after) : null) ||
      undefined)

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
        beforeFileName: before instanceof File ? before.name.replace(/\.[^/.]+$/, '') + '.jpg' : 'before.jpg',
        afterFileName: after instanceof File ? after.name.replace(/\.[^/.]+$/, '') + '.jpg' : 'after.jpg',
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
          description,
          takenAt: detectedDate,
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
    description,
    takenAt: detectedDate,
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
        description: photoSet.description,
        takenAt: photoSet.takenAt,
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
    existing[idx] = normalizedPhotoSet
  } else {
    existing.push(normalizedPhotoSet)
  }
  memoryPhotoSets.set(photoSet.albumId, existing)
  photoSetAlbumMap.set(photoSet.id, photoSet.albumId)
  return normalizedPhotoSet
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
