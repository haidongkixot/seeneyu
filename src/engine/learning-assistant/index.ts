/**
 * Learning Assistant Engine — Barrel Exports
 * M47: Adaptive learning engine with proactive coaching.
 */

// Core
import { LearningAssistantEngine as _Engine } from './core/engine'
export { LearningAssistantEngine } from './core/engine'
export { DEFAULT_ENGINE_CONFIG } from './core/config'
export { getRegistry } from './core/registry'
export type {
  ILearner,
  IContentItem,
  IContentProvider,
  INotificationChannel,
  NotificationPayload,
  DeliveryResult,
  TriggerType,
  EngineConfig,
  ProgressSnapshot,
  EngagementSnapshot,
  SkillGapSnapshot,
  PlannedActivity,
  LearnerContext,
} from './core/types'

// Analyzers
export { analyzeProgress } from './analyzers/progress-analyzer'
export { analyzeEngagement } from './analyzers/engagement-analyzer'
export { analyzeSkillGaps } from './analyzers/skill-gap-analyzer'

// Planners
export { generateDailyPlan } from './planners/activity-planner'
export { scheduleReminders } from './planners/reminder-planner'
export { selectMotivation } from './planners/motivation-planner'

// Channels
export { BaseNotificationChannel } from './channels/channel-interface'
export { InAppChannel } from './channels/in-app-channel'

// Templates
export { renderTemplate, resolveVariables } from './templates/template-engine'

// Scheduler
export { processQueue, scheduleNotification } from './scheduler/scheduler'

// ── Singleton ─────────────────────────────────────────────────────────

let engineInstance: _Engine | null = null

export function getEngine(): _Engine {
  if (!engineInstance) {
    engineInstance = new _Engine()
  }
  return engineInstance
}
