'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, FileArchive, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface ImportResult {
  success: boolean
  type: string
  id?: string
  title?: string
  error?: string
  details?: string[]
}

export default function ImportPage() {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [fileName, setFileName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.zip')) {
      setResult({ success: false, type: 'unknown', error: 'Please select a .zip file' })
      return
    }

    setFileName(file.name)
    setLoading(true)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/admin/import-zip', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        setResult({ success: false, type: 'unknown', error: data.error, details: data.details })
      } else {
        setResult(data)
      }
    } catch {
      setResult({ success: false, type: 'unknown', error: 'Network error — could not upload file' })
    } finally {
      setLoading(false)
    }
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const onDragLeave = useCallback(() => setDragging(false), [])

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-text-primary mb-1">Import Content</h1>
      <p className="text-text-secondary text-sm mb-8">
        Upload a ZIP file containing clip data (metadata.json + optional screenplay.txt, practice-steps.json).
      </p>

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`
          relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-200
          ${dragging
            ? 'border-accent-400 bg-accent-400/10'
            : 'border-white/10 bg-bg-surface hover:border-white/20 hover:bg-bg-overlay'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".zip"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />

        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={40} className="text-accent-400 animate-spin" />
            <p className="text-text-primary font-medium">Importing {fileName}…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className={`rounded-full p-4 ${dragging ? 'bg-accent-400/20' : 'bg-bg-inset'}`}>
              {dragging ? <FileArchive size={32} className="text-accent-400" /> : <Upload size={32} className="text-text-secondary" />}
            </div>
            <div>
              <p className="text-text-primary font-medium">
                {dragging ? 'Drop to import' : 'Drag & drop a ZIP file here'}
              </p>
              <p className="text-text-muted text-sm mt-1">or click to browse (max 10MB)</p>
            </div>
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className={`mt-6 rounded-2xl border p-6 ${
          result.success
            ? 'bg-success/10 border-success/30'
            : 'bg-error/10 border-error/30'
        }`}>
          <div className="flex items-start gap-3">
            {result.success
              ? <CheckCircle size={20} className="text-success mt-0.5 flex-shrink-0" />
              : <AlertCircle size={20} className="text-error mt-0.5 flex-shrink-0" />
            }
            <div>
              <p className={`font-semibold ${result.success ? 'text-success' : 'text-error'}`}>
                {result.success ? 'Import Successful' : 'Import Failed'}
              </p>
              {result.title && (
                <p className="text-text-primary text-sm mt-1">{result.title}</p>
              )}
              {result.error && (
                <p className="text-text-secondary text-sm mt-1">{result.error}</p>
              )}
              {result.details && result.details.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {result.details.map((d, i) => (
                    <li key={i} className="text-text-muted text-xs">• {d}</li>
                  ))}
                </ul>
              )}
              {result.success && result.id && (
                <a
                  href={`/admin/clips/${result.id}/edit`}
                  className="inline-block mt-3 text-sm text-accent-400 hover:text-accent-300 font-medium"
                >
                  Edit imported clip →
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Help section */}
      <div className="mt-8 bg-bg-surface border border-white/8 rounded-2xl p-6">
        <p className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
          ZIP File Format
        </p>
        <div className="text-sm text-text-tertiary space-y-2">
          <p><code className="text-text-secondary bg-bg-inset px-1.5 py-0.5 rounded">metadata.json</code> — Required. Contains clip data:</p>
          <pre className="bg-bg-inset rounded-xl p-3 text-xs text-text-muted overflow-x-auto">{`{
  "type": "clip",
  "clip": {
    "youtubeVideoId": "abc123",
    "movieTitle": "The Movie",
    "sceneDescription": "...",
    "skillCategory": "eye-contact",
    "difficulty": "Beginner",
    "startSec": 0, "endSec": 120
  },
  "annotations": [...],
  "observation_guide": {...}
}`}</pre>
          <p><code className="text-text-secondary bg-bg-inset px-1.5 py-0.5 rounded">screenplay.txt</code> — Optional. Full screenplay text.</p>
          <p><code className="text-text-secondary bg-bg-inset px-1.5 py-0.5 rounded">practice-steps.json</code> — Optional. Array of practice steps.</p>
        </div>
      </div>
    </div>
  )
}
