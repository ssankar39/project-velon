type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_PRIORITY: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const minLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[minLevel];
}

function sanitize(value: unknown): unknown {
  if (typeof value === 'string') {
    return value
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]')
      .replace(/eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, '[REDACTED_TOKEN]');
  }
  if (value instanceof Error) return value;
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === 'userId' || k === '_id' || k === 'email') {
        out[k] = typeof v === 'string' ? `[${k}]` : v;
      } else {
        out[k] = sanitize(v);
      }
    }
    return out;
  }
  return value;
}

function fmt(level: LogLevel, msg: string, ...args: unknown[]): string {
  const ts = new Date().toISOString();
  const prefix = `${ts} [${level.toUpperCase()}]`;
  if (args.length === 0) return `${prefix} ${msg}`;
  const serialized = args.map(a => (typeof a === 'string' ? a : JSON.stringify(sanitize(a)))).join(' ');
  return `${prefix} ${msg} ${serialized}`;
}

export const logger = {
  debug(msg: string, ...args: unknown[]) {
    if (shouldLog('debug')) console.debug(fmt('debug', msg, ...args));
  },
  info(msg: string, ...args: unknown[]) {
    if (shouldLog('info')) console.info(fmt('info', msg, ...args));
  },
  warn(msg: string, ...args: unknown[]) {
    if (shouldLog('warn')) console.warn(fmt('warn', msg, ...args));
  },
  error(msg: string, ...args: unknown[]) {
    if (shouldLog('error')) console.error(fmt('error', msg, ...args));
  },
};
