import { AggregationBuffer, type SessionAggregate } from '../lib/aggregation-buffer'
import { authedFetch, getAccessToken } from '../lib/auth-client'
import type { MirrorMessage } from '../lib/messaging'

const CLIENT_VERSION = chrome.runtime.getManifest().version
const buffer = new AggregationBuffer()
const OFFSCREEN_URL = chrome.runtime.getURL('src/offscreen/offscreen.html')

async function ensureOffscreen() {
  const existing = await chrome.offscreen.hasDocument?.()
  if (existing) return
  await chrome.offscreen.createDocument({
    url: OFFSCREEN_URL,
    reasons: [chrome.offscreen.Reason.USER_MEDIA],
    justification:
      'Run MediaPipe + WebAudio locally on the user webcam/microphone for private body-language coaching. No media leaves the device.',
  })
}

async function closeOffscreen() {
  try {
    await chrome.offscreen.closeDocument()
  } catch {
    /* already closed */
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch(() => {})
  chrome.alarms.create('mirror-refresh-check', { periodInMinutes: 5 })
})

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'mirror-refresh-check') {
    await getAccessToken().catch(() => null)
  }
})

chrome.runtime.onMessage.addListener((msg: MirrorMessage, _sender, sendResponse) => {
  ;(async () => {
    try {
      if (msg.type === 'mirror/start') {
        buffer.start()
        await ensureOffscreen()
        sendResponse({ ok: true })
      } else if (msg.type === 'mirror/stop') {
        const aggregate = buffer.finalize(CLIENT_VERSION)
        await closeOffscreen()
        let summary: any = null
        if (aggregate) summary = await submitForCoaching(aggregate)
        sendResponse({ ok: true, aggregate, summary })
      } else if (msg.type === 'mirror/sample') {
        buffer.push(msg.sample)
        sendResponse({ ok: true })
      } else if (msg.type === 'mirror/nudge') {
        buffer.pushNudge(msg.nudge)
        sendResponse({ ok: true })
      } else if (msg.type === 'mirror/flush') {
        const aggregate = buffer.finalize(CLIENT_VERSION)
        let summary: any = null
        if (aggregate) summary = await submitForCoaching(aggregate)
        sendResponse({ ok: true, aggregate, summary })
      } else {
        sendResponse({ ok: false, error: 'Unknown message' })
      }
    } catch (err) {
      sendResponse({ ok: false, error: String((err as Error)?.message || err) })
    }
  })()
  return true
})

// Submit the session to /api/extension/sessions which always stores the
// session and (if the user opted in) also runs the Coach Ney summary.
// Returns the session id + Coach Ney write-up for the side panel to render.
async function submitForCoaching(aggregate: SessionAggregate): Promise<any> {
  try {
    const res = await authedFetch('/api/extension/sessions', {
      method: 'POST',
      body: JSON.stringify(aggregate),
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}
