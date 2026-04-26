import type { MirrorMetricSample } from '@seeneyu/scoring'
import type { CoachingNudge } from './coaching-rules'

export type MirrorMessage =
  | { type: 'mirror/start' }
  | { type: 'mirror/stop' }
  | { type: 'mirror/sample'; sample: MirrorMetricSample }
  | { type: 'mirror/nudge'; nudge: CoachingNudge }
  | { type: 'mirror/status'; running: boolean; error?: string }
  | { type: 'mirror/flush' }

export function send(msg: MirrorMessage): Promise<unknown> {
  return chrome.runtime.sendMessage(msg)
}
