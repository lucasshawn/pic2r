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

test('renders image tags with Blob objects via object URLs', () => {
  const mockBeforeBlob = new Blob(['before'], { type: 'image/png' })
  const mockAfterBlob = new Blob(['after'], { type: 'image/png' })
  const photoSet: PhotoSet = {
    id: 'ps-2',
    albumId: 'alb-1',
    name: 'Kitchen',
    before: mockBeforeBlob,
    after: mockAfterBlob,
    createdAt: 1000,
  }

  render(<ThumbnailPair photoSet={photoSet} onEdit={vi.fn()} onDelete={vi.fn()} />)

  const beforeImg = screen.getByAltText('Kitchen before') as HTMLImageElement
  const afterImg = screen.getByAltText('Kitchen after') as HTMLImageElement

  expect(beforeImg.src).toBeTruthy()
  expect(afterImg.src).toBeTruthy()
})
