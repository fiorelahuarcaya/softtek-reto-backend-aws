export type LogLevel = "debug" | "info" | "warn" | "error";
const ORDER: LogLevel[] = ["debug", "info", "warn", "error"];

const isOffline =
  process.env.IS_OFFLINE === "true" || process.env.IS_OFFLINE === "1";
const DEFAULT_LEVEL: LogLevel = isOffline ? "debug" : "info";
const LEVEL = (process.env.LOG_LEVEL as LogLevel) ?? DEFAULT_LEVEL;

function baseLog(
  level: LogLevel,
  msg: string,
  base?: Record<string, any>,
  extra?: any
) {
  if (ORDER.indexOf(level) < ORDER.indexOf(LEVEL)) return;
  console.log(
    JSON.stringify({ level, msg, ...(base || {}), ...(extra || {}) })
  );
}

/** Crea un logger con metadata fija (component, reqId, etc.) */
export function createLogger(base?: Record<string, any>) {
  return {
    level: LEVEL,
    debug: (msg: string, extra?: any) => baseLog("debug", msg, base, extra),
    info: (msg: string, extra?: any) => baseLog("info", msg, base, extra),
    warn: (msg: string, extra?: any) => baseLog("warn", msg, base, extra),
    error: (msg: string, extra?: any) => baseLog("error", msg, base, extra),
  };
}

/** Útil si quieres un logger “global” sin contexto */
export const logger = createLogger({
  service: process.env.AWS_LAMBDA_FUNCTION_NAME,
});
