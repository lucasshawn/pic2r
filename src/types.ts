export interface Album {
  id: string
  name: string
  createdAt: number
}

export interface PhotoSet {
  id: string
  albumId: string
  name: string
  before: Blob
  after: Blob
  createdAt: number
}

export interface PhotoSetInput {
  name: string
  before: File | null
  after: File | null
}
