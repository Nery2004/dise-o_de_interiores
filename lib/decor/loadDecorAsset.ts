import { LruCache } from "@/lib/cache/LruCache";

const assetCache = new LruCache<string, Promise<HTMLImageElement>>({ maxEntries: 64, maxEstimatedBytes: 1 });

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
  return pending;
}

export function clearDecorAssetCache() { assetCache.clear(); }
