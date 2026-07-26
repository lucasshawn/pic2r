# Cloudflare R2 Shared Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace client-local IndexedDB persistence in Picture Catalog with shared Cloudflare R2 storage via Netlify Functions, enabling multi-user shared access to albums and before-and-after photo sets.

**Architecture:** A Netlify Serverless API endpoint (`netlify/functions/api.ts`) interacts with Cloudflare R2 using `@aws-sdk/client-s3`. Metadata (albums, photo set records) is stored as JSON index files in R2 (`catalog/albums.json` and `albums/{albumId}.json`). Direct client-to-R2 image uploads use S3 pre-signed PUT URLs (`@aws-sdk/s3-request-presigner`). Front-end `catalogRepository.ts` uses `fetch` to communicate with Netlify Functions, with fallback mocking support during testing and local development without active R2 credentials.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Netlify Functions (`@netlify/functions`), AWS SDK for JavaScript v3 (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`).

## Global Constraints

- Preserve all existing UI workflows, component interfaces, accessibility features, and user interaction patterns.
- Direct-to-R2 image uploads using pre-signed PUT URLs must be used for binary image files to prevent routing large image payloads through serverless functions.
- Environment variables required for production/R2: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_DOMAIN`.
- Serverless API endpoints must handle missing R2 JSON files gracefully (return empty arrays `[]` when `catalog/albums.json` or `albums/{albumId}.json` does not exist).
- Provide robust local mock/in-memory fallback when API endpoints or environment variables are absent in local test environments.

---

### Task 1: Scaffolding Dependencies, Types, and Netlify Redirects

**Files:**
- Modify: `package.json`
- Modify: `netlify.toml`
- Modify: `src/types.ts`
- Test: `src/types.test.ts`

**Interfaces:**
- Consumes: Existing `Album` and `PhotoSet` definitions in `src/types.ts`.
- Produces: Updated `PhotoSet` interface with `beforeUrl`, `afterUrl`, `beforeKey`, `afterKey`, and updated `before`/`after` properties (`Blob | string`). New API payload interfaces (`UploadUrlsResponse`, `SavePhotoSetPayload`).

- [ ] **Step 1: Write failing test for updated types and API payload structure**

Create `src/types.test.ts`:
```typescript
import { expect, test } from 'vitest'
import type { Album, PhotoSet, UploadUrlsResponse } from './types'

test('validates PhotoSet type supports both string URLs and Blob references', () => {
  const photoSetWithUrls: PhotoSet = {
    id: 'ps-1',
    albumId: 'alb-1',
    name: 'Test Set',
    beforeUrl: 'https://pub-r2.dev/albums/alb-1/ps-1/before.png',
    afterUrl: 'https://pub-r2.dev/albums/alb-1/ps-1/after.png',
    beforeKey: 'albums/alb-1/ps-1/before.png',
    afterKey: 'albums/alb-1/ps-1/after.png',
    before: 'https://pub-r2.dev/albums/alb-1/ps-1/before.png',
    after: 'https://pub-r2.dev/albums/alb-1/ps-1/after.png',
    createdAt: 1000,
  }

  expect(photoSetWithUrls.beforeUrl).toBe('https://pub-r2.dev/albums/alb-1/ps-1/before.png')
  expect(photoSetWithUrls.beforeKey).toBe('albums/alb-1/ps-1/before.png')
})

test('validates UploadUrlsResponse structure', () => {
  const response: UploadUrlsResponse = {
    photoSetId: 'ps-123',
    beforeUploadUrl: 'https://r2-upload.com/before',
    beforeKey: 'albums/alb-1/ps-123/before-123.png',
  }
  expect(response.photoSetId).toBe('ps-123')
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run src/types.test.ts`
Expected: FAIL with missing export `UploadUrlsResponse` or type errors.

- [ ] **Step 3: Add AWS SDK dependencies, update netlify.toml, and update src/types.ts**

Update `package.json` dependencies:
Add `@aws-sdk/client-s3`: `^3.700.0`, `@aws-sdk/s3-request-presigner`: `^3.700.0`, `@netlify/functions`: `^3.0.0` under dependencies or devDependencies as needed.

Update `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200
```

Update `src/types.ts`:
```typescript
export interface Album {
  id: string
  name: string
  createdAt: number
}

export interface PhotoSet {
  id: string
  albumId: string
  name: string
  beforeUrl: string
  afterUrl: string
  beforeKey?: string
  afterKey?: string
  before: Blob | string
  after: Blob | string
  createdAt: number
}

export interface PhotoSetInput {
  name: string
  before: File | null
  after: File | null
}

export interface UploadUrlsRequest {
  beforeFileName?: string
  afterFileName?: string
}

export interface UploadUrlsResponse {
  photoSetId: string
  beforeUploadUrl?: string
  beforeKey?: string
  afterUploadUrl?: string
  afterKey?: string
}

export interface SavePhotoSetPayload {
  id?: string
  albumId: string
  name: string
  beforeUrl: string
  afterUrl: string
  beforeKey?: string
  afterKey?: string
  createdAt?: number
}
```

Run `npm install` to install `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `@netlify/functions`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/types.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json netlify.toml src/types.ts src/types.test.ts
git commit -m "feat: add R2/Netlify dependencies, API types, and rewrite rules"
```

---

### Task 2: R2 Helper Utilities for Netlify Functions

**Files:**
- Create: `netlify/functions/r2Client.ts`
- Test: `netlify/functions/r2Client.test.ts`

**Interfaces:**
- Consumes: Environment variables (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_DOMAIN`).
- Produces:
  - `getR2Client()`: S3Client instance.
  - `getR2Json<T>(key: string): Promise<T | null>`
  - `putR2Json<T>(key: string, data: T): Promise<void>`
  - `deleteR2Objects(keys: string[]): Promise<void>`
  - `generatePresignedPutUrl(key: string, contentType?: string): Promise<string>`
  - `getPublicUrl(key: string): string`

- [ ] **Step 1: Write unit tests for R2 helper utilities**

Create `netlify/functions/r2Client.test.ts`:
```typescript
import { describe, expect, test, vi, beforeEach } from 'vitest'
import { getPublicUrl, getR2Json, putR2Json, deleteR2Objects } from './r2Client'

vi.mock('@aws-sdk/client-s3', () => {
  const sendMock = vi.fn()
  return {
    S3Client: vi.fn().mockImplementation(() => ({
      send: sendMock,
    })),
    GetObjectCommand: vi.fn().mockImplementation((args) => ({ type: 'GetObject', ...args })),
    PutObjectCommand: vi.fn().mockImplementation((args) => ({ type: 'PutObject', ...args })),
    DeleteObjectCommand: vi.fn().mockImplementation((args) => ({ type: 'DeleteObject', ...args })),
    sendMock,
  }
})

describe('r2Client helpers', () => {
  beforeEach(() => {
    process.env.R2_ACCOUNT_ID = 'test-account'
    process.env.R2_ACCESS_KEY_ID = 'test-key'
    process.env.R2_SECRET_ACCESS_KEY = 'test-secret'
    process.env.R2_BUCKET_NAME = 'test-bucket'
    process.env.R2_PUBLIC_DOMAIN = 'https://pub-test.r2.dev'
  })

  test('constructs public URLs correctly', () => {
    expect(getPublicUrl('catalog/albums.json')).toBe('https://pub-test.r2.dev/catalog/albums.json')
    expect(getPublicUrl('albums/123.json')).toBe('https://pub-test.r2.dev/albums/123.json')
  })
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run netlify/functions/r2Client.test.ts`
Expected: FAIL with module not found `r2Client`.

- [ ] **Step 3: Implement R2 helper utilities in netlify/functions/r2Client.ts**

Create `netlify/functions/r2Client.ts`:
```typescript
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

let cachedClient: S3Client | null = null

export function getR2Client(): S3Client {
  if (cachedClient) return cachedClient

  const accountId = process.env.R2_ACCOUNT_ID || ''
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || ''
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || ''

  cachedClient = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })

  return cachedClient
}

export function getBucketName(): string {
  return process.env.R2_BUCKET_NAME || 'picture-catalog'
}

export function getPublicDomain(): string {
  const domain = process.env.R2_PUBLIC_DOMAIN || ''
  return domain.replace(/\/+$/, '')
}

export function getPublicUrl(key: string): string {
  const domain = getPublicDomain()
  const cleanKey = key.replace(/^\/+/, '')
  if (!domain) return `/${cleanKey}`
  return `${domain}/${cleanKey}`
}

export async function getR2Json<T>(key: string): Promise<T | null> {
  const client = getR2Client()
  try {
    const command = new GetObjectCommand({
      Bucket: getBucketName(),
      Key: key,
    })
    const response = await client.send(command)
    if (!response.Body) return null
    const str = await response.Body.transformToString()
    return JSON.parse(str) as T
  } catch (error: any) {
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      return null
    }
    throw error
  }
}

export async function putR2Json<T>(key: string, data: T): Promise<void> {
  const client = getR2Client()
  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    Body: JSON.stringify(data, null, 2),
    ContentType: 'application/json',
  })
  await client.send(command)
}

