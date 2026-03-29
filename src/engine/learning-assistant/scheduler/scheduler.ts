import { prisma } from '@/lib/prisma'
import { getRegistry } from '../core/registry'
import { DEFAULT_ENGINE_CONFIG } from '../core/config'
import type { TriggerType, NotificationPayload } from '../core/types'

/**
 * Schedule a notification for future delivery.
 */
export async function scheduleNotification(
  userId: string,
  triggerType: string,
  channel: string,
  scheduledFor: Date,
  payload: Record<string, unknown>
): Promise<string> {
  const notification = await prisma.scheduledNotification.create({
    data: {
      userId,
      triggerType,
      channel,
      scheduledFor,
      payload: payload as object,
      priority: (payload.priority as string) || 'normal',
    },
  })
  return notification.id
}

/**
 * Process the notification queue.
 * Selects pending notifications whose scheduledFor has passed,
 * sends them via the appropriate channel, and logs the result.
 */
export async function processQueue(batchSize?: number): Promise<{
  processed: number
  succeeded: number
  failed: number
}> {
  const limit = batchSize ?? DEFAULT_ENGINE_CONFIG.batchSize
  const now = new Date()

  // Fetch pending notifications ready to send
  const notifications = await prisma.scheduledNotification.findMany({
    where: {
      status: 'pending',
      scheduledFor: { lte: now },
      attempts: { lt: DEFAULT_ENGINE_CONFIG.maxRetries },
    },
    orderBy: [
      { priority: 'asc' }, // 'high' < 'normal' < 'low' alphabetically — works for our needs
      { scheduledFor: 'asc' },
    ],
    take: limit,
  })

  let succeeded = 0
  let failed = 0

  for (const notif of notifications) {
    const registry = getRegistry()
    const channel = registry.getChannel(notif.channel)

    if (!channel) {
      // Mark as failed — channel not registered
      await prisma.scheduledNotification.update({
        where: { id: notif.id },
        data: {
          status: 'failed',
          errorMessage: `Channel '${notif.channel}' not registered`,
          attempts: notif.attempts + 1,
          lastAttemptAt: now,
        },
      })
      failed++
      continue
    }

    // Build payload from stored data
    const payloadData = notif.payload as Record<string, unknown>
    const payload: NotificationPayload = {
      triggerType: notif.triggerType as TriggerType,
      title: (payloadData.title as string) || notif.triggerType,
      body: (payloadData.body as string) || '',
      deepLink: payloadData.deepLink as string | undefined,
      priority: (notif.priority as 'low' | 'normal' | 'high') || 'normal',
      metadata: payloadData.metadata as Record<string, unknown> | undefined,
    }

    // If title/body not in payload, generate them
    if (!payloadData.title || !payloadData.body) {
      try {
        const { selectMotivation } = await import('../planners/motivation-planner')
        const motivation = await selectMotivation(
          notif.userId,
          notif.triggerType as TriggerType,
          payloadData.context as Record<string, unknown> | undefined
        )
        payload.title = motivation.title
        payload.body = motivation.body
      } catch {
        // Use defaults from payload builder
      }
    }

    try {
      const result = await channel.send(notif.userId, payload)

      if (result.success) {
        await prisma.scheduledNotification.update({
          where: { id: notif.id },
          data: {
            status: 'sent',
            attempts: notif.attempts + 1,
            lastAttemptAt: now,
          },
        })

        // Log the delivery
        await prisma.notificationLog.create({
          data: {
            userId: notif.userId,
            notificationId: notif.id,
            triggerType: notif.triggerType,
            channel: notif.channel,
            title: payload.title,
            body: payload.body,
            deepLink: payload.deepLink,
            deliveryStatus: 'delivered',
            deliveredAt: now,
          },
        })

        succeeded++
      } else {
        await prisma.scheduledNotification.update({
          where: { id: notif.id },
          data: {
            status: notif.attempts + 1 >= DEFAULT_ENGINE_CONFIG.maxRetries ? 'failed' : 'pending',
            errorMessage: result.error,
            attempts: notif.attempts + 1,
            lastAttemptAt: now,
          },
        })
        failed++
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      await prisma.scheduledNotification.update({
        where: { id: notif.id },
        data: {
          status: notif.attempts + 1 >= DEFAULT_ENGINE_CONFIG.maxRetries ? 'failed' : 'pending',
          errorMessage: errorMsg,
          attempts: notif.attempts + 1,
          lastAttemptAt: now,
        },
      })
      failed++
    }
  }

  return { processed: notifications.length, succeeded, failed }
}
