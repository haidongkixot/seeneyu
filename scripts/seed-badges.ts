/**
 * Badge seed script for Seeneyu gamification.
 * Run with: npx tsx scripts/seed-badges.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface BadgeSeed {
  slug: string
  name: string
  description: string
  iconEmoji: string
  category: string
  criteria: Record<string, unknown>
}

const badges: BadgeSeed[] = [
  // ── Consistency ──────────────────────────────────────────────
  {
    slug: 'first_login',
    name: 'Welcome Aboard',
    description: 'Log in for the first time and start your body language journey.',
    iconEmoji: '\u{1F44B}',
    category: 'consistency',
    criteria: { type: 'first_login', threshold: 1 },
  },
  {
    slug: 'streak_3',
    name: 'Getting Started',
    description: 'Maintain a 3-day activity streak.',
    iconEmoji: '\u{1F525}',
    category: 'consistency',
    criteria: { type: 'streak', threshold: 3 },
  },
  {
    slug: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day activity streak.',
    iconEmoji: '\u{1F525}',
    category: 'consistency',
    criteria: { type: 'streak', threshold: 7 },
  },
  {
    slug: 'streak_14',
    name: 'Two-Week Titan',
    description: 'Maintain a 14-day activity streak.',
    iconEmoji: '\u{26A1}',
    category: 'consistency',
    criteria: { type: 'streak', threshold: 14 },
  },
  {
    slug: 'streak_30',
    name: 'Monthly Master',
    description: 'Maintain a 30-day activity streak.',
    iconEmoji: '\u{1F31F}',
    category: 'consistency',
    criteria: { type: 'streak', threshold: 30 },
  },
  {
    slug: 'streak_100',
    name: 'Century Streak',
    description: 'Maintain a 100-day activity streak. Legendary dedication!',
    iconEmoji: '\u{1F4AF}',
    category: 'consistency',
    criteria: { type: 'streak', threshold: 100 },
  },
  {
    slug: 'comeback_kid',
    name: 'Comeback Kid',
    description: 'Return to practice after 7 or more days away.',
    iconEmoji: '\u{1F3C3}',
    category: 'consistency',
    criteria: { type: 'comeback', threshold: 7 },
  },

  // ── Mastery ──────────────────────────────────────────────────
  {
    slug: 'first_perfect_quiz',
    name: 'Perfect Score',
    description: 'Get 100% on a foundation quiz.',
    iconEmoji: '\u{2705}',
    category: 'mastery',
    criteria: { type: 'perfect_quiz', threshold: 1 },
  },
  {
    slug: 'skill_eye_contact',
    name: 'Eye Contact Expert',
    description: 'Complete 10 eye contact practice sessions.',
    iconEmoji: '\u{1F440}',
    category: 'mastery',
    criteria: { type: 'practice_count', threshold: 10 },
  },
  {
    slug: 'skill_posture',
    name: 'Posture Pro',
    description: 'Complete 10 posture practice sessions.',
    iconEmoji: '\u{1F9CD}',
    category: 'mastery',
    criteria: { type: 'practice_count', threshold: 10 },
  },
  {
    slug: 'skill_gestures',
    name: 'Gesture Guru',
    description: 'Complete 10 gesture practice sessions.',
    iconEmoji: '\u{1F91A}',
    category: 'mastery',
    criteria: { type: 'practice_count', threshold: 10 },
  },
  {
    slug: 'all_beginner_lessons',
    name: 'Foundation Builder',
    description: 'Complete all beginner foundation lessons.',
    iconEmoji: '\u{1F3D7}',
    category: 'mastery',
    criteria: { type: 'lesson_count', threshold: 5 },
  },
  {
    slug: 'all_foundation_courses',
    name: 'Foundation Scholar',
    description: 'Complete all foundation courses.',
    iconEmoji: '\u{1F393}',
    category: 'mastery',
    criteria: { type: 'lesson_count', threshold: 20 },
  },

  // ── Social ───────────────────────────────────────────────────
  {
    slug: 'first_comment',
    name: 'First Words',
    description: 'Post your first comment in the community.',
    iconEmoji: '\u{1F4AC}',
    category: 'social',
    criteria: { type: 'comment_count', threshold: 1 },
  },
  {
    slug: 'ten_comments',
    name: 'Conversationalist',
    description: 'Post 10 comments in the community.',
    iconEmoji: '\u{1F5E3}',
    category: 'social',
    criteria: { type: 'comment_count', threshold: 10 },
  },
  {
    slug: 'helpful_reply',
    name: 'Helpful Mentor',
    description: 'Reply to 10 other learners\u2019 comments.',
    iconEmoji: '\u{1F91D}',
    category: 'social',
    criteria: { type: 'reply_count', threshold: 10 },
  },
  {
    slug: 'discussion_starter',
    name: 'Discussion Starter',
    description: 'Start 5 discussion threads.',
    iconEmoji: '\u{1F4E2}',
    category: 'social',
    criteria: { type: 'thread_count', threshold: 5 },
  },

  // ── Volume ───────────────────────────────────────────────────
  {
    slug: 'arcade_10',
    name: 'Arcade Rookie',
    description: 'Complete 10 arcade challenges.',
    iconEmoji: '\u{1F3AE}',
    category: 'volume',
    criteria: { type: 'arcade_count', threshold: 10 },
  },
  {
    slug: 'arcade_50',
    name: 'Arcade Veteran',
    description: 'Complete 50 arcade challenges.',
    iconEmoji: '\u{1F3AE}',
    category: 'volume',
    criteria: { type: 'arcade_count', threshold: 50 },
  },
  {
    slug: 'arcade_100',
    name: 'Arcade Legend',
    description: 'Complete 100 arcade challenges.',
    iconEmoji: '\u{1F3C6}',
    category: 'volume',
    criteria: { type: 'arcade_count', threshold: 100 },
  },
  {
    slug: 'lessons_10',
    name: 'Eager Learner',
    description: 'Complete 10 foundation lessons.',
    iconEmoji: '\u{1F4DA}',
    category: 'volume',
    criteria: { type: 'lesson_count', threshold: 10 },
  },
  {
    slug: 'lessons_25',
    name: 'Knowledge Seeker',
    description: 'Complete 25 foundation lessons.',
    iconEmoji: '\u{1F4D6}',
    category: 'volume',
    criteria: { type: 'lesson_count', threshold: 25 },
  },
  {
    slug: 'lessons_50',
    name: 'Lesson Master',
    description: 'Complete 50 foundation lessons.',
    iconEmoji: '\u{1F4DC}',
    category: 'volume',
    criteria: { type: 'lesson_count', threshold: 50 },
  },
  {
    slug: 'practice_sessions_25',
    name: 'Practice Makes Perfect',
    description: 'Complete 25 practice sessions.',
    iconEmoji: '\u{1F4AA}',
    category: 'volume',
    criteria: { type: 'practice_count', threshold: 25 },
  },
  {
    slug: 'total_xp_1000',
    name: 'XP Collector',
    description: 'Earn 1,000 total XP.',
    iconEmoji: '\u{2B50}',
    category: 'volume',
    criteria: { type: 'xp', threshold: 1000 },
  },
  {
    slug: 'total_xp_5000',
    name: 'XP Hoarder',
    description: 'Earn 5,000 total XP.',
    iconEmoji: '\u{1F48E}',
    category: 'volume',
    criteria: { type: 'xp', threshold: 5000 },
  },
  {
    slug: 'total_xp_10000',
    name: 'XP Titan',
    description: 'Earn 10,000 total XP.',
    iconEmoji: '\u{1F451}',
    category: 'volume',
    criteria: { type: 'xp', threshold: 10000 },
  },

  // ── Special ──────────────────────────────────────────────────
  {
    slug: 'expression_king',
    name: 'Expression King',
    description: 'Score 90+ on 10 different arcade facial expression challenges.',
    iconEmoji: '\u{1F60E}',
    category: 'special',
    criteria: { type: 'arcade_count', threshold: 10 },
  },
  {
    slug: 'level_10',
    name: 'Rising Star',
    description: 'Reach Level 10.',
    iconEmoji: '\u{1F31F}',
    category: 'special',
    criteria: { type: 'level', threshold: 10 },
  },
  {
    slug: 'level_25',
    name: 'Communication Pro',
    description: 'Reach Level 25.',
    iconEmoji: '\u{1F48E}',
    category: 'special',
    criteria: { type: 'level', threshold: 25 },
  },
  {
    slug: 'level_50',
    name: 'Body Language Master',
    description: 'Reach Level 50. You have truly mastered the art of nonverbal communication.',
    iconEmoji: '\u{1F451}',
    category: 'special',
    criteria: { type: 'level', threshold: 50 },
  },
]

async function main() {
  console.log('Seeding badges...')

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { slug: badge.slug },
      create: badge,
      update: {
        name: badge.name,
        description: badge.description,
        iconEmoji: badge.iconEmoji,
        category: badge.category,
        criteria: badge.criteria,
      },
    })
    console.log(`  [OK] ${badge.slug} — ${badge.name}`)
  }

  console.log(`\nDone! ${badges.length} badges seeded.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
