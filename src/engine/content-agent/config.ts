import type { AgentConfig } from './types'

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  maxSuggestionsPerCycle: 15,
  defaultClassification: 'for_later',
  budgetLimitPerCycle: 10.0,  // $10 max per cycle
  defaultPublishTargets: ['library'],
  preferVideoForSkills: ['open-posture', 'active-listening', 'confident-disagreement'],
}

// Cost per generation (USD) — used for estimation before admin approval
export const COST_TABLE: Record<string, { image: number | null; video: number | null }> = {
  'pollinations': { image: 0, video: 0 },
  'huggingface': { image: 0, video: 0 },
  'kling': { image: 0.02, video: 0.10 },
  'gemini-imagen': { image: 0.065, video: null },
  'openai': { image: 0.04, video: null },
  'openai-sora': { image: null, video: 0.30 },
  'replicate': { image: 0.01, video: 0.05 },
  'runway': { image: null, video: 0.25 },
  'luma': { image: null, video: 0.20 },
  'stability': { image: 0.03, video: null },
  'together': { image: 0.01, video: null },
  'higgsfield': { image: null, video: 0.15 },
  'pollinations-video': { image: null, video: 0 },
  'huggingface-video': { image: null, video: 0 },
}

// Map skill categories to expression types for content generation
export const SKILL_TO_EXPRESSIONS: Record<string, string[]> = {
  'eye-contact': ['interest', 'confidence', 'trust', 'engagement'],
  'open-posture': ['confidence', 'openness', 'authority', 'relaxation'],
  'active-listening': ['empathy', 'attentiveness', 'concern', 'understanding'],
  'vocal-pacing': ['emphasis', 'authority', 'calmness', 'persuasion'],
  'confident-disagreement': ['assertiveness', 'composure', 'firmness', 'respect'],
}

// Map skill categories to body language types
export const SKILL_TO_BODY_LANGUAGE: Record<string, string> = {
  'eye-contact': 'eye-contact',
  'open-posture': 'open-posture',
  'active-listening': 'active-listening',
  'vocal-pacing': 'vocal-pacing',
  'confident-disagreement': 'confident-disagreement',
}
