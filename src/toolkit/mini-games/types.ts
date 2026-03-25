// ── Mini-Games Type Definitions ─────────────────────────────────────────────

export type GameType = 'guess_expression' | 'match_expression' | 'expression_king'

export interface GameConfig {
  timePerRound: number   // seconds per round
  totalRounds: number    // number of rounds per session
  passingScore: number   // minimum score to "pass"
}

export interface RoundData {
  id: string
  orderIndex: number
  prompt: string
  imageUrl: string | null
  options: string[] | null  // null for open-ended, string[] for multiple choice
}

export interface RoundResult {
  roundId: string
  answer: string
  correct: boolean
  timeMs: number
  score?: number          // for expression_king: AI score 0-100
  analysis?: string       // for expression_king: AI analysis text
}

export interface SessionResult {
  sessionId: string
  gameType: string
  score: number
  totalRounds: number
  correctCount: number
  leaderboardPosition: number | null
  passed: boolean
  certificate?: CertificateData
}

export interface CertificateData {
  sessionId: string
  playerName: string
  gameTitle: string
  score: number
  totalRounds: number
  correctCount: number
  completedAt: string
  challengesPassed: string[]
}

export interface LeaderboardEntry {
  rank: number
  playerName: string
  score: number
  totalRounds: number
  completedAt: string
}
