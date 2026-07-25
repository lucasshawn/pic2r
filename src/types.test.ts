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
