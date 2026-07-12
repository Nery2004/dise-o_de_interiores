import "server-only";

export class ProviderTimeoutError extends Error { constructor() { super("El servicio de detección tardó demasiado en responder."); this.name = "ProviderTimeoutError"; } }

export async function runWithProviderTimeout<T>(timeoutMs: number, operation: (signal: AbortSignal) => Promise<T>, parentSignal?: AbortSignal) {
  const controller = new AbortController();
  const abortFromParent = () => controller.abort(parentSignal?.reason);
  parentSignal?.addEventListener("abort", abortFromParent, { once: true });
  if (parentSignal?.aborted) abortFromParent();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => { timeout = setTimeout(() => { controller.abort(); reject(new ProviderTimeoutError()); }, timeoutMs); });
  try { return await Promise.race([operation(controller.signal), timeoutPromise]); }
  finally { if (timeout) clearTimeout(timeout); parentSignal?.removeEventListener("abort", abortFromParent); }
}
