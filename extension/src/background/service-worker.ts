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
        if (aggregate) await maybeSubmit(aggregate)
        sendResponse({ ok: true, aggregate })
      } else if (msg.type === 'mirror/sample') {
        buffer.push(msg.sample)
        sendResponse({ ok: true })
      } else if (msg.type === 'mirror/flush') {
        const aggregate = buffer.finalize(CLIENT_VERSION)
        if (aggregate) await maybeSubmit(aggregate)
        sendResponse({ ok: true, aggregate })
      } else {
        sendResponse({ ok: false, error: 'Unknown message' })
      }
    } catch (err) {
      sendResponse({ ok: false, error: String((err as Error)?.message || err) })
    }
  })()
  return true
})

async function maybeSubmit(aggregate: SessionAggregate) {
  try {
    const prefsRes = await authedFetch('/api/extension/preferences', { method: 'GET' })
    if (!prefsRes.ok) return
    const prefs = (await prefsRes.json()) as { metricsOptIn: boolean }
    if (!prefs.metricsOptIn) return

    await authedFetch('/api/extension/metrics', {
      method: 'POST',
      body: JSON.stringify(aggregate),
    })
  } catch {
    // Network errors silently dropped — metrics are best-effort, never critical.
  }
}
