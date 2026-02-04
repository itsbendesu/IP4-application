/**
 * Simple structured logging utility for production observability.
 * Logs to stdout in JSON format for easy parsing by log aggregators.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = LOG_LEVELS[
  (process.env.LOG_LEVEL as LogLevel) || "info"
] ?? LOG_LEVELS.info;

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= currentLevel;
}

function formatLog(level: LogLevel, message: string, context?: LogContext): string {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };

  // In development, use readable format
  if (process.env.NODE_ENV === "development") {
    const prefix = `[${entry.timestamp}] ${level.toUpperCase()}:`;
    if (context && Object.keys(context).length > 0) {
      return `${prefix} ${message} ${JSON.stringify(context)}`;
    }
    return `${prefix} ${message}`;
  }

  // In production, use JSON for log aggregators
  return JSON.stringify(entry);
}

export const logger = {
  debug(message: string, context?: LogContext) {
    if (shouldLog("debug")) {
      console.log(formatLog("debug", message, context));
    }
  },

  info(message: string, context?: LogContext) {
    if (shouldLog("info")) {
      console.log(formatLog("info", message, context));
    }
  },

  warn(message: string, context?: LogContext) {
    if (shouldLog("warn")) {
      console.warn(formatLog("warn", message, context));
    }
  },

  error(message: string, error?: Error | unknown, context?: LogContext) {
    if (shouldLog("error")) {
      const errorContext: LogContext = { ...context };

      if (error instanceof Error) {
        errorContext.errorName = error.name;
        errorContext.errorMessage = error.message;
        errorContext.stack = error.stack;
      } else if (error) {
        errorContext.error = String(error);
      }

      console.error(formatLog("error", message, errorContext));
    }
  },

  /**
   * Log an API request with timing and status.
   */
  request(
    method: string,
    path: string,
    status: number,
    durationMs: number,
    context?: LogContext
  ) {
    const level: LogLevel = status >= 500 ? "error" : status >= 400 ? "warn" : "info";

    if (shouldLog(level)) {
      console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
        formatLog(level, `${method} ${path} ${status}`, {
          method,
          path,
          status,
          durationMs,
          ...context,
        })
      );
    }
  },
};

/**
 * Middleware helper to track request timing.
 */
export function trackRequestStart(): () => number {
  const start = Date.now();
  return () => Date.now() - start;
}
