'use client'

import { NavBar } from '@/components/NavBar'
import { LeaderboardTable } from '@/components/gamification/LeaderboardTable'
import { ActivityFeed } from '@/components/gamification/ActivityFeed'
import { Trophy, Activity } from 'lucide-react'

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-bg-base">
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-10 pb-20">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Trophy size={24} className="text-accent-400" />
            <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">
              Leaderboard
            </h1>
          </div>
          <p className="text-text-secondary text-sm">
            Compete with other learners and track your progress
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leaderboard — takes 2 columns */}
          <div className="lg:col-span-2">
            <LeaderboardTable />
          </div>

          {/* Activity Feed sidebar */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Activity size={16} className="text-accent-400" />
              <h2 className="text-sm font-bold text-text-primary">Activity Feed</h2>
            </div>
            <ActivityFeed />
          </div>
        </div>
      </main>
    </div>
  )
}
