import Twilio from 'twilio'
import { prisma } from '@/lib/prisma'
import { BaseNotificationChannel } from './channel-interface'
import type { NotificationPayload, DeliveryResult } from '../core/types'

/**
 * WhatsApp notification channel via Twilio.
 * Sends coaching tips and reminders to learners on WhatsApp.
 */
export class WhatsAppChannel extends BaseNotificationChannel {
  readonly name = 'whatsapp'
  private client: ReturnType<typeof Twilio>
  private fromNumber: string

  constructor() {
    super()
    this.client = Twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    )
    this.fromNumber = process.env.TWILIO_WHATSAPP_FROM || ''
  }

  async send(userId: string, payload: NotificationPayload): Promise<DeliveryResult> {
    try {
      const profile = await prisma.learnerProfile.findUnique({
        where: { userId },
        select: { whatsappPhone: true, whatsappOptIn: true },
      })

      if (!profile?.whatsappPhone || !profile.whatsappOptIn) {
        return this.createFailure('User has no WhatsApp phone or has not opted in')
      }

      const message = await this.client.messages.create({
        from: `whatsapp:+${this.fromNumber}`,
        to: `whatsapp:+${profile.whatsappPhone}`,
        body: payload.body,
      })

      return this.createSuccess(message.sid)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown WhatsApp error'
      return this.createFailure(errorMsg)
    }
  }

  async isAvailable(userId: string): Promise<boolean> {
    const profile = await prisma.learnerProfile.findUnique({
      where: { userId },
      select: { whatsappPhone: true, whatsappOptIn: true },
    })
    return !!(profile?.whatsappOptIn && profile?.whatsappPhone)
  }
}
