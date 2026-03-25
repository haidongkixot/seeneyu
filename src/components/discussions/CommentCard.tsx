'use client'

import { useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import {
  Reply,
  MoreHorizontal,
  Pencil,
  Trash2,
  EyeOff,
  Eye,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { CommentForm } from './CommentForm'

export interface CommentData {
  id: string
  body: string
  createdAt: string
  updatedAt: string
  hidden: boolean
  userId: string
  userName: string
  parentId: string | null
  replies?: CommentData[]
}

interface CommentCardProps {
  comment: CommentData
  isReply?: boolean
  onReply?: (parentId: string, body: string) => Promise<void>
  onEdit?: (commentId: string, body: string) => Promise<void>
  onDelete?: (commentId: string) => Promise<void>
  onToggleHide?: (commentId: string, hidden: boolean) => Promise<void>
}

const AVATAR_VARIANTS = [
  { bg: 'bg-violet-500/20', text: 'text-violet-400' },
  { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
  { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  { bg: 'bg-amber-500/20', text: 'text-amber-400' },
  { bg: 'bg-rose-500/20', text: 'text-rose-400' },
]

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return Math.abs(hash)
}

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay === 1) return 'Yesterday'
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString()
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function canEdit(createdAt: string): boolean {
  const created = new Date(createdAt)
  const now = new Date()
  return now.getTime() - created.getTime() < 15 * 60 * 1000
}

export function CommentCard({
  comment,
  isReply = false,
  onReply,
  onEdit,
  onDelete,
  onToggleHide,
}: CommentCardProps) {
  const { data: session } = useSession()
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editBody, setEditBody] = useState(comment.body)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const userId = (session?.user as any)?.id as string | undefined
  const userRole = (session?.user as any)?.role as string | undefined
  const isOwner = userId === comment.userId
  const isAdmin = userRole === 'admin'
  const isEdited = comment.updatedAt !== comment.createdAt
  const showEditOption = isOwner && canEdit(comment.createdAt)

  const variant = useMemo(
    () => AVATAR_VARIANTS[hashCode(comment.userId) % AVATAR_VARIANTS.length],
    [comment.userId]
  )

  const avatarSize = isReply ? 'w-6 h-6' : 'w-8 h-8'
  const avatarTextSize = isReply ? 'text-[10px]' : 'text-xs'

  // Hidden comment view for admins
  if (comment.hidden && !isAdmin) return null

  async function handleEdit() {
    if (!editBody.trim() || actionLoading) return
    setActionLoading(true)
    try {
      await onEdit?.(comment.id, editBody.trim())
      setEditing(false)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDelete() {
    setActionLoading(true)
    try {
      await onDelete?.(comment.id)
    } finally {
      setActionLoading(false)
      setConfirmDelete(false)
    }
  }

  async function handleToggleHide() {
    setActionLoading(true)
    try {
      await onToggleHide?.(comment.id, !comment.hidden)
    } finally {
      setActionLoading(false)
      setShowMenu(false)
    }
  }

  return (
    <div
      className={cn(
        'flex gap-3 items-start py-4',
        !isReply && 'first:border-t-0 [&:not(:first-child)]:border-t border-white/5',
        comment.hidden && 'opacity-50'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 rounded-full font-bold flex items-center justify-center',
          avatarSize,
          avatarTextSize,
          variant.bg,
          variant.text
        )}
      >
        {getInitials(comment.userName)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span
            className={cn(
              'font-medium text-text-primary',
              isReply ? 'text-xs' : 'text-sm'
            )}
          >
            {comment.userName}
          </span>
          <span className="text-text-tertiary text-xs">&middot;</span>
          <span className="text-xs text-text-tertiary">
            {getRelativeTime(comment.createdAt)}
          </span>
          {isEdited && (
            <span className="text-xs text-text-tertiary italic">(edited)</span>
          )}

          {/* Overflow menu */}
          {(isOwner || isAdmin) && (
            <div className="ml-auto relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-text-tertiary hover:text-text-secondary rounded transition-colors"
              >
                <MoreHorizontal size={14} />
              </button>
              {showMenu && (
                <>
                  {/* Click-away backdrop */}
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-6 w-36 bg-bg-elevated border border-white/8 rounded-xl shadow-lg py-1 z-30">
                    {showEditOption && (
                      <button
                        onClick={() => {
                          setEditing(true)
                          setEditBody(comment.body)
                          setShowMenu(false)
                        }}
                        className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-overlay transition-colors w-full text-left flex items-center gap-2"
                      >
                        <Pencil size={12} />
                        Edit
                      </button>
                    )}
                    {isOwner && (
                      <button
                        onClick={() => {
                          setConfirmDelete(true)
                          setShowMenu(false)
                        }}
                        className="px-3 py-1.5 text-sm text-text-secondary hover:text-error hover:bg-bg-overlay transition-colors w-full text-left flex items-center gap-2"
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={handleToggleHide}
                        className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-overlay transition-colors w-full text-left flex items-center gap-2"
                      >
                        {comment.hidden ? (
                          <>
                            <Eye size={12} />
                            Unhide
                          </>
                        ) : (
                          <>
                            <EyeOff size={12} />
                            Hide
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Body */}
        {confirmDelete ? (
          <div className="flex items-center gap-3 py-2 animate-fade-in">
            <span className="text-sm text-text-secondary">
              Delete this comment?
            </span>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={actionLoading}
              className="text-xs text-error hover:bg-error/10 rounded-lg px-2 py-1 font-medium transition-colors flex items-center gap-1"
            >
              {actionLoading && <Loader2 size={10} className="animate-spin" />}
              Delete
            </button>
          </div>
        ) : editing ? (
          <div className="animate-fade-in">
            <textarea
              value={editBody}
              onChange={(e) => {
                if (e.target.value.length <= 500) setEditBody(e.target.value)
              }}
              className={cn(
                'w-full bg-bg-inset border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary',
                'placeholder:text-text-tertiary resize-none min-h-[60px] max-h-[200px]',
                'focus:outline-none focus:border-accent-400/40 focus:shadow-glow-sm transition-all'
              )}
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => setEditing(false)}
                className="text-xs text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={!editBody.trim() || actionLoading}
                className="bg-accent-400 text-text-inverse rounded-xl px-3 py-1 text-xs font-semibold hover:bg-accent-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {actionLoading && <Loader2 size={10} className="animate-spin" />}
                Save
              </button>
            </div>
          </div>
        ) : comment.hidden ? (
          <p className="text-xs text-text-tertiary italic">
            This comment has been hidden by an admin.
          </p>
        ) : (
          <p
            className={cn(
              'text-text-secondary leading-relaxed whitespace-pre-wrap break-words',
              isReply ? 'text-xs' : 'text-sm'
            )}
          >
            {comment.body}
          </p>
        )}

        {/* Actions */}
        {!isReply && !editing && !confirmDelete && !comment.hidden && (
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="flex items-center gap-1 text-xs text-text-tertiary hover:text-text-secondary transition-colors"
            >
              <Reply size={12} />
              Reply
            </button>
          </div>
        )}

        {/* Inline reply form */}
        {showReplyForm && onReply && (
          <div className="mt-3">
            <CommentForm
              parentId={comment.id}
              replyToName={comment.userName}
              onSubmit={async (body) => {
                await onReply(comment.id, body)
                setShowReplyForm(false)
              }}
              onCancel={() => setShowReplyForm(false)}
            />
          </div>
        )}

        {/* Nested replies */}
        {!isReply && comment.replies && comment.replies.length > 0 && (
          <div className="ml-0 md:ml-0 mt-1 space-y-0">
            {comment.replies.map((reply) => (
              <CommentCard
                key={reply.id}
                comment={reply}
                isReply
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleHide={onToggleHide}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
