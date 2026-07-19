import '@testing-library/jest-dom'
import 'fake-indexeddb/auto'
import { afterEach } from 'vitest'

export async function deletePictureCatalog(database: IDBFactory = indexedDB) {
  await new Promise<void>((resolve, reject) => {
    const request = database.deleteDatabase('picture-catalog')
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('Deleting picture-catalog was blocked'))
  })
}

afterEach(async () => {
  await deletePictureCatalog()
})
