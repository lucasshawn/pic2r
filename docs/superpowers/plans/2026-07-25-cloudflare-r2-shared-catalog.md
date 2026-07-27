# Cloudflare R2 Shared Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace local IndexedDB browser storage with shared Cloudflare R2 cloud storage via Netlify Serverless Functions, enabling multiple users with a shared link to view and upload albums and photo sets.

**Architecture:** The React frontend makes REST API calls to Netlify Functions (`/api/albums`, `/api/albums/:id/photos`). The serverless handlers read and write JSON index files in Cloudflare R2 using `@aws-sdk/client-s3` and generate pre-signed R2 upload URLs for direct binary photo uploads from the browser.

**Tech Stack:** React 19, TypeScript, Netlify Functions, Cloudflare R2 (S3 API compatible), `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, Vitest.

## Global Constraints

- Preserve `Album` and `PhotoSet` TypeScript interface definitions in `src/types.ts`.
- Retain existing function signatures in `src/catalogRepository.ts` (`listAlbums`, `createAlbum`, `listPhotoSets`, `createPhotoSet`, `updatePhotoSet`, `deletePhotoSet`) to minimize UI breaking changes.
- Ensure fallback/mock behavior when R2 environment variables are missing (such as during local development or unit test runs).

---

### Task 1: Netlify Functions & R2 S3 SDK Integration

**Files:**
- Modify: `package.json`
- Create: `netlify/functions/api.ts`

**Interfaces:**
- Consumes: Cloudflare R2 S3 Environment Variables (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_DOMAIN`)
- Produces: API HTTP endpoints (`/api/albums`, `/api/albums/:id/photos`, `/api/albums/:id/photos/upload-urls`)

- [ ] **Step 1: Install AWS S3 SDK dependencies**

Run: `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`

- [ ] **Step 2: Create Netlify Functions serverless handler `netlify/functions/api.ts`**

```typescript
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Configure R2 Client
const accountId = process.env.R2_ACCOUNT_ID || ''
const accessKeyId = process.env.R2_ACCESS_KEY_ID || ''
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || ''
const bucketName = process.env.R2_BUCKET_NAME || 'picture-catalog'
const publicDomain = process.env.R2_PUBLIC_DOMAIN || ''

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
})

// Netlify Function Handler for /api/*
export async function handler(event: { httpMethod: string; path: string; body: string | null }) {
  // Routes implementation for GET/POST /api/albums and photos
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'R2 API' }),
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json netlify/functions/api.ts
git commit -m "feat: add Netlify Functions handler with R2 S3 SDK integration"
```

---

### Task 2: Repository Layer Refactoring

**Files:**
- Modify: `src/catalogRepository.ts`
- Modify: `src/types.ts`

**Interfaces:**
- Consumes: Netlify API endpoints (`/api/*`)
- Produces: Async repository functions for React UI (`listAlbums`, `createAlbum`, `listPhotoSets`, `createPhotoSet`, `updatePhotoSet`, `deletePhotoSet`)

- [ ] **Step 1: Write API fetch implementation in `src/catalogRepository.ts`**

Replace IndexedDB code in `src/catalogRepository.ts` with REST API calls to `/api/albums` and `/api/albums/:id/photos`.

- [ ] **Step 2: Update photo upload to request pre-signed URLs and PUT directly to R2**

```typescript
export async function createPhotoSet(
  albumId: string,
  name: string,
  before: Blob,
  after: Blob,
): Promise<PhotoSet> {
  // 1. Get pre-signed upload URLs from /api/albums/:albumId/photos/upload-urls
  // 2. Upload before and after Blobs to R2 using fetch(uploadUrl, { method: 'PUT', body: blob })
  // 3. Save photo set metadata via POST /api/albums/:albumId/photos
}
```

- [ ] **Step 3: Commit**

```bash
git add src/catalogRepository.ts src/types.ts
git commit -m "refactor: update catalogRepository to use shared Cloudflare R2 API"
```

---

### Task 3: Test Verification and Clean Build

**Files:**
- Modify: `src/catalogRepository.test.ts`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Update repository unit tests to mock fetch responses**

Update `src/catalogRepository.test.ts` to mock `globalThis.fetch` instead of `fake-indexeddb`.

- [ ] **Step 2: Run test suite and build verification**

Run: `npx vitest run`
Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/catalogRepository.test.ts src/App.test.tsx
git commit -m "test: update repository and app integration tests for R2 API"
```
