'use client'

import { useEffect, useState } from 'react'
import { NavBar } from '@/components/NavBar'
import { SubmissionCard } from '@/components/SubmissionCard'
import { Loader2, Video } from 'lucide-react'
import Link from 'next/link'

interface Submission {
  id: string
  clipId: string
  skillCategory: string
  recordingUrl: string | null
  thumbnailUrl: string | null
  score: number | null
  status: string
  createdAt: string
}

interface SubmissionsResponse {
  items: Submission[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export default function SubmissionsPage() {
  const [data, setData] = useState<SubmissionsResponse | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/submissions?page=${page}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page])

  return (
    <div className="min-h-screen bg-bg-base">
      <NavBar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">My Submissions</h1>
            <p className="text-sm text-text-secondary mt-1">Review your past practice recordings and AI feedback.</p>
          </div>
        </div>

        {loading && !data ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-accent-400" />
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 bg-bg-overlay rounded-full flex items-center justify-center">
              <Video size={28} className="text-text-tertiary" />
            </div>
            <p className="text-text-secondary text-sm">No submissions yet. Start practicing to see your recordings here.</p>
            <Link
              href="/library"
              className="bg-accent-400 text-text-inverse rounded-pill px-6 py-2.5 text-sm font-semibold hover:bg-accent-500 transition-all duration-150"
            >
              Browse Library
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.items.map((sub) => (
                <SubmissionCard
                  key={sub.id}
                  id={sub.id}
                  type="foundation"
                  thumbnailUrl={sub.thumbnailUrl}
                  score={sub.score}
                  skillCategory={sub.skillCategory}
                  date={sub.createdAt}
                />
              ))}
            </div>

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-4 py-2 text-sm border border-black/10 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-overlay transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-text-secondary">
                  Page {data.page} of {data.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page >= data.totalPages}
                  className="px-4 py-2 text-sm border border-black/10 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-overlay transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
