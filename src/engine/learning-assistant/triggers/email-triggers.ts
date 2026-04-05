/**
 * Email Trigger Engine — maps application events to email template sends.
 *
 * Usage: import { fireEmailTrigger } from '@/engine/learning-assistant/triggers/email-triggers'
 *        await fireEmailTrigger('welcome', userId, { name: 'Alex' })
 *
 * Templates are loaded from NotificationTemplate DB table.
 * Emails sent via Resend (existing email-channel.ts).
 */

import { prisma } from '@/lib/prisma'

/**
 * Fire an email trigger — looks up the template, renders variables, and sends.
 * Non-blocking: logs errors but doesn't throw.
 */
export async function fireEmailTrigger(
  triggerType: string,
  userId: string,
  variables: Record<string, string | number>,
): Promise<boolean> {
  try {
    // 1. Find the template
    const template = await prisma.notificationTemplate.findFirst({
      where: { triggerType, channel: 'email', isActive: true },
    })
    if (!template) {
      console.log(`[email-trigger] no active template for trigger: ${triggerType}`)
      return false
    }

    // 2. Get user email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    })
    if (!user?.email) {
      console.log(`[email-trigger] no email for user: ${userId}`)
      return false
    }

    // 3. Check user hasn't opted out of email
    const profile = await prisma.learnerProfile.findUnique({
      where: { userId },
      select: { optOutChannels: true },
    })
    const optOut = (profile?.optOutChannels as string[]) ?? []
    if (optOut.includes('email')) {
      console.log(`[email-trigger] user ${userId} opted out of email`)
      return false
    }

    // 4. Render variables in subject and body
    const vars: Record<string, string> = { name: user.name || 'there' }
    for (const [k, v] of Object.entries(variables)) {
      vars[k] = String(v)
    }

    let subject = template.subject || template.title
    let body = template.body

    for (const [key, val] of Object.entries(vars)) {
      const re = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      subject = subject.replace(re, val)
      body = body.replace(re, val)
    }

    // 5. Send via Resend
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.warn(`[email-trigger] RESEND_API_KEY not set — skipping ${triggerType}`)
      return false
    }

    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)

    await resend.emails.send({
      from: 'Coach Ney <coach@seeneyu.com>',
      to: user.email,
      subject,
      html: body,
    })

    // 6. Log the notification
    await (prisma as any).notificationLog.create({
      data: {
        userId,
        triggerType,
        channel: 'email',
        title: template.title,
        body: subject,
        deliveredAt: new Date(),
      },
    }).catch(() => {}) // Non-blocking log

    console.log(`[email-trigger] sent ${triggerType} to ${user.email}`)
    return true
  } catch (err: any) {
    console.error(`[email-trigger] failed ${triggerType} for user ${userId}:`, err.message)
    return false
  }
}

/**
 * Fire trigger for multiple users (batch).
 */
export async function fireEmailTriggerBatch(
  triggerType: string,
  userIds: string[],
  getVariables: (userId: string) => Record<string, string | number>,
): Promise<number> {
  let sent = 0
  for (const userId of userIds) {
    const ok = await fireEmailTrigger(triggerType, userId, getVariables(userId))
    if (ok) sent++
    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 100))
  }
  return sent
}
