import { describe, expect, it } from 'vitest'
import { deletePictureCatalog } from './setup'

describe('deletePictureCatalog', () => {
  it('rejects when a database connection blocks deletion', async () => {
    const request = {} as IDBOpenDBRequest
    const indexedDb = {
      deleteDatabase: () => request,
    } as unknown as IDBFactory

    const deletion = deletePictureCatalog(indexedDb)
    request.onblocked?.(new Event('blocked'))

    await expect(deletion).rejects.toThrow('blocked')
  })
})
