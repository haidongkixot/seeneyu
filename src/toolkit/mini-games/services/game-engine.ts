import { prisma } from '@/lib/prisma'
import type { GameConfig, RoundData, LeaderboardEntry, SessionResult, RoundResult } from '../types'

// ── Game Config ─────────────────────────────────────────────────────────────

export async function getGameConfig(type: string) {
  const game = await (prisma as any).miniGame.findUnique({
    where: { type },
    include: { _count: { select: { rounds: true } } },
  })
  if (!game) return null

  return {
    id: game.id,
    type: game.type,
    title: game.title,
    description: game.description,
    isActive: game.isActive,
    config: game.config as GameConfig,
    roundCount: game._count.rounds,
  }
}

// ── Random Rounds ───────────────────────────────────────────────────────────

export async function getRandomRounds(gameId: string, count: number): Promise<RoundData[]> {
  // Fetch all rounds for the game, then pick random subset
  const allRounds = await (prisma as any).miniGameRound.findMany({
    where: { gameId },
    orderBy: { orderIndex: 'asc' },
  })

  // Shuffle using Fisher-Yates
  const shuffled = [...allRounds]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  const selected = shuffled.slice(0, Math.min(count, shuffled.length))

  return selected.map((r: any) => ({
    id: r.id,
    orderIndex: r.orderIndex,
    prompt: r.prompt,
    imageUrl: r.imageUrl,
    options: r.options as string[] | null,
  }))
}

// ── Score a Round ───────────────────────────────────────────────────────────

export async function scoreRound(roundId: string, answer: string): Promise<{ correct: boolean; correctAnswer: string | null }> {
  const round = await (prisma as any).miniGameRound.findUnique({
    where: { id: roundId },
  })
  if (!round) throw new Error('Round not found')

  const correct = round.correctAnswer
    ? round.correctAnswer.toLowerCase().trim() === answer.toLowerCase().trim()
    : false

  return { correct, correctAnswer: round.correctAnswer }
}

// ── Session Management ──────────────────────────────────────────────────────

export async function createSession(gameId: string, playerId?: string, playerName?: string) {
  const game = await (prisma as any).miniGame.findUnique({ where: { id: gameId } })
  if (!game) throw new Error('Game not found')

  const config = game.config as GameConfig

  const session = await (prisma as any).miniGameSession.create({
    data: {
      gameId,
      playerId: playerId || null,
      playerName: playerName || null,
      score: 0,
      totalRounds: config.totalRounds,
      responses: [],
    },
  })

  return session
}

export async function completeSession(
  sessionId: string,
  responses: RoundResult[],
  playerName?: string
): Promise<SessionResult> {
  const session = await (prisma as any).miniGameSession.findUnique({
    where: { id: sessionId },
    include: { game: true },
  })
  if (!session) throw new Error('Session not found')

  const correctCount = responses.filter(r => r.correct).length
  const score = Math.round((correctCount / Math.max(responses.length, 1)) * 100)
  const config = session.game.config as GameConfig

  const updated = await (prisma as any).miniGameSession.update({
    where: { id: sessionId },
    data: {
      score,
      responses: responses as any,
      completedAt: new Date(),
      playerName: playerName || session.playerName,
    },
  })

  // Calculate leaderboard position
  const higherCount = await (prisma as any).miniGameSession.count({
    where: {
      gameId: session.gameId,
      completedAt: { not: null },
      score: { gt: score },
    },
  })

  return {
    sessionId,
    gameType: session.game.type,
    score,
    totalRounds: responses.length,
    correctCount,
    leaderboardPosition: higherCount + 1,
    passed: score >= config.passingScore,
  }
}

// ── Leaderboard ─────────────────────────────────────────────────────────────

export async function getLeaderboard(gameType: string, limit = 20): Promise<LeaderboardEntry[]> {
  const game = await (prisma as any).miniGame.findUnique({ where: { type: gameType } })
  if (!game) return []

  const sessions = await (prisma as any).miniGameSession.findMany({
    where: {
      gameId: game.id,
      completedAt: { not: null },
    },
    orderBy: { score: 'desc' },
    take: limit,
  })

  return sessions.map((s: any, i: number) => ({
    rank: i + 1,
    playerName: s.playerName || 'Anonymous',
    score: s.score,
    totalRounds: s.totalRounds,
    completedAt: s.completedAt?.toISOString() ?? '',
  }))
}
