import { useState, type FormEvent } from 'react'
import { validatePhotoSet } from '../validation'
import { DropZone } from './DropZone'

interface PhotoSetFormProps {
  onSave: (name: string, before: File, after: File) => Promise<void>
}

export function PhotoSetForm({ onSave }: PhotoSetFormProps) {
  const [name, setName] = useState('')
  const [before, setBefore] = useState<File | null>(null)
  const [after, setAfter] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const validation = validatePhotoSet({ name, before, after })

  function handleFileChange(field: 'before' | 'after', file: File | null) {
    const fieldError = validatePhotoSet({ name, before: field === 'before' ? file : before, after: field === 'after' ? file : after })[field]
    if (field === 'before') setBefore(file)
    else setAfter(file)
    setErrors((currentErrors) => ({ ...currentErrors, [field]: fieldError }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (Object.keys(validation).length > 0 || !before || !after) {
      setErrors(validation)
      return
    }

    setIsSaving(true)
    try {
      await onSave(name.trim(), before, after)
      setName('')
      setBefore(null)
      setAfter(null)
      setErrors({})
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="photo-set-form" onSubmit={handleSubmit}>
      <label htmlFor="photo-set-name">Set name</label>
      <input
        id="photo-set-name"
        value={name}
        onChange={(event) => {
          setName(event.target.value)
          setErrors((currentErrors) => ({ ...currentErrors, name: '' }))
        }}
        aria-describedby={errors.name ? 'photo-set-name-error' : undefined}
        aria-invalid={Boolean(errors.name)}
      />
      {errors.name && <p id="photo-set-name-error" className="form-error">{errors.name}</p>}
      <DropZone label="Before" file={before} error={errors.before} onFileChange={(file) => handleFileChange('before', file)} />
      <DropZone label="After" file={after} error={errors.after} onFileChange={(file) => handleFileChange('after', file)} />
      <div className="form-actions">
        <button type="submit" disabled={isSaving || Object.keys(validation).length > 0}>
          {isSaving ? 'Saving…' : 'Save photo set'}
        </button>
      </div>
    </form>
  )
}
