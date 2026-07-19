import { useEffect, useId, useState, type DragEvent } from 'react'

interface DropZoneProps {
  label: string
  file: File | null
  error?: string
  onFileChange: (file: File | null) => void
}

function isImage(file: File | null): file is File {
  return Boolean(file?.type.startsWith('image/'))
}

export function DropZone({ label, file, error, onFileChange }: DropZoneProps) {
  const inputId = useId()
  const [isDragging, setIsDragging] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!isImage(file)) {
      setPreviewUrl(null)
      return
    }

    if (typeof URL.createObjectURL !== 'function') return

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  function selectFile(files: FileList | null) {
    onFileChange(files?.[0] ?? null)
  }

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setIsDragging(true)
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setIsDragging(false)
    selectFile(event.dataTransfer.files)
  }

  return (
    <div className="drop-zone-field">
      <label
        className={`drop-zone${isDragging ? ' drag-over' : ''}`}
        htmlFor={inputId}
        onDragEnter={handleDragOver}
        onDragLeave={(event) => {
          event.preventDefault()
          setIsDragging(false)
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        tabIndex={0}
      >
        <span>{label}</span>
        <span className="drop-zone-prompt">Drop an image here or choose a file</span>
        <input
          id={inputId}
          className="visually-hidden"
          type="file"
          accept="image/*"
          aria-describedby={error ? `${inputId}-error` : undefined}
          aria-invalid={Boolean(error)}
          onChange={(event) => selectFile(event.currentTarget.files)}
        />
        {file && <span className="drop-zone-file">{file.name}</span>}
        {previewUrl && <img className="drop-zone-preview" src={previewUrl} alt={`${label} preview`} />}
      </label>
      {error && <p id={`${inputId}-error`} className="form-error">{error}</p>}
    </div>
  )
}
