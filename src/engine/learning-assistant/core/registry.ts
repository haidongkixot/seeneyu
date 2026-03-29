import type { INotificationChannel } from './types'

/**
 * Singleton registry for notification channels, analyzers, and planners.
 * Allows plug-and-play extension of the engine.
 */
class EngineRegistry {
  private channels = new Map<string, INotificationChannel>()

  // ── Channels ────────────────────────────────────────────────────

  registerChannel(channel: INotificationChannel): void {
    this.channels.set(channel.name, channel)
  }

  getChannel(name: string): INotificationChannel | undefined {
    return this.channels.get(name)
  }

  getAvailableChannels(): INotificationChannel[] {
    return Array.from(this.channels.values())
  }

  getChannelNames(): string[] {
    return Array.from(this.channels.keys())
  }
}

// Singleton
let instance: EngineRegistry | null = null

export function getRegistry(): EngineRegistry {
  if (!instance) {
    instance = new EngineRegistry()
  }
  return instance
}
