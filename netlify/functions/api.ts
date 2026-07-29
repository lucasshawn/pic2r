import { GetObjectCommand } from '@aws-sdk/client-s3'
import {
  getR2Client,
  getBucketName,
  getR2Json,
  putR2Json,
  deleteR2Objects,
  generatePresignedPutUrl,
  getPublicUrl,
} from './r2Client'
import type { Album, UploadUrlsRequest, UploadUrlsResponse, SavePhotoSetPayload } from '../../src/types'

interface HandlerEvent {
  httpMethod: string
  path: string
  headers: Record<string, string | undefined>
  queryStringParameters?: Record<string, string | undefined> | null
  body?: string | null
}

interface HandlerResponse {
  statusCode: number
  headers?: Record<string, string>
  body: string
  isBase64Encoded?: boolean
}

const jsonHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

export async function handler(event: HandlerEvent, _context: any): Promise<HandlerResponse> {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: jsonHeaders, body: '' }
  }

  const rawPath = event.path.replace(/^\/\.netlify\/functions\/api/, '/api')
  const path = rawPath.endsWith('/') && rawPath.length > 1 ? rawPath.slice(0, -1) : rawPath

  try {
    // GET /api/image/*
    const imageMatch = path.match(/^\/api\/image\/(.+)$/)
    if (event.httpMethod === 'GET' && imageMatch) {
      const key = imageMatch[1]
      try {
        const client = getR2Client()
        const command = new GetObjectCommand({
          Bucket: getBucketName(),
          Key: key,
        })
        const response = await client.send(command)
        if (!response.Body) {
          return { statusCode: 404, headers: jsonHeaders, body: JSON.stringify({ error: 'Not Found' }) }
        }
        const contentType = response.ContentType || 'image/png'
        const byteArray = await response.Body.transformToByteArray()
        const base64 = Buffer.from(byteArray).toString('base64')
        return {
          statusCode: 200,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400',
            'Access-Control-Allow-Origin': '*',
          },
          body: base64,
          isBase64Encoded: true,
        }
      } catch {
        return { statusCode: 404, headers: jsonHeaders, body: JSON.stringify({ error: 'Image Not Found' }) }
      }
    }

    // Match /api/admins or /api/admins/:email
    const adminsMatch = path.match(/^\/api\/admins(?:\/(.+))?$/)
    if (adminsMatch) {
      const emailParam = adminsMatch[1] ? decodeURIComponent(adminsMatch[1]).trim().toLowerCase() : null
      const key = 'catalog/admins.json'
      const admins = (await getR2Json<string[]>(key)) || []

      if (event.httpMethod === 'GET') {
        return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify(admins) }
      }
      if (event.httpMethod === 'POST') {
        const body = event.body ? JSON.parse(event.body) : {}
        const trimmed = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
        if (trimmed && !admins.includes(trimmed)) {
          admins.push(trimmed)
          await putR2Json(key, admins)
        }
        return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify(admins) }
      }
      if (event.httpMethod === 'DELETE' && emailParam) {
        const updated = admins.filter((e) => e.toLowerCase() !== emailParam)
        await putR2Json(key, updated)
        return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify(updated) }
      }
    }

    // GET /api/albums
    if (event.httpMethod === 'GET' && path === '/api/albums') {
      const albums = (await getR2Json<Album[]>('catalog/albums.json')) || []
      albums.sort((a, b) => a.createdAt - b.createdAt)
      return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify(albums) }
    }

    // POST /api/albums
    if (event.httpMethod === 'POST' && path === '/api/albums') {
      const body = event.body ? JSON.parse(event.body) : {}
      const name = body.name?.trim()
      if (!name) {
        return { statusCode: 400, headers: jsonHeaders, body: JSON.stringify({ error: 'Album name is required' }) }
      }

      const albums = (await getR2Json<Album[]>('catalog/albums.json')) || []
      const newAlbum: Album = {
        id: crypto.randomUUID(),
        name,
        createdAt: Date.now(),
      }
      albums.push(newAlbum)
      await putR2Json('catalog/albums.json', albums)

      return { statusCode: 201, headers: jsonHeaders, body: JSON.stringify(newAlbum) }
    }

    // Match PUT /api/albums/:albumId
    const putAlbumMatch = path.match(/^\/api\/albums\/([^\/]+)$/)
    if (event.httpMethod === 'PUT' && putAlbumMatch) {
      const albumId = putAlbumMatch[1]
      const body = event.body ? JSON.parse(event.body) : {}
      const albums = (await getR2Json<Album[]>('catalog/albums.json')) || []
      const album = albums.find((a) => a.id === albumId)
      if (!album) {
        return { statusCode: 404, headers: jsonHeaders, body: JSON.stringify({ error: 'Album Not Found' }) }
      }
      if (body.name !== undefined) {
        album.name = body.name
      }
      if (body.description !== undefined) {
        album.description = body.description
      }
      await putR2Json('catalog/albums.json', albums)
      return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify(album) }
    }

    // Match DELETE /api/albums/:albumId
    const deleteAlbumMatch = path.match(/^\/api\/albums\/([^\/]+)$/)
    if (event.httpMethod === 'DELETE' && deleteAlbumMatch) {
      const albumId = deleteAlbumMatch[1]
      const albums = (await getR2Json<Album[]>('catalog/albums.json')) || []
      const updatedAlbums = albums.filter((a) => a.id !== albumId)
      await putR2Json('catalog/albums.json', updatedAlbums)
      await deleteR2Objects([`albums/${albumId}.json`])
      return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify({ success: true }) }
    }

    // Match /api/albums/:albumId/photos/upload-urls
    const uploadUrlsMatch = path.match(/^\/api\/albums\/([^\/]+)\/photos\/upload-urls$/)
    if (event.httpMethod === 'POST' && uploadUrlsMatch) {
      const albumId = uploadUrlsMatch[1]
      const body: UploadUrlsRequest = event.body ? JSON.parse(event.body) : {}
      const photoSetId = crypto.randomUUID()
      const timestamp = Date.now()

      const result: UploadUrlsResponse = { photoSetId }

      if (body.beforeFileName) {
        const beforeKey = `albums/${albumId}/${photoSetId}/before-${timestamp}-${body.beforeFileName}`
        result.beforeKey = beforeKey
        result.beforeUploadUrl = await generatePresignedPutUrl(beforeKey)
      }

      if (body.afterFileName) {
        const afterKey = `albums/${albumId}/${photoSetId}/after-${timestamp}-${body.afterFileName}`
        result.afterKey = afterKey
        result.afterUploadUrl = await generatePresignedPutUrl(afterKey)
      }

      return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify(result) }
    }

    // Match PUT /api/albums/:albumId/photos/reorder
    const reorderMatch = path.match(/^\/api\/albums\/([^\/]+)\/photos\/reorder$/)
    if (event.httpMethod === 'PUT' && reorderMatch) {
      const albumId = reorderMatch[1]
      const body = event.body ? JSON.parse(event.body) : {}
      const photoSetIds: string[] = body.photoSetIds || []
      const key = `albums/${albumId}.json`
      const existing = (await getR2Json<any[]>(key)) || []
      const reordered = photoSetIds.map((id) => existing.find((p) => p.id === id)).filter(Boolean)
      await putR2Json(key, reordered)
      return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify(reordered) }
    }

    // Match PUT /api/albums/:sourceAlbumId/photos/:photoSetId/move
    const moveMatch = path.match(/^\/api\/albums\/([^\/]+)\/photos\/([^\/]+)\/move$/)
    if (event.httpMethod === 'PUT' && moveMatch) {
      const sourceAlbumId = moveMatch[1]
      const photoSetId = moveMatch[2]
      const body = event.body ? JSON.parse(event.body) : {}
      const targetAlbumId = body.targetAlbumId

      const sourceKey = `albums/${sourceAlbumId}.json`
      const targetKey = `albums/${targetAlbumId}.json`

      const sourceList = (await getR2Json<any[]>(sourceKey)) || []
      const targetList = (await getR2Json<any[]>(targetKey)) || []

      const itemToMove = sourceList.find((p) => p.id === photoSetId)
      if (itemToMove) {
        const updatedSource = sourceList.filter((p) => p.id !== photoSetId)
        const movedItem = { ...itemToMove, albumId: targetAlbumId }
        targetList.push(movedItem)
        await putR2Json(sourceKey, updatedSource)
        await putR2Json(targetKey, targetList)
      }

      return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify({ success: true }) }
    }

    // Match /api/albums/:albumId/photos (GET or POST)
    const albumPhotosMatch = path.match(/^\/api\/albums\/([^\/]+)\/photos$/)
    if (albumPhotosMatch) {
      const albumId = albumPhotosMatch[1]
      const key = `albums/${albumId}.json`

      if (event.httpMethod === 'GET') {
        const photoSets = (await getR2Json<any[]>(key)) || []
        return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify(photoSets) }
      }
      if (event.httpMethod === 'POST') {
        const body = event.body ? JSON.parse(event.body) : {}
        const payload: SavePhotoSetPayload = body.photoSet || body
        const beforeKey = payload.beforeKey || ''
        const afterKey = payload.afterKey || ''
        const beforeUrl = payload.beforeUrl || (beforeKey ? getPublicUrl(beforeKey) : '')
        const afterUrl = payload.afterUrl || (afterKey ? getPublicUrl(afterKey) : '')

        if (!payload.name || (!beforeUrl && !beforeKey)) {
          return { statusCode: 400, headers: jsonHeaders, body: JSON.stringify({ error: 'Missing required photo set fields' }) }
        }

        const photoSets = (await getR2Json<any[]>(key)) || []
        const existingIndex = payload.id ? photoSets.findIndex((ps) => ps.id === payload.id) : -1

        const photoSetRecord = {
          id: payload.id || crypto.randomUUID(),
          albumId,
          name: payload.name,
          description: payload.description,
          takenAt: payload.takenAt,
          beforeUrl,
          afterUrl,
          beforeKey,
          afterKey,
          before: beforeUrl,
          after: afterUrl,
          createdAt: payload.createdAt || Date.now(),
        }

        if (existingIndex >= 0) {
          photoSets[existingIndex] = { ...photoSets[existingIndex], ...photoSetRecord }
        } else {
          photoSets.push(photoSetRecord)
        }

        await putR2Json(key, photoSets)
        return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify(photoSetRecord) }
      }
    }

    // Match DELETE /api/albums/:albumId/photos/:photoSetId
    const deleteMatch = path.match(/^\/api\/albums\/([^\/]+)\/photos\/([^\/]+)$/)
    if (event.httpMethod === 'DELETE' && deleteMatch) {
      const albumId = deleteMatch[1]
      const photoSetId = deleteMatch[2]
      const key = `albums/${albumId}.json`

      const photoSets = (await getR2Json<any[]>(key)) || []
      const target = photoSets.find((ps) => ps.id === photoSetId)

      if (target) {
        const keysToDelete = [target.beforeKey, target.afterKey].filter(Boolean) as string[]
        if (keysToDelete.length > 0) {
          await deleteR2Objects(keysToDelete)
        }
        const updated = photoSets.filter((ps) => ps.id !== photoSetId)
        await putR2Json(key, updated)
      }

      return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify({ success: true }) }
    }

    return { statusCode: 404, headers: jsonHeaders, body: JSON.stringify({ error: 'Not Found' }) }
  } catch (err: any) {
    console.error('API Error:', err)
    return { statusCode: 500, headers: jsonHeaders, body: JSON.stringify({ error: err.message || 'Internal Server Error' }) }
  }
}
