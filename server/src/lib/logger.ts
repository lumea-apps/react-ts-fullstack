type LogLevel = "debug" | "info" | "warn" | "error";

const levels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const colors = {
  debug: "\x1b[36m",
  info: "\x1b[32m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
  reset: "\x1b[0m",
};

export function createLogger(logLevel: LogLevel = "info", isProd = false) {
  function shouldLog(level: LogLevel): boolean {
    return levels[level] >= levels[logLevel];
  }

  function formatMessage(level: LogLevel, message: string, meta?: object): string {
    const timestamp = new Date().toISOString();
    const color = colors[level];
    const reset = colors.reset;
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";

    if (isProd) {
      return JSON.stringify({ timestamp, level, message, ...meta });
    }

    return `${color}[${timestamp}] ${level.toUpperCase()}${reset}: ${message}${metaStr}`;
  }

  return {
    debug: (message: string, meta?: object) => {
      if (shouldLog("debug")) console.debug(formatMessage("debug", message, meta));
    },
    info: (message: string, meta?: object) => {
      if (shouldLog("info")) console.info(formatMessage("info", message, meta));
    },
    warn: (message: string, meta?: object) => {
      if (shouldLog("warn")) console.warn(formatMessage("warn", message, meta));
    },
    error: (message: string, meta?: object) => {
      if (shouldLog("error")) console.error(formatMessage("error", message, meta));
    },
  };
}

// Default logger for middleware (will be overridden per-request if needed)
export const logger = createLogger();
