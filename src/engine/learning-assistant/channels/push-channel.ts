import webpush from 'web-push'
import { prisma } from '@/lib/prisma'
import { BaseNotificationChannel } from './channel-interface'
import type { NotificationPayload, DeliveryResult } from '../core/types'

/**
 * Web Push notification channel.
 * Sends push notifications to all subscribed devices for a user via the Web Push protocol.
 */
export class PushChannel extends BaseNotificationChannel {
  readonly name = 'push'

  constructor() {
    super()
    const publicKey = process.env.VAPID_PUBLIC_KEY
    const privateKey = process.env.VAPID_PRIVATE_KEY
    const subject = process.env.VAPID_SUBJECT || 'mailto:hello@seeneyu.com'

    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey)
    }
  }

  async send(userId: string, payload: NotificationPayload): Promise<DeliveryResult> {
    try {
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId },
      })

      if (subscriptions.length === 0) {
        return this.createFailure('No push subscriptions found for user')
      }

      const pushPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        deepLink: payload.deepLink || '/',
        triggerType: payload.triggerType,
        actions: this.getActionsForTrigger(payload.triggerType),
      })

      const results = await Promise.allSettled(
        subscriptions.map(async (sub) => {
          try {
            const result = await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: sub.keys as { p256dh: string; auth: string },
              },
              pushPayload
            )
            return { subId: sub.id, statusCode: result.statusCode }
          } catch (err: unknown) {
            const statusCode = (err as { statusCode?: number }).statusCode
            // 410 Gone or 404 — subscription expired, remove it
            if (statusCode === 410 || statusCode === 404) {
              await prisma.pushSubscription.delete({ where: { id: sub.id } })
            }
            throw err
          }
        })
      )

      const succeeded = results.filter((r) => r.status === 'fulfilled').length
      if (succeeded === 0) {
        const firstError = results.find((r) => r.status === 'rejected') as PromiseRejectedResult | undefined
        return this.createFailure(firstError?.reason?.message || 'All push deliveries failed')
      }

      return this.createSuccess(`push:${succeeded}/${subscriptions.length}`)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown push error'
      return this.createFailure(errorMsg)
    }
  }

  async isAvailable(userId: string): Promise<boolean> {
    const count = await prisma.pushSubscription.count({
      where: { userId },
    })
    return count > 0
  }

  private getActionsForTrigger(triggerType: string): Array<{ action: string; title: string }> {
    switch (triggerType) {
      case 'streak_warning':
        return [{ action: 'practice', title: 'Practice now' }]
      case 'morning_motivation':
        return [{ action: 'start', title: 'Start learning' }]
      case 'skill_gap_nudge':
        return [{ action: 'practice', title: 'Practice skill' }]
      default:
        return []
    }
  }
}
