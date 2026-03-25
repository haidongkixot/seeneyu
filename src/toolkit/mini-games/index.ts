// ── Mini-Games Barrel Exports ────────────────────────────────────────────────

export type {
  GameType,
  GameConfig,
  RoundData,
  RoundResult,
  SessionResult,
  CertificateData,
  LeaderboardEntry,
} from './types'

export {
  getGameConfig,
  getRandomRounds,
  scoreRound,
  createSession,
  completeSession,
  getLeaderboard,
} from './services/game-engine'

export {
  validateExpression,
  generateCertificate,
} from './services/expression-validator'
