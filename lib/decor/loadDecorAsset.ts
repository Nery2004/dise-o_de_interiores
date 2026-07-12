const assetCache = new Map<string, Promise<HTMLImageElement>>();

export function loadDecorAsset(source: string) {
  if (!/^\/decor\/[a-z0-9/_-]+\.(png|webp)$/i.test(source)) return Promise.reject(new Error("Asset decorativo no permitido."));
  const cached = assetCache.get(source);
  if (cached) return cached;
  const pending = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => { assetCache.delete(source); reject(new Error(`No se pudo cargar el objeto: ${source}`)); };
    image.src = source;
  });
  assetCache.set(source, pending);
  if (assetCache.size > 64) {
    const oldest = assetCache.keys().next().value;
    if (oldest) assetCache.delete(oldest);
  }
  return pending;
}

export function clearDecorAssetCache() { assetCache.clear(); }
