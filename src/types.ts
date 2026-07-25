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
