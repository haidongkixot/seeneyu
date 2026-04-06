// ── Video recording limits ──────────────────────────────────────────
export function getVideoLimitSec(plan: string): number {
  switch (plan) {
    case 'advanced': return 180  // 3 minutes
    case 'standard': return 60   // 1 minute
    default: return 15           // 15 seconds (was 5)
  }
}

// ── Feedback detail level ───────────────────────────────────────────
export function getFeedbackDetail(plan: string): 'score_only' | 'full' | 'full_plus' {
  switch (plan) {
    case 'advanced': return 'full_plus'
    case 'standard': return 'full'
    default: return 'score_only'  // was 'short'
  }
}

// ── Feedback sections (granular UI control) ─────────────────────────
export interface FeedbackSections {
  score: boolean
  summary: boolean
  dimensions: boolean
  positives: boolean
  improvements: boolean
  steps: boolean
  tips: boolean
  advancedTips: boolean
}

export function getFeedbackSections(plan: string): FeedbackSections {
  switch (plan) {
    case 'advanced':
      return { score: true, summary: true, dimensions: true, positives: true, improvements: true, steps: true, tips: true, advancedTips: true }
    case 'standard':
      return { score: true, summary: true, dimensions: true, positives: true, improvements: true, steps: true, tips: true, advancedTips: false }
    default:
      return { score: true, summary: true, dimensions: true, positives: false, improvements: false, steps: false, tips: false, advancedTips: false }
  }
}

// ── Foundation lesson access ────────────────────────────────────────
export function getFoundationLessonLimit(plan: string): number {
  switch (plan) {
    case 'advanced': return 999  // unlimited + VIP
    case 'standard': return 999  // unlimited
    default: return 2            // first 2 per course only
  }
}

// ── Library difficulty access ───────────────────────────────────────
export function getAllowedDifficulties(plan: string): string[] {
  switch (plan) {
    case 'advanced': return ['beginner', 'intermediate', 'advanced']
    case 'standard': return ['beginner', 'intermediate']
    default: return ['beginner']  // free = beginner only
  }
}

// ── Arcade challenges per type ──────────────────────────────────────
export function getArcadeChallengesPerType(plan: string): number {
  switch (plan) {
    case 'advanced': return 999
    case 'standard': return 999
    default: return 1  // was 3
  }
}

export function canAccessChallenge(
  challengeIndex: number,
  challengeType: string,
  allChallenges: { type: string }[],
  isAuthenticated: boolean,
  plan?: string
): boolean {
  if (plan === 'standard' || plan === 'advanced') return true
  if (!isAuthenticated) {
    const limit = getArcadeChallengesPerType('basic')
    const sameTypeBefore = allChallenges
      .slice(0, challengeIndex)
      .filter(c => c.type === challengeType).length
    return sameTypeBefore < limit
  }
  const userPlan = plan || 'basic'
  const limit = getArcadeChallengesPerType(userPlan)
  const sameTypeBefore = allChallenges
    .slice(0, challengeIndex)
    .filter(c => c.type === challengeType).length
  return sameTypeBefore < limit
}

export function canAccessPractice(isAuthenticated: boolean): boolean {
  return isAuthenticated
}

export function canAccessRecord(isAuthenticated: boolean): boolean {
  return isAuthenticated
}

// ── Coach Ney limits ────────────────────────────────────────────────
export function getAssistantLimits(plan: string) {
  switch (plan) {
    case 'advanced': return { maxMessagesPerDay: -1, voiceEnabled: true }
    case 'standard': return { maxMessagesPerDay: 20, voiceEnabled: true }
    default: return { maxMessagesPerDay: 3, voiceEnabled: false }  // was 5
  }
}

// ── Hearts per day ──────────────────────────────────────────────────
export function getHeartsConfig(plan: string) {
  switch (plan) {
    case 'advanced': return { maxHearts: 999, refillHours: 0, freezesPerWeek: 999 }
    case 'standard': return { maxHearts: 10, refillHours: 4, freezesPerWeek: 1 }
    default: return { maxHearts: 3, refillHours: 4, freezesPerWeek: 0 }  // was 5
  }
}

// ── Mini-games access ───────────────────────────────────────────────
export function getAllowedGames(plan: string): string[] {
  switch (plan) {
    case 'advanced': return ['guess-expression', 'match-expression', 'expression-king', 'emotion-timeline', 'spot-the-signal']
    case 'standard': return ['guess-expression', 'match-expression', 'expression-king', 'emotion-timeline', 'spot-the-signal']
    default: return ['guess-expression', 'match-expression']  // free = 2 games only
  }
}

// ── Discussions access ──────────────────────────────────────────────
export function canPostComments(plan: string): boolean {
  return plan === 'standard' || plan === 'advanced'
}

// ── M62-M65 Feature Gating ─────────────────────────────────────────

/** M62: Hand gesture scoring — free gets detection only, standard+ gets full scoring */
export function getHandGestureAccess(plan: string): 'none' | 'detection' | 'full' {
  switch (plan) {
    case 'advanced': return 'full'
    case 'standard': return 'full'
    default: return 'detection' // hand landmarks captured but not scored
  }
}

/** M63: Temporal analysis detail level */
export function getTemporalAccess(plan: string): 'none' | 'basic' | 'full' {
  switch (plan) {
    case 'advanced': return 'full'   // smoothness, rhythm, holds, recovery speed
    case 'standard': return 'basic'  // transition count + smoothness only
    default: return 'none'           // temporal bonus applied to score but not shown
  }
}

/** M64: Voice analysis detail level */
export function getVoiceAccess(plan: string): 'none' | 'score_only' | 'full' {
  switch (plan) {
    case 'advanced': return 'full'        // full metrics: pitch, rate, pauses, volume
    case 'standard': return 'score_only'  // voice score blended into overall, no details
    default: return 'none'                // no voice analysis at all
  }
}

/** M65: Holistic breakdown visibility */
export function getHolisticBreakdownAccess(plan: string): boolean {
  return plan === 'advanced'
}
