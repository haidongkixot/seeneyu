/**
 * Strip HTML tags from a string. Simple regex-based approach.
 * Also trims whitespace and enforces max length.
 */
export function sanitizeCommentBody(raw: string, maxLength = 500): string {
  // Strip HTML tags
  const stripped = raw.replace(/<[^>]*>/g, '')
  // Collapse excessive whitespace but preserve single newlines
  const cleaned = stripped.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
  // Enforce max length
  return cleaned.slice(0, maxLength)
}
