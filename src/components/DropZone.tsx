import { useEffect, useId, useState, type DragEvent } from 'react'
import { isHeicFile, isImageFile, convertHeicToJpeg } from '../heicHelper'

interface DropZoneProps {
  label: string
  file: File | null
  error?: string
  onFileChange: (file: File | null) => void
}

export function DropZone({ label, file, error, onFileChange }: DropZoneProps) {
  const inputId = useId()
  const [isDragging, setIsDragging] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [conversionError, setConversionError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file || !isImageFile(file)) {
      setPreviewUrl(null)
      return
    }

    if (typeof URL.createObjectURL !== 'function') return

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  async function handleSelectedFile(rawFile: File | null) {
    setConversionError(null)
    if (!rawFile) {
      onFileChange(null)
      return
    }

    if (isHeicFile(rawFile)) {
      setIsConverting(true)
      try {
        const convertedFile = await convertHeicToJpeg(rawFile)
        onFileChange(convertedFile)
      } catch {
        setConversionError('Could not process HEIC image. Please select a JPG or PNG.')
        onFileChange(null)
      } finally {
        setIsConverting(false)
      }
    } else {
      onFileChange(rawFile)
    }
  }

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setIsDragging(true)
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setIsDragging(false)
    const droppedFile = event.dataTransfer.files?.[0] ?? null
    void handleSelectedFile(droppedFile)
  }

  const displayError = error || conversionError

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
        <span className="drop-zone-prompt">
          {isConverting ? 'Converting HEIC image...' : 'Drop an image (JPG, PNG, HEIC) here or choose a file'}
        </span>
        <input
          id={inputId}
          className="visually-hidden"
          type="file"
          accept="image/*,.heic,.heif,.HEIC,.HEIF"
          aria-describedby={displayError ? `${inputId}-error` : undefined}
          aria-invalid={Boolean(displayError)}
          onChange={(event) => void handleSelectedFile(event.currentTarget.files?.[0] ?? null)}
        />
        {file && <span className="drop-zone-file">{file.name}</span>}
        {previewUrl && <img className="drop-zone-preview" src={previewUrl} alt={`${label} preview`} />}
      </label>
      {displayError && <p id={`${inputId}-error`} className="form-error">{displayError}</p>}
    </div>
  )
}
