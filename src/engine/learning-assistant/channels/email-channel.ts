import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'
import { BaseNotificationChannel } from './channel-interface'
import type { NotificationPayload, DeliveryResult } from '../core/types'

/**
 * Email notification channel via Resend.
 * Sends branded HTML emails from Coach Ney.
 */
export class EmailChannel extends BaseNotificationChannel {
  readonly name = 'email'
  private resend: Resend

  constructor() {
    super()
    this.resend = new Resend(process.env.RESEND_API_KEY)
  }

  async send(userId: string, payload: NotificationPayload): Promise<DeliveryResult> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      })

      if (!user?.email) {
        return this.createFailure('User has no email address')
      }

      // If payload.metadata.html is provided, use it directly (for rich templates).
      // Otherwise wrap the body text in a simple branded template.
      const htmlBody =
        typeof payload.metadata?.html === 'string'
          ? payload.metadata.html
          : this.wrapHtml(payload.title, payload.body, user.name || 'Learner')

      const { data, error } = await this.resend.emails.send({
        from: 'Coach Ney <coach@seeneyu.com>',
        to: user.email,
        subject: payload.title,
        html: htmlBody,
      })

      if (error) {
        return this.createFailure(error.message)
      }

      return this.createSuccess(data?.id)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown email error'
      return this.createFailure(errorMsg)
    }
  }

  async isAvailable(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    })

    if (!user?.email) return false

    // Check if user has opted out of email
    const profile = await prisma.learnerProfile.findUnique({
      where: { userId },
      select: { optOutChannels: true },
    })

    if (profile) {
      const optOut = profile.optOutChannels as string[]
      if (Array.isArray(optOut) && optOut.includes('email')) {
        return false
      }
    }

    return true
  }

  /**
   * Simple branded HTML wrapper for plain-text notifications.
   */
  private wrapHtml(title: string, body: string, userName: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f4f4f5;">
    <tr><td align="center" style="padding:24px 16px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background-color:#0d0d14;padding:24px 32px;text-align:center;">
          <span style="font-size:28px;font-weight:700;color:#fbbf24;">Seeneyu</span><br/>
          <span style="font-size:14px;color:#a1a1aa;">Coach Ney</span>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 8px;font-size:14px;color:#71717a;">Hi ${userName},</p>
          <h1 style="margin:0 0 16px;font-size:20px;color:#0d0d14;">${title}</h1>
          <p style="margin:0;font-size:14px;color:#27272a;line-height:1.6;">${body}</p>
        </td></tr>
        <tr><td style="background-color:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;font-size:12px;color:#71717a;">
          Seeneyu &mdash; Master body language through practice
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
  }
}
