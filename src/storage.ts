type KV = Record<string, any>

const hasChromeStorage = typeof (globalThis as any).chrome !== 'undefined' && !!(globalThis as any).chrome?.storage?.local

export class StorageWrapper {
  private mem: KV = {}

  async get<T = any>(key: string): Promise<T | undefined> {
    if (hasChromeStorage) {
      const res = await (globalThis as any).chrome.storage.local.get(key)
      return res[key]
    }
    return this.mem[key]
  }

  async set(key: string, value: any): Promise<void> {
    if (hasChromeStorage) {
      await (globalThis as any).chrome.storage.local.set({ [key]: value })
      return
    }
    this.mem[key] = value
  }

  // simple batch writer used by aggregator
  async writeBatch(items: Array<{ key: string; value: any }>): Promise<void> {
    if (hasChromeStorage) {
      const payload: KV = {}
      for (const it of items) payload[it.key] = it.value
      await (globalThis as any).chrome.storage.local.set(payload)
      return
    }
    for (const it of items) this.mem[it.key] = it.value
  }
}

export const storage = new StorageWrapper()
