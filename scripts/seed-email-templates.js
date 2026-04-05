/**
 * Seed 17 lifecycle email templates into NotificationTemplate.
 * Run: node scripts/seed-email-templates.js
 */

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BRAND = {
  accent: '#fbbf24',
  bg: '#0d0d14',
  surface: '#1a1a2e',
  text: '#f4f4f8',
  muted: '#9898b0',
  green: '#22c55e',
  url: 'https://seeneyu.vercel.app',
};

function wrap(content) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:24px">
<tr><td style="padding:16px 0;text-align:center">
<span style="color:${BRAND.accent};font-size:20px;font-weight:700;letter-spacing:1px">seeneyu</span>
<span style="color:${BRAND.muted};font-size:12px;display:block;margin-top:2px">by PeeTeeAI</span>
</td></tr>
<tr><td style="background:${BRAND.surface};border-radius:16px;padding:32px">
${content}
</td></tr>
<tr><td style="padding:24px 0;text-align:center">
<p style="color:${BRAND.muted};font-size:11px;margin:0">
You're receiving this because you signed up for seeneyu.<br/>
<a href="${BRAND.url}/settings/notifications" style="color:${BRAND.muted};text-decoration:underline">Manage preferences</a> ·
<a href="${BRAND.url}/settings/privacy" style="color:${BRAND.muted};text-decoration:underline">Privacy</a>
</p>
</td></tr>
</table></body></html>`;
}

function btn(text, url) {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0"><tr><td style="background:${BRAND.accent};border-radius:12px;padding:14px 32px"><a href="${url}" style="color:${BRAND.bg};text-decoration:none;font-weight:700;font-size:14px">${text}</a></td></tr></table>`;
}

