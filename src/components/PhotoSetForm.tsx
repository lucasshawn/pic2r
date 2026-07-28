import { useState, type FormEvent } from 'react'
import type { PhotoSet } from '../types'
import { validatePhotoSet } from '../validation'
import { DropZone } from './DropZone'
import { convertHeicToJpeg } from '../heicHelper'

interface PhotoSetFormProps {
  initialPhotoSet?: PhotoSet
  submitLabel?: string
  onCancel?: () => void
  onSave: (name: string, description: string, before: File | null, after: File | null) => Promise<void>
}

export function PhotoSetForm({ initialPhotoSet, submitLabel = 'Save Before & After', onCancel, onSave }: PhotoSetFormProps) {
  const [name, setName] = useState(initialPhotoSet?.name ?? '')
  const [description, setDescription] = useState(initialPhotoSet?.description ?? '')
  const [before, setBefore] = useState<File | null>(null)
  const [after, setAfter] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const baseValidation = validatePhotoSet({ name, before, after })
  const validation = {
    ...baseValidation,
    ...(initialPhotoSet && !before ? { before: undefined } : {}),
    ...(initialPhotoSet && !after ? { after: undefined } : {}),
  }

  function handleFileChange(field: 'before' | 'after', file: File | null) {
    const fieldError = validatePhotoSet({ name, before: field === 'before' ? file : before, after: field === 'after' ? file : after })[field]
    const existingImage = field === 'before' ? initialPhotoSet?.before : initialPhotoSet?.after
    const resolvedFieldError = !file && existingImage ? undefined : fieldError
    if (resolvedFieldError) {
      setErrors((currentErrors) => ({ ...currentErrors, [field]: resolvedFieldError }))
      return
    }

    if (field === 'before') setBefore(file)
    else setAfter(field === 'after' ? file : after)
    setErrors((currentErrors) => ({ ...currentErrors, [field]: resolvedFieldError }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (Object.values(validation).some(Boolean) || (!initialPhotoSet && !before)) {
      setErrors(validation)
      return
    }

    setIsSaving(true)
    try {
      const finalBefore = before ? await convertHeicToJpeg(before) : null
      const finalAfter = after ? await convertHeicToJpeg(after) : null
      await onSave(name.trim(), description.trim(), finalBefore, finalAfter)
      setName('')
      setDescription('')
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
      <label htmlFor="photo-set-description">Description (optional)</label>
      <textarea
        id="photo-set-description"
        rows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Add details about this before & after..."
      />
      <DropZone label="Before" file={before} error={errors.before} onFileChange={(file) => handleFileChange('before', file)} />
      <DropZone label="After photo (optional)" file={after} error={errors.after} onFileChange={(file) => handleFileChange('after', file)} />
      <div className="form-actions">
        {onCancel && <button type="button" onClick={onCancel}>Cancel</button>}
        <button type="submit" disabled={isSaving || Object.values(validation).some(Boolean)}>
          {isSaving ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
