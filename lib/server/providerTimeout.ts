import "server-only";

export class ProviderTimeoutError extends Error { constructor() { super("El servicio de detección tardó demasiado en responder."); this.name = "ProviderTimeoutError"; } }

export async function runWithProviderTimeout<T>(timeoutMs: number, operation: (signal: AbortSignal) => Promise<T>) {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => { timeout = setTimeout(() => { controller.abort(); reject(new ProviderTimeoutError()); }, timeoutMs); });
  try { return await Promise.race([operation(controller.signal), timeoutPromise]); }
  finally { if (timeout) clearTimeout(timeout); }
}
