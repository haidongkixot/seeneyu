/**
 * Seed notification templates for the Learning Assistant Engine.
 * Run: npx tsx scripts/seed-notification-templates.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface TemplateSeed {
  slug: string
  triggerType: string
  channel: string
  title: string
  body: string
  variables: string[]
}

const templates: TemplateSeed[] = [
  // ── Morning Motivation (3 variants) ──────────────────────────────
  {
    slug: 'morning-motivation-1',
    triggerType: 'morning_motivation',
    channel: 'in_app',
    title: 'Good morning, {{firstName}}!',
    body: 'A quick 5-minute practice can sharpen your communication skills. Your {{streak}}-day streak is waiting!',
    variables: ['firstName', 'streak'],
  },
  {
    slug: 'morning-motivation-2',
    triggerType: 'morning_motivation',
    channel: 'in_app_alt1',
    title: 'Rise and shine, {{firstName}}!',
    body: 'Today is perfect for leveling up your body language. You are level {{level}} — let\'s push higher!',
    variables: ['firstName', 'level'],
  },
  {
    slug: 'morning-motivation-3',
    triggerType: 'morning_motivation',
    channel: 'in_app_alt2',
    title: 'Your daily body language boost',
    body: 'Hey {{firstName}}, even 3 minutes of practice builds lasting habits. Ready to start?',
    variables: ['firstName'],
  },

  // ── Streak Warning (3 variants) ──────────────────────────────────
  {
    slug: 'streak-warning-1',
    triggerType: 'streak_warning',
    channel: 'in_app',
    title: 'Keep your streak alive!',
    body: 'You have a {{streak}}-day streak going, {{firstName}}. Don\'t let it slip — one quick lesson keeps it going!',
    variables: ['firstName', 'streak'],
  },
  {
    slug: 'streak-warning-2',
    triggerType: 'streak_warning',
    channel: 'in_app_alt1',
    title: 'Your streak needs you!',
    body: '{{streak}} days of dedication — that\'s amazing, {{firstName}}! Just one activity today to keep the chain unbroken.',
    variables: ['firstName', 'streak'],
  },
  {
    slug: 'streak-warning-3',
    triggerType: 'streak_warning',
    channel: 'in_app_alt2',
    title: 'Don\'t break the chain!',
    body: 'Hey {{firstName}}, a 2-minute arcade challenge is all it takes to protect your {{streak}}-day streak.',
    variables: ['firstName', 'streak'],
  },

  // ── Streak Broken ────────────────────────────────────────────────
  {
    slug: 'streak-broken-1',
    triggerType: 'streak_broken',
    channel: 'in_app',
    title: 'Fresh start, {{firstName}}',
    body: 'Your streak ended, but every expert starts fresh. Jump back in and build an even longer one! Your longest was {{longestStreak}} days.',
    variables: ['firstName', 'longestStreak'],
  },

  // ── Comeback (3 variants) ────────────────────────────────────────
  {
    slug: 'comeback-1',
    triggerType: 'comeback',
    channel: 'in_app',
    title: 'We miss you, {{firstName}}!',
    body: 'It\'s been a while since your last practice. Your body language journey is still here — pick up where you left off!',
    variables: ['firstName'],
  },
  {
    slug: 'comeback-2',
    triggerType: 'comeback',
    channel: 'in_app_alt1',
    title: 'Welcome back?',
    body: '{{firstName}}, your communication skills don\'t improve on autopilot. Come back for a quick session — it only takes 5 minutes!',
    variables: ['firstName'],
  },
  {
    slug: 'comeback-3',
    triggerType: 'comeback',
    channel: 'in_app_alt2',
    title: 'Your skills are waiting',
    body: 'Hey {{firstName}}, research shows 3 days without practice causes skill decay. Let\'s reverse that with one quick lesson!',
    variables: ['firstName'],
  },

  // ── Level Up ─────────────────────────────────────────────────────
  {
    slug: 'level-up-1',
    triggerType: 'level_up',
    channel: 'in_app',
    title: 'Level {{level}} unlocked!',
    body: 'Incredible work, {{firstName}}! You\'ve reached level {{level}} with {{xp}} XP. Your communication skills are growing fast!',
    variables: ['firstName', 'level', 'xp'],
  },

  // ── Badge Earned ─────────────────────────────────────────────────
  {
    slug: 'badge-earned-1',
    triggerType: 'badge_earned',
    channel: 'in_app',
    title: 'New badge earned!',
    body: 'Congratulations {{firstName}}! You\'ve earned a new badge. Check your profile to see your collection!',
    variables: ['firstName'],
  },

  // ── Leaderboard Change ───────────────────────────────────────────
  {
    slug: 'leaderboard-change-1',
    triggerType: 'leaderboard_change',
    channel: 'in_app',
    title: 'Leaderboard update!',
    body: '{{firstName}}, you\'re climbing the ranks! Keep practicing to maintain your position this week.',
    variables: ['firstName'],
  },

  // ── Skill Gap Nudge (3 variants) ─────────────────────────────────
  {
    slug: 'skill-gap-nudge-1',
    triggerType: 'skill_gap_nudge',
    channel: 'in_app',
    title: 'Time to practice {{skill}}',
    body: 'Hey {{firstName}}, you haven\'t worked on {{skill}} recently. A quick session keeps all your skills sharp!',
    variables: ['firstName', 'skill'],
  },
  {
    slug: 'skill-gap-nudge-2',
    triggerType: 'skill_gap_nudge',
    channel: 'in_app_alt1',
    title: 'Don\'t forget {{skill}}!',
    body: '{{firstName}}, well-rounded communicators practice every skill. Try a {{skill}} lesson today!',
    variables: ['firstName', 'skill'],
  },
  {
    slug: 'skill-gap-nudge-3',
    triggerType: 'skill_gap_nudge',
    channel: 'in_app_alt2',
    title: 'Skill spotlight: {{skill}}',
    body: 'Your {{skill}} could use some attention, {{firstName}}. Just 5 minutes can make a real difference!',
    variables: ['firstName', 'skill'],
  },

  // ── Weekly Report ────────────────────────────────────────────────
  {
    slug: 'weekly-report-1',
    triggerType: 'weekly_report',
    channel: 'in_app',
    title: 'Your weekly progress report',
    body: 'This week: {{lessonsThisWeek}} lessons completed, {{xpThisWeek}} XP earned. Level {{level}}, {{streak}}-day streak. Keep it up, {{firstName}}!',
    variables: ['firstName', 'lessonsThisWeek', 'xpThisWeek', 'level', 'streak'],
  },

  // ── Social Nudge ─────────────────────────────────────────────────
  {
    slug: 'social-nudge-1',
    triggerType: 'social_nudge',
    channel: 'in_app',
    title: 'Join the conversation!',
    body: '{{firstName}}, other learners are sharing tips in the discussions. Join in and learn from the community!',
    variables: ['firstName'],
  },

  // ── Celebration ──────────────────────────────────────────────────
  {
    slug: 'celebration-1',
    triggerType: 'celebration',
    channel: 'in_app',
    title: 'Milestone reached!',
    body: 'What an achievement, {{firstName}}! Your dedication to improving your body language is paying off. Keep going!',
    variables: ['firstName'],
  },

  // ── New Content ──────────────────────────────────────────────────
  {
    slug: 'new-content-1',
    triggerType: 'new_content',
    channel: 'in_app',
    title: 'New content available!',
    body: 'Fresh lessons and challenges have been added, {{firstName}}. Check them out and expand your skills!',
    variables: ['firstName'],
  },
]

async function main() {
  console.log('Seeding notification templates...')

  for (const tpl of templates) {
    await prisma.notificationTemplate.upsert({
      where: { slug: tpl.slug },
      create: {
        slug: tpl.slug,
        triggerType: tpl.triggerType,
        channel: tpl.channel,
        title: tpl.title,
        body: tpl.body,
        variables: tpl.variables,
        locale: 'en',
        isActive: true,
      },
      update: {
        title: tpl.title,
        body: tpl.body,
        variables: tpl.variables,
      },
    })
    console.log(`  + ${tpl.slug}`)
  }

  console.log(`\nDone! ${templates.length} templates seeded.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