const templates = [
  {
    slug: 'welcome',
    triggerType: 'welcome',
    subject: 'Welcome to seeneyu — your body language journey starts now',
    title: 'Welcome to seeneyu!',
    variables: ['name'],
    body: wrap(`
<h1 style="color:${BRAND.text};font-size:24px;margin:0 0 8px">Welcome, {{name}}!</h1>
<p style="color:${BRAND.muted};font-size:14px;line-height:1.6">You've just taken the first step toward mastering body language and communication. seeneyu uses Hollywood's greatest performances as your training ground.</p>
<p style="color:${BRAND.text};font-size:14px;font-weight:600;margin-top:16px">Here's how to get started:</p>
<ol style="color:${BRAND.muted};font-size:14px;line-height:2;padding-left:20px">
<li>Take the <strong style="color:${BRAND.text}">onboarding assessment</strong> (2 min)</li>
<li>Watch your <strong style="color:${BRAND.text}">first clip</strong> and observe the technique</li>
<li><strong style="color:${BRAND.text}">Record yourself</strong> mimicking it — get instant AI feedback</li>
</ol>
${btn('Start Your First Practice', BRAND.url + '/dashboard')}
<p style="color:${BRAND.muted};font-size:12px">65+ curated scenes · 6 skills · Unlimited practice</p>`),
  },
  {
    slug: 'onboarding-day1',
    triggerType: 'onboarding_day1',
    subject: 'Your first skill is waiting — start with {{suggestedSkill}}',
    title: 'Ready for your first practice?',
    variables: ['name', 'suggestedSkill', 'firstClipUrl'],
    body: wrap(`
<h1 style="color:${BRAND.text};font-size:22px;margin:0 0 8px">Hey {{name}}, ready to practice?</h1>
<p style="color:${BRAND.muted};font-size:14px;line-height:1.6">Based on your assessment, we recommend starting with <strong style="color:${BRAND.accent}">{{suggestedSkill}}</strong>. It takes just 5 minutes.</p>
<p style="color:${BRAND.muted};font-size:14px">Watch the scene, follow the guide, record yourself, and get instant feedback.</p>
${btn('Start Practicing', '{{firstClipUrl}}')}
<p style="color:${BRAND.muted};font-size:12px">Most learners see improvement within 2-4 weeks of daily practice.</p>`),
  },
  {
    slug: 'onboarding-day3',
    triggerType: 'onboarding_day3',
    subject: "{{name}}, don't miss your momentum",
    title: "You haven't practiced yet",
    variables: ['name', 'clipCount'],
    body: wrap(`
<h1 style="color:${BRAND.text};font-size:22px;margin:0 0 8px">{{name}}, your skills are waiting</h1>
<p style="color:${BRAND.muted};font-size:14px;line-height:1.6">You signed up 3 days ago but haven't recorded your first practice yet. That's okay — everyone starts somewhere.</p>
<p style="color:${BRAND.muted};font-size:14px">We have <strong style="color:${BRAND.text}">{{clipCount}}+ practice clips</strong> ready for you. Just 5 minutes a day makes a difference.</p>
${btn('Try Your First Practice', BRAND.url + '/library')}`)
  },
  {
    slug: 'trial-started',
    triggerType: 'trial_started',
    subject: 'Your 7-day free trial is active!',
    title: 'Trial activated',
    variables: ['name', 'plan', 'trialEndsAt'],
    body: wrap(`
<h1 style="color:${BRAND.text};font-size:22px;margin:0 0 8px">Your {{plan}} trial is live!</h1>
<p style="color:${BRAND.muted};font-size:14px;line-height:1.6">Hi {{name}}, you now have full access to {{plan}} features for 7 days. Your trial ends on <strong style="color:${BRAND.text}">{{trialEndsAt}}</strong>.</p>
<p style="color:${BRAND.text};font-size:14px;font-weight:600">What you can do now:</p>
<ul style="color:${BRAND.muted};font-size:14px;line-height:2;padding-left:20px">
<li>Access intermediate + advanced clips</li>
<li>Get full AI coaching feedback</li>
<li>Use Coach Ney voice assistant</li>
<li>Play all 5 mini-games</li>
</ul>
${btn('Explore Your Features', BRAND.url + '/dashboard')}`)
  },
  {
    slug: 'trial-expiring',
    triggerType: 'trial_expiring',
    subject: 'Your trial ends in {{daysLeft}} days — keep your progress',
    title: 'Trial ending soon',
    variables: ['name', 'plan', 'daysLeft', 'upgradeUrl'],
    body: wrap(`
<h1 style="color:${BRAND.text};font-size:22px;margin:0 0 8px">{{name}}, your trial ends in {{daysLeft}} days</h1>
<p style="color:${BRAND.muted};font-size:14px;line-height:1.6">Don't lose access to your coaching feedback, advanced clips, and Coach Ney. Upgrade now to keep your momentum.</p>
${btn('Upgrade to ' + '{{plan}}', '{{upgradeUrl}}')}
<p style="color:${BRAND.muted};font-size:12px">30-day money-back guarantee. Cancel anytime.</p>`)
  },
  {
    slug: 'trial-expired',
    triggerType: 'trial_expired',
    subject: 'Your trial has ended — but your progress is saved',
    title: 'Trial ended',
    variables: ['name', 'upgradeUrl'],
    body: wrap(`
<h1 style="color:${BRAND.text};font-size:22px;margin:0 0 8px">Your trial has ended</h1>
<p style="color:${BRAND.muted};font-size:14px;line-height:1.6">Hi {{name}}, your free trial has expired. You're now on the Basic plan — you can still practice with beginner clips.</p>
<p style="color:${BRAND.muted};font-size:14px">Upgrade to unlock full coaching feedback, advanced clips, and Coach Ney.</p>
${btn('Upgrade Now', '{{upgradeUrl}}')}`)
  },
  {
    slug: 'payment-receipt',
    triggerType: 'payment_receipt',
    subject: 'Payment confirmed — seeneyu {{plan}} Plan',
    title: 'Payment receipt',
    variables: ['name', 'plan', 'amount', 'currency', 'nextBillingDate', 'invoiceUrl'],
    body: wrap(`
<h1 style="color:${BRAND.text};font-size:22px;margin:0 0 8px">Payment confirmed</h1>
<p style="color:${BRAND.muted};font-size:14px">Hi {{name}}, your payment has been processed successfully.</p>
<table style="width:100%;margin:16px 0;border-collapse:collapse">
<tr><td style="color:${BRAND.muted};font-size:13px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06)">Plan</td><td style="color:${BRAND.text};font-size:13px;padding:8px 0;text-align:right;border-bottom:1px solid rgba(255,255,255,0.06)">{{plan}}</td></tr>
<tr><td style="color:${BRAND.muted};font-size:13px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06)">Amount</td><td style="color:${BRAND.text};font-size:13px;padding:8px 0;text-align:right;border-bottom:1px solid rgba(255,255,255,0.06)">{{currency}} {{amount}}</td></tr>
<tr><td style="color:${BRAND.muted};font-size:13px;padding:8px 0">Next billing</td><td style="color:${BRAND.text};font-size:13px;padding:8px 0;text-align:right">{{nextBillingDate}}</td></tr>
</table>
${btn('Go to Dashboard', BRAND.url + '/dashboard')}`)
  },
  {
    slug: 'feedback-ready',
    triggerType: 'feedback_ready',
    subject: 'Your feedback is ready — Score: {{score}}/100',
    title: 'Feedback ready',
    variables: ['name', 'clipTitle', 'score', 'feedbackUrl'],
    body: wrap(`
<h1 style="color:${BRAND.text};font-size:22px;margin:0 0 8px">Your feedback is ready!</h1>
<p style="color:${BRAND.muted};font-size:14px">Hi {{name}}, Coach Ney has analyzed your practice of <strong style="color:${BRAND.text}">{{clipTitle}}</strong>.</p>
<div style="text-align:center;padding:20px 0">
<span style="font-size:48px;font-weight:800;color:${BRAND.accent}">{{score}}</span>
<span style="color:${BRAND.muted};font-size:14px;display:block">/100</span>
</div>
${btn('View Full Feedback', '{{feedbackUrl}}')}`)
  },
  {
    slug: 'streak-milestone',
    triggerType: 'streak_milestone',
    subject: '{{streakDays}}-day streak! You\'re on fire',
    title: 'Streak milestone',
    variables: ['name', 'streakDays', 'xpTotal', 'badgeName'],
    body: wrap(`
<div style="text-align:center;padding:12px 0">
<span style="font-size:48px">🔥</span>
<h1 style="color:${BRAND.text};font-size:24px;margin:8px 0">{{streakDays}}-Day Streak!</h1>
</div>
<p style="color:${BRAND.muted};font-size:14px;text-align:center">Incredible dedication, {{name}}! You've practiced for {{streakDays}} consecutive days and earned <strong style="color:${BRAND.accent}">{{xpTotal}} XP</strong> total.</p>
${btn('Keep the Streak Going', BRAND.url + '/dashboard')}`)
  },
  {
    slug: 'level-up',
    triggerType: 'level_up',
    subject: 'Level Up! You\'re now Level {{newLevel}}',
    title: 'Level up',
    variables: ['name', 'newLevel', 'xpTotal'],
    body: wrap(`
<div style="text-align:center;padding:12px 0">
<span style="font-size:48px">⭐</span>
<h1 style="color:${BRAND.text};font-size:24px;margin:8px 0">Level {{newLevel}}!</h1>
</div>
<p style="color:${BRAND.muted};font-size:14px;text-align:center">Congratulations {{name}}! You've reached Level {{newLevel}} with {{xpTotal}} total XP.</p>
${btn('Continue Practicing', BRAND.url + '/dashboard')}`)
  },
  {
    slug: 'weekly-report',
    triggerType: 'weekly_report',
    subject: 'Your weekly progress — {{xpEarned}} XP earned',
    title: 'Weekly report',
    variables: ['name', 'xpEarned', 'lessonsCompleted', 'streak', 'topSkill', 'weakSkill'],
    body: wrap(`
<h1 style="color:${BRAND.text};font-size:22px;margin:0 0 8px">Your Week in Review</h1>
<p style="color:${BRAND.muted};font-size:14px">Hi {{name}}, here's what you accomplished this week:</p>
<table style="width:100%;margin:16px 0;border-collapse:collapse">
<tr><td style="color:${BRAND.muted};font-size:13px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06)">XP Earned</td><td style="color:${BRAND.accent};font-size:13px;font-weight:700;padding:8px 0;text-align:right;border-bottom:1px solid rgba(255,255,255,0.06)">+{{xpEarned}}</td></tr>
<tr><td style="color:${BRAND.muted};font-size:13px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06)">Lessons Completed</td><td style="color:${BRAND.text};font-size:13px;padding:8px 0;text-align:right;border-bottom:1px solid rgba(255,255,255,0.06)">{{lessonsCompleted}}</td></tr>
<tr><td style="color:${BRAND.muted};font-size:13px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06)">Current Streak</td><td style="color:${BRAND.text};font-size:13px;padding:8px 0;text-align:right;border-bottom:1px solid rgba(255,255,255,0.06)">🔥 {{streak}} days</td></tr>
<tr><td style="color:${BRAND.muted};font-size:13px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06)">Strongest Skill</td><td style="color:${BRAND.green};font-size:13px;padding:8px 0;text-align:right;border-bottom:1px solid rgba(255,255,255,0.06)">{{topSkill}}</td></tr>
<tr><td style="color:${BRAND.muted};font-size:13px;padding:8px 0">Focus This Week</td><td style="color:${BRAND.accent};font-size:13px;padding:8px 0;text-align:right">{{weakSkill}}</td></tr>
</table>
${btn('Continue Practicing', BRAND.url + '/dashboard')}`)
  },
  {
    slug: 're-engagement-3d',
    triggerType: 're_engagement_3d',
    subject: "{{name}}, your streak is at risk!",
    title: '3-day inactive',
    variables: ['name', 'lastPractice', 'streakAtRisk'],
    body: wrap(`
<h1 style="color:${BRAND.text};font-size:22px;margin:0 0 8px">We miss you, {{name}}!</h1>
<p style="color:${BRAND.muted};font-size:14px;line-height:1.6">It's been 3 days since your last practice. Your {{streakAtRisk}}-day streak is at risk!</p>
<p style="color:${BRAND.muted};font-size:14px">Just 5 minutes today keeps your momentum going.</p>
${btn('Quick 5-Min Practice', BRAND.url + '/library')}`)
  },
  {
    slug: 're-engagement-7d',
    triggerType: 're_engagement_7d',
    subject: "It's been a week — your skills miss you",
    title: '7-day inactive',
    variables: ['name', 'newContent'],
    body: wrap(`
<h1 style="color:${BRAND.text};font-size:22px;margin:0 0 8px">A week without practice</h1>
<p style="color:${BRAND.muted};font-size:14px;line-height:1.6">Hi {{name}}, we've added new content since you were last here:</p>
<p style="color:${BRAND.text};font-size:14px">{{newContent}}</p>
<p style="color:${BRAND.muted};font-size:14px">Come back and pick up where you left off.</p>
${btn('Resume Practice', BRAND.url + '/dashboard')}`)
  },
  {
    slug: 're-engagement-30d',
    triggerType: 're_engagement_30d',
    subject: 'Special offer: 30% off to restart your journey',
    title: '30-day win-back',
    variables: ['name', 'couponCode'],
    body: wrap(`
<h1 style="color:${BRAND.text};font-size:22px;margin:0 0 8px">We'd love to have you back</h1>
<p style="color:${BRAND.muted};font-size:14px;line-height:1.6">Hi {{name}}, it's been a while. Communication skills are like muscles — they need regular exercise.</p>
<p style="color:${BRAND.muted};font-size:14px">Here's a special offer to restart:</p>
<div style="background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.3);border-radius:12px;padding:16px;text-align:center;margin:16px 0">
<p style="color:${BRAND.accent};font-size:18px;font-weight:700;margin:0">30% OFF</p>
<p style="color:${BRAND.muted};font-size:13px;margin:4px 0 0">Use code: <strong style="color:${BRAND.text}">{{couponCode}}</strong></p>
</div>
${btn('Restart Your Journey', BRAND.url + '/checkout?plan=standard&period=monthly')}`)
  },
  {
    slug: 'upgrade-nudge',
    triggerType: 'upgrade_nudge',
    subject: "You've hit your {{limitHit}} limit — unlock more",
    title: 'Upgrade nudge',
    variables: ['name', 'limitHit', 'plan', 'upgradeUrl'],
    body: wrap(`
<h1 style="color:${BRAND.text};font-size:22px;margin:0 0 8px">You're practicing hard!</h1>
<p style="color:${BRAND.muted};font-size:14px;line-height:1.6">Hi {{name}}, you've hit your daily {{limitHit}} limit. That's a great sign — it means you're committed to improvement.</p>
<p style="color:${BRAND.muted};font-size:14px">Upgrade to <strong style="color:${BRAND.accent}">{{plan}}</strong> for unlimited access:</p>
<ul style="color:${BRAND.muted};font-size:14px;line-height:2;padding-left:20px">
<li>More recording time</li>
<li>Full AI coaching feedback</li>
<li>Advanced difficulty clips</li>
<li>Coach Ney voice assistant</li>
</ul>
${btn('Upgrade Now', '{{upgradeUrl}}')}`)
  },
  {
    slug: 'cancellation-confirm',
    triggerType: 'cancellation_confirm',
    subject: 'Your subscription has been cancelled',
    title: 'Cancellation confirmed',
    variables: ['name', 'accessUntil', 'reactivateUrl'],
    body: wrap(`
<h1 style="color:${BRAND.text};font-size:22px;margin:0 0 8px">Subscription cancelled</h1>
<p style="color:${BRAND.muted};font-size:14px;line-height:1.6">Hi {{name}}, your subscription has been cancelled. You'll continue to have access until <strong style="color:${BRAND.text}">{{accessUntil}}</strong>.</p>
<p style="color:${BRAND.muted};font-size:14px">Your practice history and scores are saved. You can reactivate anytime.</p>
${btn('Reactivate', '{{reactivateUrl}}')}
<p style="color:${BRAND.muted};font-size:12px">We'd love to know how we can improve. Reply to this email with any feedback.</p>`)
  },
  {
    slug: 'referral-reward',
    triggerType: 'referral_reward',
    subject: '{{friendName}} joined seeneyu — you earned {{rewardXp}} XP!',
    title: 'Referral reward',
    variables: ['name', 'friendName', 'rewardXp'],
    body: wrap(`
<div style="text-align:center;padding:12px 0">
<span style="font-size:48px">🎁</span>
<h1 style="color:${BRAND.text};font-size:24px;margin:8px 0">Referral Reward!</h1>
</div>
<p style="color:${BRAND.muted};font-size:14px;text-align:center">{{friendName}} just signed up using your referral link. You've earned <strong style="color:${BRAND.accent}">{{rewardXp}} XP</strong>!</p>
${btn('View Your XP', BRAND.url + '/profile')}`)
  },
];

async function seed() {
  console.log('Seeding 17 email templates...');

  for (const t of templates) {
    await prisma.notificationTemplate.upsert({
      where: { slug: t.slug },
      update: {
        triggerType: t.triggerType,
        channel: 'email',
        subject: t.subject,
        title: t.title,
        body: t.body,
        variables: t.variables,
        isActive: true,
      },
      create: {
        slug: t.slug,
        triggerType: t.triggerType,
        channel: 'email',
        subject: t.subject,
        title: t.title,
        body: t.body,
        variables: t.variables,
        isActive: true,
      },
    });
    console.log(`  ✓ ${t.slug}`);
  }

  console.log(`\nDone! ${templates.length} templates seeded.`);
  await prisma.$disconnect();
}

seed().catch(err => { console.error(err); prisma.$disconnect(); });
