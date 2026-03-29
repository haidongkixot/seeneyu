import { prisma } from '@/lib/prisma'
import { BaseNotificationChannel } from './channel-interface'
import type { NotificationPayload, DeliveryResult } from '../core/types'

/**
 * In-app notification channel.
 * Creates an AssistantMessage in the user's conversation as a proactive Coach Ney message.
 */
export class InAppChannel extends BaseNotificationChannel {
  readonly name = 'in_app'

  async send(userId: string, payload: NotificationPayload): Promise<DeliveryResult> {
    try {
      // Find or create a "proactive" conversation for this user
      let conversation = await prisma.assistantConversation.findFirst({
        where: {
          userId,
          context: 'proactive',
        },
        orderBy: { updatedAt: 'desc' },
      })

      if (!conversation) {
        conversation = await prisma.assistantConversation.create({
          data: {
            userId,
            context: 'proactive',
          },
        })
      }

      // Create the message as an assistant (Coach Ney) message
      const message = await prisma.assistantMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'assistant',
          content: `**${payload.title}**\n\n${payload.body}${
            payload.deepLink ? `\n\n[Take action](${payload.deepLink})` : ''
          }`,
        },
      })

      // Update conversation timestamp
      await prisma.assistantConversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      })

      return this.createSuccess(message.id)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      return this.createFailure(errorMsg)
    }
  }

  async isAvailable(userId: string): Promise<boolean> {
    // In-app is always available for registered users
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })
    return !!user
  }
}
