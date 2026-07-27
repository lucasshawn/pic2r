import { useState, type FormEvent } from 'react'
import { validateAlbumName } from '../validation'

interface AlbumFormProps {
  onCancel: () => void
  onSave: (name: string, description?: string) => Promise<void>
}

export function AlbumForm({ onCancel, onSave }: AlbumFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationError = validateAlbumName(name)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSaving(true)
    await onSave(name.trim(), description.trim() || undefined)
    setDescription('')
  }

  return (
    <form className="album-form" onSubmit={handleSubmit}>
      <label htmlFor="album-name">Album name</label>
      <input
        id="album-name"
        aria-describedby={error ? 'album-name-error' : undefined}
        aria-invalid={Boolean(error)}
        value={name}
        onChange={(event) => {
          setName(event.target.value)
          setError(null)
        }}
      />
      {error && <p id="album-name-error" className="form-error">{error}</p>}
      <label htmlFor="album-description">Description (optional)</label>
      <textarea
        id="album-description"
        rows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
      />
      <div className="form-actions">
        <button type="button" onClick={onCancel} disabled={isSaving}>Cancel</button>
        <button type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save album'}</button>
      </div>
    </form>
  )
}
