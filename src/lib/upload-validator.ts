/**
 * Upload validation utility — validates file type and size before processing.
 * Use on ALL upload routes to prevent arbitrary file uploads and storage abuse.
 */

export interface UploadValidationOptions {
  /** Max file size in bytes. Default: 50MB */
  maxBytes?: number
  /** Allowed MIME type prefixes. E.g. ['video/', 'audio/'] */
  allowedTypes?: string[]
  /** Allowed file extensions (lowercase, with dot). E.g. ['.webm', '.mp4'] */
  allowedExtensions?: string[]
}

export interface UploadValidationResult {
  valid: boolean
  error?: string
}

const DEFAULT_MAX_BYTES = 50 * 1024 * 1024 // 50MB

export function validateUpload(
  file: File,
  options: UploadValidationOptions = {},
): UploadValidationResult {
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES
  const allowedTypes = options.allowedTypes
  const allowedExtensions = options.allowedExtensions

  // Size check
  if (file.size > maxBytes) {
    const maxMB = Math.round(maxBytes / 1024 / 1024)
    const fileMB = (file.size / 1024 / 1024).toFixed(1)
    return { valid: false, error: `File too large (${fileMB}MB). Maximum: ${maxMB}MB.` }
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty.' }
  }

  // MIME type check
  if (allowedTypes && allowedTypes.length > 0) {
    const fileType = (file.type || '').toLowerCase()
    const typeMatch = allowedTypes.some(t => fileType.startsWith(t))
    if (!typeMatch) {
      return { valid: false, error: `File type "${fileType}" not allowed. Accepted: ${allowedTypes.join(', ')}` }
    }
  }

  // Extension check
  if (allowedExtensions && allowedExtensions.length > 0) {
    const fileName = (file.name || '').toLowerCase()
    const ext = fileName.includes('.') ? '.' + fileName.split('.').pop() : ''
    const extMatch = allowedExtensions.some(e => ext === e)
    if (!extMatch) {
      return { valid: false, error: `File extension "${ext}" not allowed. Accepted: ${allowedExtensions.join(', ')}` }
    }
  }

  return { valid: true }
}

// ── Preset validators for common use cases ──

export const VIDEO_UPLOAD = {
  maxBytes: 50 * 1024 * 1024,
  allowedTypes: ['video/'],
} satisfies UploadValidationOptions

export const IMAGE_UPLOAD = {
  maxBytes: 10 * 1024 * 1024,
  allowedTypes: ['image/'],
} satisfies UploadValidationOptions

export const CMS_UPLOAD = {
  maxBytes: 10 * 1024 * 1024,
  allowedTypes: ['image/', 'application/pdf'],
} satisfies UploadValidationOptions

export const SMALL_IMAGE_UPLOAD = {
  maxBytes: 5 * 1024 * 1024,
  allowedTypes: ['image/'],
} satisfies UploadValidationOptions
