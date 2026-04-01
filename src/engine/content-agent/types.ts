export interface ContentGap {
  skillCategory: string
  difficulty: string
  gapType: 'skill_gap' | 'difficulty_gap' | 'engagement_gap' | 'content_variety'
  existingCount: number
  demandScore: number  // higher = more users want this
  freshnessDays: number  // days since last content added
  priority: number  // 1 = highest, computed
  rationale: string
}

export interface SkillCoverage {
  total: number
  beginner: number
  intermediate: number
  advanced: number
}

export interface CoverageAnalysis {
  clipsBySkill: Record<string, SkillCoverage>
  arcadeBySkill: Record<string, number>
  lessonsBySkill: Record<string, number>
}

export interface DemandAnalysis {
  practiceBySkill: Record<string, number>
  attemptsBySkill: Record<string, number>
  progressBySkill: Record<string, number>
  activeUsers: number
  totalUsers: number
}

export interface GapAnalysis {
  gaps: ContentGap[]
  snapshot: {
    skillCoverage: Record<string, SkillCoverage>
    difficultyCoverage: Record<string, number>
    practiceFrequency: Record<string, number>
    contentFreshness: Record<string, number>
    activeUsers: number
    totalUsers: number
  }
}

export interface SuggestionInput {
  gap: ContentGap
  expressionType: string
  bodyLanguageType: string
  mediaType: 'image' | 'video'
  provider?: string
  model?: string
  estimatedCost?: number
}

export interface AgentConfig {
  maxSuggestionsPerCycle: number
  defaultClassification: 'for_public' | 'for_later'
  budgetLimitPerCycle: number
  defaultPublishTargets: string[]
  preferVideoForSkills: string[]  // skills where video is preferred over image
}

export const SKILL_CATEGORIES = [
  'eye-contact',
  'open-posture',
  'active-listening',
  'vocal-pacing',
  'confident-disagreement',
] as const

export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const
