const FREE_CHALLENGES_PER_TYPE = 3

export function canAccessChallenge(
  challengeIndex: number,
  challengeType: string,
  allChallenges: { type: string }[],
  isAuthenticated: boolean
): boolean {
  if (isAuthenticated) return true
  const sameTypeBefore = allChallenges
    .slice(0, challengeIndex)
    .filter(c => c.type === challengeType).length
  return sameTypeBefore < FREE_CHALLENGES_PER_TYPE
}

export function canAccessPractice(isAuthenticated: boolean): boolean {
  return isAuthenticated
}

export function canAccessRecord(isAuthenticated: boolean): boolean {
  return isAuthenticated
}

export function getVideoLimitSec(plan: string): number {
  switch (plan) {
    case 'standard': return 30
    case 'advanced': return 180
    default: return 5
  }
}

export function getFeedbackDetail(plan: string): 'short' | 'full' | 'full_plus' {
  switch (plan) {
    case 'standard': return 'full'
    case 'advanced': return 'full_plus'
    default: return 'short'
  }
}
