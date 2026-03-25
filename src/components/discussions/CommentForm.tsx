'use client'

import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/cn'

interface CommentFormProps {
  lessonId?: string
  challengeId?: string
  parentId?: string
  replyToName?: string
  onSubmit: (body: string) => Promise<void>
  onCancel?: () => void
  placeholder?: string
}

const MAX_CHARS = 500

export function CommentForm({
  parentId,
  replyToName,
  onSubmit,
  onCancel,
  placeholder,
}: CommentFormProps) {
  const { data: session } = useSession()
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isReply = !!parentId

  const initials = session?.user?.name
    ? session.user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : session?.user?.email?.[0]?.toUpperCase() ?? '?'

  if (!session?.user) {
    return (
      <div className="bg-bg-inset border border-white/6 rounded-xl p-4 text-center">
        <p className="text-sm text-text-secondary mb-2">
          Sign in to join the discussion
        </p>
        <Link
          href="/auth/signin"
          className="text-accent-400 hover:text-accent-300 font-medium text-sm"
        >
          Sign In
        </Link>
      </div>
    )
  }

  const defaultPlaceholder = isReply
    ? `Reply to ${replyToName ?? 'comment'}...`
    : placeholder ?? 'Share your thoughts...'

  const charCount = body.length

  async function handleSubmit() {
    const trimmed = body.trim()
    if (!trimmed || submitting) return

    setSubmitting(true)
    setError(null)
    try {
      await onSubmit(trimmed)
      setBody('')
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    } catch (err: any) {
      if (err?.message?.includes('rate')) {
        setError(
          "You're posting too quickly. Please wait a moment before trying again."
        )
      } else {
        setError('Failed to post comment. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    if (val.length <= MAX_CHARS) {
      setBody(val)
    }
    // Auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  return (
    <div className={cn(isReply ? 'ml-8 md:ml-11 mt-3' : '')}>
      <div className="flex gap-3 items-start">
        {!isReply && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-400/20 text-accent-400 text-xs font-bold flex items-center justify-center">
            {initials}
          </div>
        )}
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={handleTextareaChange}
            placeholder={defaultPlaceholder}
            className={cn(
              'w-full bg-bg-inset border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary',
              'placeholder:text-text-tertiary resize-none',
              'focus:outline-none focus:border-accent-400/40 focus:shadow-glow-sm transition-all',
              isReply ? 'min-h-[60px]' : 'min-h-[80px]',
              'max-h-[200px]'
            )}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                handleSubmit()
              }
            }}
          />
          <div className="flex items-center justify-between mt-2">
            <span
              className={cn(
                'text-xs',
                charCount >= MAX_CHARS
                  ? 'text-error'
                  : charCount > 450
                    ? 'text-warning'
                    : 'text-text-tertiary'
              )}
            >
              {charCount}/{MAX_CHARS}
            </span>
            <div className="flex items-center gap-2">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary rounded-xl transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!body.trim() || submitting}
                className={cn(
                  'bg-accent-400 text-text-inverse rounded-xl px-4 py-1.5 text-sm font-semibold',
                  'hover:bg-accent-500 transition-all duration-150',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                  'flex items-center gap-1.5'
                )}
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                {isReply ? 'Reply' : 'Post'}
              </button>
            </div>
          </div>
          {error && (
            <div className="bg-warning/10 border border-warning/30 rounded-xl px-3 py-2 mt-2 animate-fade-in">
              <p className="text-xs text-warning">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
