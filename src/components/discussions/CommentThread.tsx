'use client'

import { useState, useEffect, useCallback } from 'react'
import { MessageSquare } from 'lucide-react'
import { CommentForm } from './CommentForm'
import { CommentCard, type CommentData } from './CommentCard'

interface CommentThreadProps {
  lessonId?: string
  challengeId?: string
  placeholder?: string
}

const PAGE_SIZE = 20

export function CommentThread({
  lessonId,
  challengeId,
  placeholder,
}: CommentThreadProps) {
  const [comments, setComments] = useState<CommentData[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)

  const queryKey = lessonId
    ? `lessonId=${lessonId}`
    : challengeId
      ? `challengeId=${challengeId}`
      : ''

  const fetchComments = useCallback(
    async (pageNum: number, append = false) => {
      if (!queryKey) return
      try {
        const res = await fetch(
          `/api/comments?${queryKey}&page=${pageNum}&limit=${PAGE_SIZE}`
        )
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()

        if (append) {
          setComments((prev) => [...prev, ...data.comments])
        } else {
          setComments(data.comments)
        }
        setTotalCount(data.totalCount ?? data.comments.length)
      } catch {
        // Silently fail — comments are non-critical
      }
    },
    [queryKey]
  )

  useEffect(() => {
    setLoading(true)
    fetchComments(1).finally(() => setLoading(false))
  }, [fetchComments])

  async function handleLoadMore() {
    const nextPage = page + 1
    setLoadingMore(true)
    await fetchComments(nextPage, true)
    setPage(nextPage)
    setLoadingMore(false)
  }

  async function handleNewComment(body: string) {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        body,
        lessonId: lessonId ?? undefined,
        challengeId: challengeId ?? undefined,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error ?? 'Failed to post')
    }
    // Refresh comments
    await fetchComments(1)
    setPage(1)
  }

  async function handleReply(parentId: string, body: string) {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        body,
        parentId,
        lessonId: lessonId ?? undefined,
        challengeId: challengeId ?? undefined,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error ?? 'Failed to reply')
    }
    await fetchComments(1)
    setPage(1)
  }

  async function handleEdit(commentId: string, body: string) {
    const res = await fetch(`/api/comments/${commentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    })
    if (!res.ok) throw new Error('Failed to edit')
    await fetchComments(1)
    setPage(1)
  }

  async function handleDelete(commentId: string) {
    const res = await fetch(`/api/comments/${commentId}`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error('Failed to delete')
    await fetchComments(1)
    setPage(1)
  }

  async function handleToggleHide(commentId: string, hidden: boolean) {
    const res = await fetch(`/api/comments/${commentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hidden }),
    })
    if (!res.ok) throw new Error('Failed to update')
    await fetchComments(1)
    setPage(1)
  }

  // Separate top-level and nested
  const topLevel = comments.filter((c) => !c.parentId)
  const shownCount = comments.length
  const hasMore = shownCount < totalCount

  return (
    <div className="mt-12 pt-8 border-t border-black/6">
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MessageSquare size={20} className="text-text-secondary" />
          <h2 className="text-xl font-bold text-text-primary">Discussion</h2>
          {!loading && totalCount > 0 && (
            <span className="text-sm text-text-tertiary">
              ({totalCount} comment{totalCount !== 1 ? 's' : ''})
            </span>
          )}
        </div>
      </div>

      {/* New comment form */}
      <div className="mb-6">
        <CommentForm
          lessonId={lessonId}
          challengeId={challengeId}
          onSubmit={handleNewComment}
          placeholder={placeholder}
        />
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-0">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-3 py-4 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-bg-overlay flex-shrink-0" />
              <div className="flex-1">
                <div className="h-3 w-24 rounded bg-bg-overlay mb-2" />
                <div className="h-3 w-full rounded bg-bg-overlay mb-1.5" />
                <div className="h-3 w-3/4 rounded bg-bg-overlay" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && topLevel.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare
            size={32}
            className="mx-auto text-text-tertiary mb-3"
          />
          <p className="text-sm font-medium text-text-secondary mb-1">
            No comments yet
          </p>
          <p className="text-xs text-text-tertiary">
            Be the first to share your thoughts.
          </p>
        </div>
      )}

      {/* Comment list */}
      {!loading && topLevel.length > 0 && (
        <div className="space-y-0">
          {topLevel.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleHide={handleToggleHide}
            />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && !loading && (
        <button
          onClick={handleLoadMore}
          disabled={loadingMore}
          className="w-full py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded-xl transition-colors text-center mt-4"
        >
          {loadingMore
            ? 'Loading...'
            : `Load more comments (showing ${shownCount} of ${totalCount})`}
        </button>
      )}
    </div>
  )
}
