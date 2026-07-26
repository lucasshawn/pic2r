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
