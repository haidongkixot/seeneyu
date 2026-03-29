import type { INotificationChannel, NotificationPayload, DeliveryResult } from '../core/types'

/**
 * Abstract base for notification channels.
 * Extend this to implement new delivery methods (push, email, WhatsApp, etc.)
 */
export abstract class BaseNotificationChannel implements INotificationChannel {
  abstract readonly name: string

  abstract send(userId: string, payload: NotificationPayload): Promise<DeliveryResult>

  abstract isAvailable(userId: string): Promise<boolean>

  protected createSuccess(messageId?: string): DeliveryResult {
    return { success: true, channel: this.name, messageId }
  }

  protected createFailure(error: string): DeliveryResult {
    return { success: false, channel: this.name, error }
  }
}
