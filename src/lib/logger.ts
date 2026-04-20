type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  [key: string]: unknown
}

const LOG_LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }

class Logger {
  private minLevel: LogLevel

  constructor(minLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info') {
    this.minLevel = minLevel
  }

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
    if (LOG_LEVELS[level] < LOG_LEVELS[this.minLevel]) return
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
    }
    const output = JSON.stringify(entry)
    if (level === 'error') {
      console.error(output)
    } else if (level === 'warn') {
      console.warn(output)
    } else {
      console.log(output)
    }
  }

  debug(message: string, meta?: Record<string, unknown>) { this.log('debug', message, meta) }
  info(message: string, meta?: Record<string, unknown>) { this.log('info', message, meta) }
  warn(message: string, meta?: Record<string, unknown>) { this.log('warn', message, meta) }
  error(message: string, meta?: Record<string, unknown>) { this.log('error', message, meta) }

  child(context: Record<string, unknown>) {
    const child = new Logger(this.minLevel)
    const originalLog = child.log.bind(child)
    child.log = (level, message, meta) => originalLog(level, message, { ...context, ...meta })
    return child
  }
}

export const logger = new Logger()
