/**
 * Email HTML templates for the Learning Assistant.
 * Uses inline CSS for email client compatibility. Table-based layout.
 * Amber accent (#fbbf24), white background, dark text.
 */

interface WeeklyReportData {
  userName: string
  xpEarned: number
  lessonsCompleted: number
  streakDays: number
  badgesEarned: number
  questsCompleted: number
  avgQuizScore: number
  arcadeCount: number
  skillBreakdown: { skill: string; score: number }[]
  topAchievement: string | null
  nextWeekFocus: string
  dashboardUrl: string
  unsubscribeUrl: string
}

interface CelebrationData {
  userName: string
  achievementType: 'level_up' | 'badge_earned'
  achievementTitle: string
  achievementDescription: string
  dashboardUrl: string
  unsubscribeUrl: string
}

interface ComebackData {
  userName: string
  daysAway: number
  newContentCount: number
  friendActivity: string | null
  dashboardUrl: string
  unsubscribeUrl: string
}

interface StreakCelebrationData {
  userName: string
  streakDays: number
  encouragement: string
  dashboardUrl: string
  unsubscribeUrl: string
}

// ── Shared layout wrapper ───────────────────────────────────────────

function emailWrapper(content: string, unsubscribeUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Seeneyu</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color:#0d0d14;padding:24px 32px;text-align:center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align:center;">
                    <span style="font-size:28px;font-weight:700;color:#fbbf24;letter-spacing:-0.5px;">Seeneyu</span>
                    <br />
                    <span style="font-size:14px;color:#a1a1aa;margin-top:4px;display:inline-block;">Coach Ney</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:24px 32px;border-top:1px solid #e5e7eb;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align:center;font-size:12px;color:#71717a;line-height:1.5;">
                    <p style="margin:0 0 8px 0;">Seeneyu &mdash; Master body language through practice</p>
                    <p style="margin:0;">
                      <a href="${unsubscribeUrl}" style="color:#71717a;text-decoration:underline;">Unsubscribe from emails</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function ctaButton(label: string, url: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td align="center" style="padding:24px 0 8px;">
        <a href="${url}" style="display:inline-block;background-color:#fbbf24;color:#0d0d14;font-weight:600;font-size:16px;padding:12px 32px;border-radius:8px;text-decoration:none;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`
}

function statCell(label: string, value: string | number): string {
  return `<td align="center" style="padding:12px;background-color:#fefce8;border-radius:8px;">
    <div style="font-size:24px;font-weight:700;color:#0d0d14;">${value}</div>
    <div style="font-size:12px;color:#71717a;margin-top:4px;">${label}</div>
  </td>`
}

// ── Templates ───────────────────────────────────────────────────────

export function weeklyReportHtml(data: WeeklyReportData): string {
  const skillRows = data.skillBreakdown
    .slice(0, 5)
    .map(
      (s) => `
      <tr>
        <td style="padding:6px 0;font-size:14px;color:#27272a;">${s.skill}</td>
        <td style="padding:6px 0;width:60%;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="background-color:#e5e7eb;border-radius:4px;height:8px;">
                <div style="width:${Math.min(s.score, 100)}%;background-color:#fbbf24;height:8px;border-radius:4px;"></div>
              </td>
            </tr>
          </table>
        </td>
        <td style="padding:6px 0 6px 8px;font-size:12px;color:#71717a;text-align:right;">${s.score}%</td>
      </tr>`
    )
    .join('')

  const topAchievementHtml = data.topAchievement
    ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:24px;">
        <tr>
          <td style="background-color:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;">
            <div style="font-size:12px;color:#92400e;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Top Achievement</div>
            <div style="font-size:16px;color:#0d0d14;margin-top:4px;font-weight:500;">${data.topAchievement}</div>
          </td>
        </tr>
      </table>`
    : ''

  const content = `
    <h1 style="margin:0 0 4px;font-size:22px;color:#0d0d14;">Your Week in Review</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#71717a;">Hi ${data.userName}, here's how you did this week.</p>

    <!-- Stats grid -->
    <table role="presentation" cellspacing="8" cellpadding="0" border="0" width="100%">
      <tr>
        ${statCell('XP Earned', `+${data.xpEarned}`)}
        ${statCell('Lessons', data.lessonsCompleted)}
        ${statCell('Streak', `${data.streakDays}d`)}
        ${statCell('Badges', data.badgesEarned)}
      </tr>
    </table>

    ${
      skillRows
        ? `<!-- Skills -->
    <h2 style="margin:24px 0 12px;font-size:16px;color:#0d0d14;">Skill Progress</h2>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      ${skillRows}
    </table>`
        : ''
    }

    ${topAchievementHtml}

    <!-- Next week focus -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:24px;">
      <tr>
        <td style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;">
          <div style="font-size:12px;color:#166534;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Next Week's Focus</div>
          <div style="font-size:14px;color:#0d0d14;margin-top:4px;">${data.nextWeekFocus}</div>
        </td>
      </tr>
    </table>

    ${ctaButton('Continue Learning &#8594;', data.dashboardUrl)}
  `

  return emailWrapper(content, data.unsubscribeUrl)
}

export function celebrationHtml(data: CelebrationData): string {
  const emoji = data.achievementType === 'level_up' ? '&#127942;' : '&#11088;'

  const content = `
    <div style="text-align:center;padding:8px 0 16px;">
      <span style="font-size:48px;">${emoji}</span>
    </div>
    <h1 style="margin:0 0 8px;font-size:24px;color:#0d0d14;text-align:center;">Congratulations, ${data.userName}!</h1>
    <p style="margin:0 0 8px;font-size:18px;color:#fbbf24;text-align:center;font-weight:600;">${data.achievementTitle}</p>
    <p style="margin:0 0 24px;font-size:14px;color:#52525b;text-align:center;line-height:1.6;">${data.achievementDescription}</p>
    ${ctaButton('Keep Going &#8594;', data.dashboardUrl)}
  `

  return emailWrapper(content, data.unsubscribeUrl)
}

export function comebackHtml(data: ComebackData): string {
  const missedSection = data.newContentCount > 0
    ? `<p style="margin:0 0 8px;font-size:14px;color:#52525b;">While you were away:</p>
       <ul style="margin:0 0 16px;padding-left:20px;color:#52525b;font-size:14px;line-height:1.8;">
         <li>${data.newContentCount} new lesson${data.newContentCount !== 1 ? 's' : ''} added</li>
         ${data.friendActivity ? `<li>${data.friendActivity}</li>` : ''}
       </ul>`
    : ''

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;color:#0d0d14;">We miss you, ${data.userName}!</h1>
    <p style="margin:0 0 16px;font-size:14px;color:#52525b;line-height:1.6;">
      It's been ${data.daysAway} days since your last practice. Your body language skills are waiting for you to come back!
    </p>
    ${missedSection}
    <p style="margin:0 0 8px;font-size:14px;color:#52525b;line-height:1.6;">
      Even 5 minutes of practice today can make a difference. Pick up where you left off.
    </p>
    ${ctaButton('Just 5 Minutes Today &#8594;', data.dashboardUrl)}
  `

  return emailWrapper(content, data.unsubscribeUrl)
}

export function streakCelebrationHtml(data: StreakCelebrationData): string {
  const content = `
    <div style="text-align:center;padding:8px 0 16px;">
      <span style="font-size:48px;">&#128293;</span>
    </div>
    <h1 style="margin:0 0 8px;font-size:24px;color:#0d0d14;text-align:center;">${data.streakDays}-Day Streak!</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#52525b;text-align:center;line-height:1.6;">${data.encouragement}</p>
    ${ctaButton('Keep the Streak Alive &#8594;', data.dashboardUrl)}
  `

  return emailWrapper(content, data.unsubscribeUrl)
}
