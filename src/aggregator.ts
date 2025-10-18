import { Sample, Stats, IntegrityMap, Config } from './types'
import { storage } from './storage'

function hostKey(host: string) {
  return `host:${host}`
}

function integrityKey(val: string) {
  return `integrity:${val}`
}

export class Aggregator {
  constructor(private cfg: Config) {}

  async aggregate(samples: Sample[]) {
    if (!samples.length) return

    const byHost: Record<string, Sample[]> = {}
    for (const s of samples) {
      byHost[s.host] = byHost[s.host] || []
      byHost[s.host].push(s)
    }

    const writes: Array<{ key: string; value: any }> = []

    for (const host of Object.keys(byHost)) {
      const key = hostKey(host)
      const existing: Stats | undefined = await storage.get(key)
      const group = byHost[host]
      const sum = group.reduce((a, b) => a + b.durationMs, 0)
      const avg = sum / group.length

      const merged: Stats = existing
        ? {
            key,
            samples: existing.samples + group.length,
            avgMs: (existing.avgMs * existing.samples + sum) / (existing.samples + group.length),
            firstAt: existing.firstAt,
            lastAt: new Date().toISOString(),
          }
        : {
            key,
            samples: group.length,
            avgMs: avg,
            firstAt: new Date().toISOString(),
            lastAt: new Date().toISOString(),
          }

      // honor minSampleCount: if total samples are below threshold, still record but optionally skip heavy actions elsewhere
      const min = this.cfg.minSampleCount || 3
      if (merged.samples < min && this.cfg.enableLogging) console.debug('[Aggregator] small sample count for', key, merged.samples)

      writes.push({ key, value: merged })
    }

    // integrity map updates
    for (const s of samples) {
      if (!s.integrity) continue
      const ik = integrityKey(s.integrity)
      const ex: IntegrityMap | undefined = await storage.get(ik)
      const merged: IntegrityMap = ex
        ? { key: ik, urls: Array.from(new Set([...ex.urls, s.url])), lastSeenAt: new Date().toISOString() }
        : { key: ik, urls: [s.url], lastSeenAt: new Date().toISOString() }
      writes.push({ key: ik, value: merged })
    }

    // batch write
    await storage.writeBatch(writes)
  }
}