export async function deleteR2Objects(keys: string[]): Promise<void> {
  const client = getR2Client()
  const validKeys = keys.filter(Boolean)
  for (const key of validKeys) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: getBucketName(),
        Key: key,
      })
      await client.send(command)
    } catch (err) {
      console.warn(`Failed to delete R2 object key: ${key}`, err)
    }
  }
}

export async function generatePresignedPutUrl(key: string, contentType?: string): Promise<string> {
  const client = getR2Client()
  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    ContentType: contentType || 'application/octet-stream',
  })
  return getSignedUrl(client, command, { expiresIn: 3600 })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run netlify/functions/r2Client.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add netlify/functions/r2Client.ts netlify/functions/r2Client.test.ts
git commit -m "feat: add R2 client helpers for Netlify Functions"
```

---

### Task 3: Netlify Serverless API Endpoint Handler

**Files:**
- Create: `netlify/functions/api.ts`
- Test: `netlify/functions/api.test.ts`

**Interfaces:**
- Consumes: HTTP Requests (`GET /api/albums`, `POST /api/albums`, `GET /api/albums/:id/photos`, `POST /api/albums/:id/photos/upload-urls`, `POST /api/albums/:id/photos`, `DELETE /api/albums/:id/photos/:photoSetId`).
- Produces: Standard Netlify Function responses (`statusCode`, `headers`, `body`).

- [ ] **Step 1: Write integration test suite for Netlify Function API router**

Create `netlify/functions/api.test.ts`:
```typescript
import { describe, expect, test, vi, beforeEach } from 'vitest'
import { handler } from './api'

