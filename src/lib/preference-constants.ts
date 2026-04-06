/**
 * Shared constants for the Personalized Learning Curve.
 * Single source of truth — used by onboarding, settings, admin, and matcher engine.
 */

export interface PreferenceOption {
  value: string
  label: string
  description?: string
  icon?: string // Lucide icon name or emoji
}

// ── Movie Genres ──────────────────────────────────────────────────────────────

export const GENRES: PreferenceOption[] = [
  { value: 'drama', label: 'Drama', description: 'Emotional, character-driven scenes', icon: '🎭' },
  { value: 'comedy', label: 'Comedy', description: 'Light-hearted, humorous interactions', icon: '😄' },
  { value: 'action', label: 'Action', description: 'High-energy, assertive moments', icon: '💥' },
  { value: 'thriller', label: 'Thriller', description: 'Tense, high-stakes conversations', icon: '🔥' },
  { value: 'romance', label: 'Romance', description: 'Intimate, emotionally open scenes', icon: '💕' },
  { value: 'ted-talk', label: 'TED Talks', description: 'Public speaking and presentations', icon: '🎤' },
  { value: 'ai-generated', label: 'AI Generated', description: 'Practice with AI-created scenarios', icon: '🤖' },
  { value: 'documentary', label: 'Documentary', description: 'Real-world communication examples', icon: '📹' },
  { value: 'animation', label: 'Animation', description: 'Expressive, exaggerated body language', icon: '✨' },
]

// ── Practicing Purpose ────────────────────────────────────────────────────────

export const PURPOSES: PreferenceOption[] = [
  { value: 'for-work', label: 'Work & Interviews', description: 'Professional communication skills', icon: '💼' },
  { value: 'for-hobby', label: 'Personal Growth', description: 'Self-improvement and confidence', icon: '🌱' },
  { value: 'for-performing', label: 'Performing Career', description: 'Acting, presenting, stage presence', icon: '🎬' },
  { value: 'for-education', label: 'Education', description: 'Teaching, tutoring, academic presentations', icon: '📚' },
  { value: 'for-social', label: 'Social & Dating', description: 'Social interactions and relationships', icon: '💬' },
  { value: 'for-leadership', label: 'Leadership', description: 'Team management and executive presence', icon: '👑' },
]

// ── Character Traits ──────────────────────────────────────────────────────────

export const TRAITS: PreferenceOption[] = [
  { value: 'confident', label: 'Confident', description: 'Self-assured, commanding presence' },
  { value: 'empathetic', label: 'Empathetic', description: 'Warm, understanding, emotionally attuned' },
  { value: 'aggressive', label: 'Assertive', description: 'Direct, forceful, confrontational' },
  { value: 'vulnerable', label: 'Vulnerable', description: 'Open, authentic, emotionally exposed' },
  { value: 'humorous', label: 'Humorous', description: 'Witty, playful, disarming' },
  { value: 'authoritative', label: 'Authoritative', description: 'Expert, credible, commanding respect' },
  { value: 'calm', label: 'Calm', description: 'Composed, steady, unflappable' },
  { value: 'passionate', label: 'Passionate', description: 'Intense, driven, emotionally charged' },
]

// ── Learner Gender ────────────────────────────────────────────────────────────

export const GENDERS: PreferenceOption[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
]

// ── Tag Categories (for ClipTag model) ────────────────────────────────────────

export const TAG_CATEGORIES = ['genre', 'purpose', 'trait'] as const
export type TagCategory = (typeof TAG_CATEGORIES)[number]

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getGenreLabel(value: string): string {
  return GENRES.find(g => g.value === value)?.label ?? value
}

export function getPurposeLabel(value: string): string {
  return PURPOSES.find(p => p.value === value)?.label ?? value
}

export function getTraitLabel(value: string): string {
  return TRAITS.find(t => t.value === value)?.label ?? value
}

export function getGenderLabel(value: string): string {
  return GENDERS.find(g => g.value === value)?.label ?? value
}
