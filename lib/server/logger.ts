import "server-only";

type LogContext = Record<string, string | number | boolean | null | undefined>;

function safeContext(context?: LogContext) {
  if (!context) return undefined;
  return Object.fromEntries(Object.entries(context).filter(([, value]) => value !== undefined));
}

export const serverLogger = {
  info(message: string, context?: LogContext) { console.info(JSON.stringify({ level: "info", message, ...safeContext(context) })); },
  warn(message: string, context?: LogContext) { console.warn(JSON.stringify({ level: "warn", message, ...safeContext(context) })); },
  error(message: string, context?: LogContext) { console.error(JSON.stringify({ level: "error", message, ...safeContext(context) })); },
};
