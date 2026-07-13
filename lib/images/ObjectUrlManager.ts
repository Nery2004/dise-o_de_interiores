export class ObjectUrlManager {
  private readonly urls = new Map<string, string>();

  create(key: string, source: Blob) {
    this.revoke(key);
    const url = URL.createObjectURL(source);
    this.urls.set(key, url);
    return url;
  }

  adopt(key: string, url: string) {
    this.revoke(key);
    this.urls.set(key, url);
    return url;
  }

  revoke(key: string) {
    const url = this.urls.get(key);
    if (!url) return;
    URL.revokeObjectURL(url);
    this.urls.delete(key);
  }

  clear() {
    for (const url of this.urls.values()) URL.revokeObjectURL(url);
    this.urls.clear();
  }

  get size() { return this.urls.size; }
}
