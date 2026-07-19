import '@testing-library/jest-dom'
import 'fake-indexeddb/auto'
import { afterEach } from 'vitest'

afterEach(async () => {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase('picture-catalog')
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    request.onblocked = () => resolve()
  })
})
