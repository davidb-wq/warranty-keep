'use client'

import { useState, useRef } from 'react'
import { Camera, X, Loader2, ImageIcon } from 'lucide-react'
import { compressWarrantyImage } from '@/lib/image-compression'

interface ImageUploadProps {
  value: File | null
  onChange: (file: File | null) => void
  existingUrl?: string | null
}

export function ImageUpload({ value, onChange, existingUrl }: ImageUploadProps) {
  const [compressing, setCompressing] = useState(false)
  const [preview, setPreview] = useState<string | null>(existingUrl ?? null)
  const [compressionError, setCompressionError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setCompressionError(null)

    if (file.size > 20 * 1024 * 1024) {
      setCompressionError('Image trop volumineuse (max 20 Mo). Choisissez une photo plus petite.')
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    setCompressing(true)
    try {
      const compressed = await compressWarrantyImage(file)
      const objectUrl = URL.createObjectURL(compressed)
      setPreview(objectUrl)
      onChange(compressed)
    } catch {
      setCompressionError('Impossible de compresser cette image. Essayez une photo plus petite.')
      onChange(null)
      if (inputRef.current) inputRef.current.value = ''
    } finally {
      setCompressing(false)
    }
  }

  function handleRemove() {
    setPreview(null)
    onChange(null)
    setCompressionError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  if (preview) {
    return (
      <div className="relative w-full">
        <img
          src={preview}
          alt="Aperçu de la facture"
          className="w-full max-h-48 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
        />
        <button
          type="button"
          onClick={handleRemove}
          className="absolute top-2 right-2 p-1 bg-slate-900/70 dark:bg-white/20 rounded-full text-white hover:bg-slate-900/90 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={compressing}
        className="w-full flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
      >
        {compressing ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm">Compression en cours…</span>
          </>
        ) : (
          <>
            <div className="flex gap-2">
              <Camera className="w-5 h-5" />
              <ImageIcon className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium">Prendre une photo ou choisir un fichier</span>
            <span className="text-xs text-slate-400">Compressée automatiquement (&lt; 500 Ko)</span>
          </>
        )}
      </button>
      {compressionError && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 px-3 py-2 rounded-lg">
          {compressionError}
        </p>
      )}
    </div>
  )
}
