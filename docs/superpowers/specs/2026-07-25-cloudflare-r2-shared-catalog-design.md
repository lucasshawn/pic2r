# Cloudflare R2 Shared Catalog Design

## Goal

Transition the Picture Catalog application from client-local IndexedDB persistence to shared Cloudflare R2 storage via Netlify Functions, allowing all visitors using a shared link to see created albums and uploaded before-and-after photo sets.

## Scope

- Replace local IndexedDB storage calls in `src/catalogRepository.ts` with API calls to Netlify Functions.
- Create Netlify Serverless API endpoints under `netlify/functions/` (or single serverless handler) to interact with Cloudflare R2 using `@aws-sdk/client-s3`.
- Store catalog metadata (albums list, photo set records, image URLs/keys) as JSON index files inside Cloudflare R2 (`catalog/albums.json` and `albums/{albumId}.json`).
- Provide pre-signed PUT URLs for direct client-to-R2 image uploads to avoid routing large file binary payloads through Netlify Functions.
- Support full CRUD operations: create album, list albums, list photo sets, upload photo sets, edit photo set metadata/images, and delete photo sets.
- Maintain existing UI components and user workflows without breaking changes.

## Architecture & Data Flow

```
[ Browser / React App ] 
       │
       ├─► GET /api/albums ──────────────────► [ Netlify Function ] ──► Read catalog/albums.json in R2
       ├─► POST /api/albums ─────────────────► [ Netlify Function ] ──► Write catalog/albums.json in R2
       ├─► GET /api/albums/:id/photos ───────► [ Netlify Function ] ──► Read albums/{id}.json in R2
       │
       ├─► POST /api/albums/:id/photos ──────► [ Netlify Function ] ──► Generate Pre-signed PUT URLs
       │          │                                                        │
       │          └──────── Direct Image Upload (PUT) ─────────────────────┼─► [ Cloudflare R2 Bucket ]
       │                                                                   │
       └─► POST /api/albums/:id/photos/confirm ─► [ Netlify Function ] ───┴─► Update albums/{id}.json
```

## API Endpoint Specification

1. `GET /api/albums`
   - Description: Retrieves list of all albums.
   - Response: `Album[]`

2. `POST /api/albums`
   - Description: Creates a new album record in `catalog/albums.json`.
   - Body: `{ name: string }`
   - Response: `Album`

3. `POST /api/albums/:albumId/photos/upload-urls`
   - Description: Generates pre-signed R2 PUT URLs for Before and/or After images.
   - Body: `{ beforeFileName?: string, afterFileName?: string }`
   - Response: `{ photoSetId: string, beforeUploadUrl?: string, beforeKey?: string, afterUploadUrl?: string, afterKey?: string }`

4. `POST /api/albums/:albumId/photos`
   - Description: Saves or updates a photo set entry in `albums/{albumId}.json`.
   - Body: `{ photoSet: PhotoSetMetadata }`
   - Response: `PhotoSet`

5. `DELETE /api/albums/:albumId/photos/:photoSetId`
   - Description: Deletes a photo set entry from `albums/{albumId}.json` and deletes associated image keys from R2.
   - Response: `{ success: true }`

## Data Model

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
  beforeUrl: string // Cloudflare R2 public URL or signed GET URL
  afterUrl: string  // Cloudflare R2 public URL or signed GET URL
  beforeKey?: string
  afterKey?: string
  createdAt: number
}
```

## Environment Configuration

Netlify site environment variables:
- `R2_ACCOUNT_ID`: Cloudflare account ID
- `R2_ACCESS_KEY_ID`: Cloudflare R2 S3 Access Key
- `R2_SECRET_ACCESS_KEY`: Cloudflare R2 S3 Secret Key
- `R2_BUCKET_NAME`: Name of the R2 bucket
- `R2_PUBLIC_DOMAIN`: Public domain or custom domain configured for the R2 bucket (e.g. `https://pub-xxx.r2.dev` or custom domain)

## Testing Strategy

- Unit & integration tests for repository layer (`src/catalogRepository.test.ts`) with mocked API/fetch calls.
- Component level tests (`src/App.test.tsx`) updated to verify API interactions instead of IndexedDB calls.
- Local fallback/mocking when Netlify Function environment variables are not set.
