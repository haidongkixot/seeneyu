import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

type LogLevel = 'error' | 'warn' | 'info'
type LogSource = 'api' | 'client' | 'user-report' | 'cron'

interface LogOptions {
  stack?: string
  metadata?: Prisma.InputJsonValue
  userId?: string
}

/**
 * Save a log entry to the database and print to console.
 */
export async function log(
  level: LogLevel,
  source: LogSource,
  message: string,
  opts?: LogOptions
) {
  // Console output
  const tag = `[${level.toUpperCase()}][${source}]`
  if (level === 'error') console.error(tag, message, opts?.stack ?? '')
  else if (level === 'warn') console.warn(tag, message)
  else console.info(tag, message)

  try {
    await prisma.errorLog.create({
      data: {
        level,
        source,
        message,
        stack: opts?.stack ?? null,
        metadata: opts?.metadata ?? Prisma.JsonNull,
        userId: opts?.userId ?? null,
      },
    })
  } catch (err) {
    // If DB write fails, don't throw — just print
    console.error('[logger] failed to persist log:', err)
  }
}

/** Convenience: log an Error object */
export async function logError(
  source: LogSource,
  error: unknown,
  metadata?: Prisma.InputJsonValue
) {
  const err = error instanceof Error ? error : new Error(String(error))
  return log('error', source, err.message, {
    stack: err.stack,
    metadata,
  })
}

/** Convenience: warning */
export async function logWarn(
  source: LogSource,
  message: string,
  metadata?: Prisma.InputJsonValue
) {
  return log('warn', source, message, { metadata })
}

/** Convenience: info */
export async function logInfo(
  source: LogSource,
  message: string,
  metadata?: Prisma.InputJsonValue
) {
  return log('info', source, message, { metadata })
}
