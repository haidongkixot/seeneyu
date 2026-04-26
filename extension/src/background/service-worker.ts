import { AggregationBuffer, type SessionAggregate } from '../lib/aggregation-buffer'
import { authedFetch, getAccessToken } from '../lib/auth-client'
import type { MirrorMessage } from '../lib/messaging'

const CLIENT_VERSION = chrome.runtime.getManifest().version
const buffer = new AggregationBuffer()
const OFFSCREEN_URL = chrome.runtime.getURL('src/offscreen/offscreen.html')

// Last finalized aggregate from the most recent session — kept in memory so
// the user can retry submission if it failed (most common cause: forgot to
// enable post-call sync until after clicking Stop).
let lastAggregate: SessionAggregate | null = null

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

chrome.runtime.onMessage.addListener((msg: any, _sender, sendResponse) => {
  ;(async () => {
    try {
      if (msg.type === 'mirror/start') {
        buffer.start()
        lastAggregate = null
        await ensureOffscreen()
        sendResponse({ ok: true })
      } else if (msg.type === 'mirror/stop') {
        const aggregate = buffer.finalize(CLIENT_VERSION)
        await closeOffscreen()
        if (aggregate) {
          lastAggregate = aggregate
          const result = await submitForCoaching(aggregate)
          sendResponse({ ok: true, aggregate, ...result })
        } else {
          sendResponse({ ok: true, aggregate: null, summary: null })
        }
      } else if (msg.type === 'mirror/retry-submit') {
        if (!lastAggregate) {
          sendResponse({ ok: false, error: 'No previous session to retry' })
        } else {
          const result = await submitForCoaching(lastAggregate)
          sendResponse({ ok: true, aggregate: lastAggregate, ...result })
        }
      } else if (msg.type === 'mirror/has-pending') {
        sendResponse({ ok: true, hasPending: !!lastAggregate })
      } else if (msg.type === 'mirror/clear-pending') {
        lastAggregate = null
        sendResponse({ ok: true })
      } else if (msg.type === 'mirror/sample') {
        buffer.push(msg.sample)
        sendResponse({ ok: true })
      } else if (msg.type === 'mirror/nudge') {
        buffer.pushNudge(msg.nudge)
        sendResponse({ ok: true })
      } else if (msg.type === 'mirror/flush') {
        const aggregate = buffer.finalize(CLIENT_VERSION)
        if (aggregate) lastAggregate = aggregate
        const result = aggregate ? await submitForCoaching(aggregate) : { summary: null }
        sendResponse({ ok: true, aggregate, ...result })
      } else {
        sendResponse({ ok: false, error: 'Unknown message' })
      }
    } catch (err) {
      sendResponse({ ok: false, error: String((err as Error)?.message || err) })
    }
  })()
  return true
})

interface SubmitResult {
  summary: any | null
  submitError?: string
  submitStatus?: number
}

async function submitForCoaching(aggregate: SessionAggregate): Promise<SubmitResult> {
  try {
    const res = await authedFetch('/api/extension/sessions', {
      method: 'POST',
      body: JSON.stringify(aggregate),
    })
    if (res.ok) {
      lastAggregate = null // success — drop the cache
      return { summary: await res.json() }
    }
    let errMsg = `HTTP ${res.status}`
    try {
      const body = await res.json()
      if (body?.error) errMsg = body.error
    } catch { /* ignore parse failures */ }
    return { summary: null, submitError: errMsg, submitStatus: res.status }
  } catch (err) {
    return { summary: null, submitError: String((err as Error)?.message || err) }
  }
}
