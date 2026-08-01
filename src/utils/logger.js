import config from '../config/config.js';

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = LEVELS[config.logging.level] ?? LEVELS.info;

function timestamp() {
  return new Date().toISOString();
}

function format(level, scope, message, meta) {
  const base = `[${timestamp()}] [${level.toUpperCase()}] [${scope}] ${message}`;
  if (meta === undefined) return base;
  if (meta instanceof Error) {
    return `${base}\n${meta.stack || meta.message}`;
  }
  try {
    return `${base} ${JSON.stringify(meta)}`;
  } catch {
    return `${base} ${String(meta)}`;
  }
}

/**
 * Creates a scoped logger, e.g. logger('AIClient').info('...').
 * Scoping makes it easy to trace which module produced a log line.
 */
function createLogger(scope) {
  return {
    error: (message, meta) => {
      if (currentLevel >= LEVELS.error) console.error(format('error', scope, message, meta));
    },
    warn: (message, meta) => {
      if (currentLevel >= LEVELS.warn) console.warn(format('warn', scope, message, meta));
    },
    info: (message, meta) => {
      if (currentLevel >= LEVELS.info) console.log(format('info', scope, message, meta));
    },
    debug: (message, meta) => {
      if (currentLevel >= LEVELS.debug) console.log(format('debug', scope, message, meta));
    },
  };
}

export default createLogger;
