import type { Album, PhotoSet } from './types'

const databaseName = 'picture-catalog'
const databaseVersion = 1

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion)

    request.onupgradeneeded = () => {
      const database = request.result
      const albums = database.createObjectStore('albums', { keyPath: 'id' })
      albums.createIndex('createdAt', 'createdAt')

      const photoSets = database.createObjectStore('photoSets', { keyPath: 'id' })
      photoSets.createIndex('albumId', 'albumId')
      photoSets.createIndex('createdAt', 'createdAt')
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onabort = () => reject(transaction.error)
    transaction.onerror = () => reject(transaction.error)
  })
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function listAlbums(): Promise<Album[]> {
  const database = await openDatabase()
  const transaction = database.transaction('albums', 'readonly')
  const albums = await requestResult(transaction.objectStore('albums').getAll())
  await transactionComplete(transaction)
  database.close()

  return albums.sort((first, second) => first.createdAt - second.createdAt)
}

export async function createAlbum(name: string): Promise<Album> {
  const album: Album = {
    id: crypto.randomUUID(),
    name,
    createdAt: Date.now(),
  }
  const database = await openDatabase()
  const transaction = database.transaction('albums', 'readwrite')
  transaction.objectStore('albums').add(album)
  await transactionComplete(transaction)
  database.close()

  return album
}

export async function getAlbum(id: string): Promise<Album | undefined> {
  const database = await openDatabase()
  const transaction = database.transaction('albums', 'readonly')
  const album = await requestResult(transaction.objectStore('albums').get(id))
  await transactionComplete(transaction)
  database.close()

  return album
}

export async function listPhotoSets(albumId: string): Promise<PhotoSet[]> {
  const database = await openDatabase()
  const transaction = database.transaction('photoSets', 'readonly')
  const photoSets = await requestResult(
    transaction.objectStore('photoSets').index('albumId').getAll(albumId),
  )
  await transactionComplete(transaction)
  database.close()

  return photoSets.sort((first, second) => first.createdAt - second.createdAt)
}

export async function createPhotoSet(
  albumId: string,
  name: string,
  before: Blob,
  after: Blob,
): Promise<PhotoSet> {
  const photoSet: PhotoSet = {
    id: crypto.randomUUID(),
    albumId,
    name,
    before,
    after,
    createdAt: Date.now(),
  }
  const database = await openDatabase()
  const transaction = database.transaction('photoSets', 'readwrite')
  transaction.objectStore('photoSets').add(photoSet)
  await transactionComplete(transaction)
  database.close()

  return photoSet
}

export async function updatePhotoSet(photoSet: PhotoSet): Promise<PhotoSet> {
  const database = await openDatabase()
  const transaction = database.transaction('photoSets', 'readwrite')
  transaction.objectStore('photoSets').put(photoSet)
  await transactionComplete(transaction)
  database.close()

  return photoSet
}

export async function deletePhotoSet(id: string): Promise<void> {
  const database = await openDatabase()
  const transaction = database.transaction('photoSets', 'readwrite')
  transaction.objectStore('photoSets').delete(id)
  await transactionComplete(transaction)
  database.close()
}