vi.mock('./r2Client', () => ({
  getR2Json: vi.fn(),
  putR2Json: vi.fn(),
  deleteR2Objects: vi.fn(),
  generatePresignedPutUrl: vi.fn().mockImplementation(async (key: string) => `https://signed-upload.com/${key}`),
  getPublicUrl: vi.fn().mockImplementation((key: string) => `https://pub-test.r2.dev/${key}`),
}))

import * as r2 from './r2Client'

describe('Netlify API Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('GET /api/albums returns empty array when catalog/albums.json is missing', async () => {
    vi.mocked(r2.getR2Json).mockResolvedValueOnce(null)

    const response = await handler({
      httpMethod: 'GET',
      path: '/api/albums',
      headers: {},
      queryStringParameters: null,
      body: null,
    } as any, {} as any)

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual([])
  })

  test('POST /api/albums creates new album and writes catalog/albums.json', async () => {
    vi.mocked(r2.getR2Json).mockResolvedValueOnce([])
    vi.mocked(r2.putR2Json).mockResolvedValueOnce(undefined)

    const response = await handler({
      httpMethod: 'POST',
      path: '/api/albums',
      headers: { 'content-type': 'application/json' },
      queryStringParameters: null,
      body: JSON.stringify({ name: 'Kitchen Remodel' }),
    } as any, {} as any)

    expect(response.statusCode).toBe(201)
    const album = JSON.parse(response.body)
    expect(album.name).toBe('Kitchen Remodel')
    expect(album.id).toBeDefined()
    expect(r2.putR2Json).toHaveBeenCalledWith('catalog/albums.json', [album])
  })

  test('POST /api/albums/:id/photos/upload-urls generates presigned URLs', async () => {
    const response = await handler({
      httpMethod: 'POST',
      path: '/api/albums/alb-1/photos/upload-urls',
      headers: { 'content-type': 'application/json' },
      queryStringParameters: null,
      body: JSON.stringify({ beforeFileName: 'before.png', afterFileName: 'after.png' }),
    } as any, {} as any)

    expect(response.statusCode).toBe(200)
    const data = JSON.parse(response.body)
    expect(data.photoSetId).toBeDefined()
    expect(data.beforeUploadUrl).toBeDefined()
    expect(data.afterUploadUrl).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run netlify/functions/api.test.ts`
Expected: FAIL with module not found `api`.

- [ ] **Step 3: Implement Netlify API Handler in netlify/functions/api.ts**

Create `netlify/functions/api.ts`:
```typescript
import {
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

    // Match /api/albums/:albumId/photos (GET or POST)
    const albumPhotosMatch = path.match(/^\/api\/albums\/([^\/]+)\/photos$/)
    if (albumPhotosMatch) {
      const albumId = albumPhotosMatch[1]
      const key = `albums/${albumId}.json`

      if (event.httpMethod === 'GET') {
        const photoSets = (await getR2Json<any[]>(key)) || []
        photoSets.sort((a, b) => a.createdAt - b.createdAt)
        return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify(photoSets) }
      }

      if (event.httpMethod === 'POST') {
        const body = event.body ? JSON.parse(event.body) : {}
        const payload: SavePhotoSetPayload = body.photoSet || body
        if (!payload.name || !payload.beforeUrl || !payload.afterUrl) {
          return { statusCode: 400, headers: jsonHeaders, body: JSON.stringify({ error: 'Missing required photo set fields' }) }
        }

        const photoSets = (await getR2Json<any[]>(key)) || []
        const existingIndex = payload.id ? photoSets.findIndex((ps) => ps.id === payload.id) : -1

        const photoSetRecord = {
          id: payload.id || crypto.randomUUID(),
          albumId,
          name: payload.name,
          beforeUrl: payload.beforeUrl,
          afterUrl: payload.afterUrl,
          beforeKey: payload.beforeKey,
          afterKey: payload.afterKey,
          before: payload.beforeUrl,
          after: payload.afterUrl,
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
        const keysToDelete = [target.beforeKey, target.afterKey].filter(Boolean)
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run netlify/functions/api.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add netlify/functions/api.ts netlify/functions/api.test.ts
git commit -m "feat: implement Netlify serverless API endpoint handler for R2 shared catalog"
```

---

### Task 4: Update Frontend Repository Layer (`src/catalogRepository.ts`)

**Files:**
- Modify: `src/catalogRepository.ts`
- Test: `src/catalogRepository.test.ts`

**Interfaces:**
- Consumes: `/api/albums`, `/api/albums/:id/photos`, pre-signed PUT URLs.
- Produces: `listAlbums(): Promise<Album[]>`, `createAlbum(name: string): Promise<Album>`, `listPhotoSets(albumId: string): Promise<PhotoSet[]>`, `createPhotoSet(albumId, name, before, after): Promise<PhotoSet>`, `updatePhotoSet(photoSet): Promise<PhotoSet>`, `deletePhotoSet(id): Promise<void>`.

- [ ] **Step 1: Update repository tests to verify API fetch calls with mock fallback**

Update `src/catalogRepository.test.ts`:
```typescript
import { describe, expect, test, vi, beforeEach } from 'vitest'
import {
  createAlbum,
  createPhotoSet,
  deletePhotoSet,
  listAlbums,
  listPhotoSets,
  updatePhotoSet,
} from './catalogRepository'

describe('catalogRepository with API', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  test('creates album and fetches list from API', async () => {
    const album = await createAlbum('Renovation')
    expect(album.name).toBe('Renovation')
    expect(album.id).toBeDefined()

    const albums = await listAlbums()
    expect(albums.some((a) => a.id === album.id)).toBe(true)
  })

  test('creates photo set using upload URLs and API save', async () => {
    const album = await createAlbum('Kitchen')
    const beforeBlob = new Blob(['before image'], { type: 'image/png' })
    const afterBlob = new Blob(['after image'], { type: 'image/png' })

    const photoSet = await createPhotoSet(album.id, 'Countertop', beforeBlob, afterBlob)
    expect(photoSet.name).toBe('Countertop')

    const photoSets = await listPhotoSets(album.id)
    expect(photoSets.some((ps) => ps.id === photoSet.id)).toBe(true)
  })

  test('deletes photo set via API', async () => {
    const album = await createAlbum('Bathroom')
    const beforeBlob = new Blob(['before'], { type: 'image/png' })
    const afterBlob = new Blob(['after'], { type: 'image/png' })

    const photoSet = await createPhotoSet(album.id, 'Tile', beforeBlob, afterBlob)
    await deletePhotoSet(photoSet.id, album.id)

    const photoSets = await listPhotoSets(album.id)
    expect(photoSets.some((ps) => ps.id === photoSet.id)).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify failure before refactoring `catalogRepository.ts`**

Run: `npx vitest run src/catalogRepository.test.ts`

- [ ] **Step 3: Implement API calls with local fallback in `src/catalogRepository.ts`**

Rewrite `src/catalogRepository.ts`:
```typescript
import type { Album, PhotoSet, UploadUrlsResponse } from './types'

// In-memory fallback for local dev / offline / test environment when server API is unavailable
const memoryAlbums: Album[] = []
const memoryPhotoSets: Map<string, PhotoSet[]> = new Map()

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, options)
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
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

export async function listPhotoSets(albumId: string): Promise<PhotoSet[]> {
  const data = await apiFetch<PhotoSet[]>(`/api/albums/${albumId}/photos`)
  if (data !== null) {
    return data.map(formatPhotoSet)
  }
  const sets = memoryPhotoSets.get(albumId) || []
  return [...sets].sort((a, b) => a.createdAt - b.createdAt)
}

function formatPhotoSet(ps: any): PhotoSet {
  return {
    ...ps,
    beforeUrl: ps.beforeUrl || (typeof ps.before === 'string' ? ps.before : ''),
    afterUrl: ps.afterUrl || (typeof ps.after === 'string' ? ps.after : ''),
    before: ps.beforeUrl || ps.before,
    after: ps.afterUrl || ps.after,
  }
}

export async function createPhotoSet(
  albumId: string,
  name: string,
  before: Blob,
  after: Blob,
): Promise<PhotoSet> {
  // Step 1: Request pre-signed URLs
  const uploadUrlsRes = await apiFetch<UploadUrlsResponse>(
    `/api/albums/${albumId}/photos/upload-urls`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        beforeFileName: before instanceof File ? before.name : 'before.png',
        afterFileName: after instanceof File ? after.name : 'after.png',
      }),
    },
  )

  if (uploadUrlsRes) {
    const { photoSetId, beforeUploadUrl, beforeKey, afterUploadUrl, afterKey } = uploadUrlsRes

    // Direct PUT upload to R2
    if (beforeUploadUrl) {
      await fetch(beforeUploadUrl, { method: 'PUT', body: before, headers: { 'Content-Type': before.type || 'application/octet-stream' } })
    }
    if (afterUploadUrl) {
      await fetch(afterUploadUrl, { method: 'PUT', body: after, headers: { 'Content-Type': after.type || 'application/octet-stream' } })
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
  return newSet
}

export async function updatePhotoSet(photoSet: PhotoSet): Promise<PhotoSet> {
  let beforeUrl = photoSet.beforeUrl
  let afterUrl = photoSet.afterUrl
  let beforeKey = photoSet.beforeKey
  let afterKey = photoSet.afterKey

  // Check if before or after were updated with new File/Blob objects
  const hasNewBefore = photoSet.before instanceof Blob
  const hasNewAfter = photoSet.after instanceof Blob

  if (hasNewBefore || hasNewAfter) {
    const uploadUrlsRes = await apiFetch<UploadUrlsResponse>(
      `/api/albums/${photoSet.albumId}/photos/upload-urls`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beforeFileName: hasNewBefore ? 'before.png' : undefined,
          afterFileName: hasNewAfter ? 'after.png' : undefined,
        }),
      },
    )

    if (uploadUrlsRes) {
      if (hasNewBefore && uploadUrlsRes.beforeUploadUrl) {
        await fetch(uploadUrlsRes.beforeUploadUrl, { method: 'PUT', body: photoSet.before as Blob })
        beforeKey = uploadUrlsRes.beforeKey
      }
      if (hasNewAfter && uploadUrlsRes.afterUploadUrl) {
        await fetch(uploadUrlsRes.afterUploadUrl, { method: 'PUT', body: photoSet.after as Blob })
        afterKey = uploadUrlsRes.afterKey
      }
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
  return photoSet
}

export async function deletePhotoSet(id: string, albumId?: string): Promise<void> {
  // Find albumId if not provided
  let targetAlbumId = albumId
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
  }
}
```

- [ ] **Step 4: Run repository tests to verify passing**

Run: `npx vitest run src/catalogRepository.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/catalogRepository.ts src/catalogRepository.test.ts
git commit -m "feat: replace IndexedDB with API calls and pre-signed R2 uploads in catalogRepository"
```

---

### Task 5: UI Component Updates & Image URL Rendering

**Files:**
- Modify: `src/components/ThumbnailPair.tsx`
- Modify: `src/components/AlbumPage.tsx`
- Test: `src/components/ThumbnailPair.test.tsx`

**Interfaces:**
- Consumes: `PhotoSet` object (with `before`/`after` as `Blob` or `string` URL).
- Produces: Correct rendering of `<img src="...">` whether string URL or Blob object URL.

- [ ] **Step 1: Write test for ThumbnailPair handling both string URLs and Blobs**

Create `src/components/ThumbnailPair.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { ThumbnailPair } from './ThumbnailPair'
import type { PhotoSet } from '../types'

test('renders image tags with string URLs directly', () => {
  const photoSet: PhotoSet = {
    id: 'ps-1',
    albumId: 'alb-1',
    name: 'Living Room',
    beforeUrl: 'https://r2.dev/before.png',
    afterUrl: 'https://r2.dev/after.png',
    before: 'https://r2.dev/before.png',
    after: 'https://r2.dev/after.png',
    createdAt: 1000,
  }

  render(<ThumbnailPair photoSet={photoSet} onEdit={vi.fn()} onDelete={vi.fn()} />)

  const beforeImg = screen.getByAltText('Living Room before') as HTMLImageElement
  const afterImg = screen.getByAltText('Living Room after') as HTMLImageElement

  expect(beforeImg.src).toContain('https://r2.dev/before.png')
  expect(afterImg.src).toContain('https://r2.dev/after.png')
})
```

- [ ] **Step 2: Run test to verify failure or behavior**

Run: `npx vitest run src/components/ThumbnailPair.test.tsx`

- [ ] **Step 3: Update `src/components/ThumbnailPair.tsx` and `src/components/AlbumPage.tsx`**

Update `src/components/ThumbnailPair.tsx`:
```typescript
import { useEffect, useState } from 'react'
import type { PhotoSet } from '../types'

interface ThumbnailPairProps {
  photoSet: PhotoSet
  onEdit: (photoSet: PhotoSet) => void
  onDelete: (photoSet: PhotoSet) => void
}

export function ThumbnailPair({ photoSet, onEdit, onDelete }: ThumbnailPairProps) {
  const [urls, setUrls] = useState<{ before: string; after: string } | null>(null)

  useEffect(() => {
    let beforeUrl = ''
    let afterUrl = ''
    let createdBeforeObj = false
    let createdAfterObj = false

    if (typeof photoSet.before === 'string') {
      beforeUrl = photoSet.before
    } else if (photoSet.beforeUrl) {
      beforeUrl = photoSet.beforeUrl
    } else if (photoSet.before instanceof Blob) {
      beforeUrl = URL.createObjectURL(photoSet.before)
      createdBeforeObj = true
    }

    if (typeof photoSet.after === 'string') {
      afterUrl = photoSet.after
    } else if (photoSet.afterUrl) {
      afterUrl = photoSet.afterUrl
    } else if (photoSet.after instanceof Blob) {
      afterUrl = URL.createObjectURL(photoSet.after)
      createdAfterObj = true
    }

    setUrls({ before: beforeUrl, after: afterUrl })

    return () => {
      if (createdBeforeObj && beforeUrl) URL.revokeObjectURL(beforeUrl)
      if (createdAfterObj && afterUrl) URL.revokeObjectURL(afterUrl)
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
      <div className="thumbnail-pair-actions">
        <button type="button" onClick={() => onEdit(photoSet)}>Edit {photoSet.name}</button>
        <button type="button" onClick={() => onDelete(photoSet)}>Delete {photoSet.name}</button>
      </div>
    </article>
  )
}
```

Update `src/components/AlbumPage.tsx` line 57:
Pass `album.id` to `deletePhotoSet(pendingDelete.id, album.id)`:
```typescript
await deletePhotoSet(pendingDelete.id, album.id)
```

- [ ] **Step 4: Run component tests to verify passing**

Run: `npx vitest run src/components/ThumbnailPair.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ThumbnailPair.tsx src/components/AlbumPage.tsx src/components/ThumbnailPair.test.tsx
git commit -m "feat: support R2 string URLs in ThumbnailPair and pass albumId on delete"
```

---

### Task 6: Full Application Integration & Test Suite Verification

**Files:**
- Modify: `src/App.test.tsx`
- Test: Full Vitest test suite (`npx vitest run`)

- [ ] **Step 1: Run full vitest suite to check for regressions**

Run: `npx vitest run`

- [ ] **Step 2: Fix any test assertions in `src/App.test.tsx` if needed**

Review and ensure `src/App.test.tsx` passes seamlessly with the API fallback / mock layer in `catalogRepository.ts`.

- [ ] **Step 3: Run full build check**

Run: `npm run build`
Expected: Build succeeds with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/App.test.tsx
git commit -m "test: verify full app integration tests pass with R2 shared catalog API architecture"
```
