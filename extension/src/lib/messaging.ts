import type { MirrorMetricSample } from '@seeneyu/scoring'

export type MirrorMessage =
  | { type: 'mirror/start' }
  | { type: 'mirror/stop' }
  | { type: 'mirror/sample'; sample: MirrorMetricSample }
  | { type: 'mirror/status'; running: boolean; error?: string }
  | { type: 'mirror/flush' }
  | { type: 'mirror/force-gpu-retry' }

export function send(msg: MirrorMessage): Promise<unknown> {
  return chrome.runtime.sendMessage(msg)
}
