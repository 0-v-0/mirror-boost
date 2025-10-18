import { Monitor, detectResourcesWithIntegrity } from './monitor'
import { Aggregator } from './aggregator'
import { attemptReplace } from './replacer'
import { Config } from './types'

const DEFAULT: Config = {
  latencyThresholdMs: 300,
  minSampleCount: 3,
  enableLogging: false,
  writeBatchMs: 30_000,
}

const monitor = new Monitor(DEFAULT)
const aggregator = new Aggregator(DEFAULT)

function observeResourceTiming() {
  // collect existing resources with integrity and attach load events
  const resources = detectResourcesWithIntegrity()
  for (const r of resources) {
    const el = r.el as HTMLElement
    const start = performance.now()
    const onLoad = () => {
      const duration = performance.now() - start
      monitor.addSample({ url: r.url, host: new URL(r.url).host, durationMs: duration, timestamp: new Date().toISOString(), integrity: r.integrity })
      el.removeEventListener('load', onLoad)
    }
    el.addEventListener('load', onLoad)
  }
}

// periodic aggregator flush
setInterval(async () => {
  const samples = monitor.drain()
  if (samples.length) await aggregator.aggregate(samples)
}, DEFAULT.writeBatchMs)

// simple strategy: when page has enough stats for a host and avg >= threshold, try replacement using other mirrors from integrity_map
async function tryReplacementCycle() {
  // load stats and integrity_map keys from storage
  // Minimal: scan detected resources and attempt replace with same integrity urls from different hosts with lower avg
  const resources = detectResourcesWithIntegrity()
  for (const r of resources) {
    if (!r.integrity) continue
    // find candidate urls from integrity map (read from storage)
    try {
      const mapKey = `integrity:${r.integrity}`
      const map = await (await import('./storage')).storage.get(mapKey)
      if (!map || !map.urls) continue
      // pick first url on a different host
      const candidates: string[] = map.urls.filter((u: string) => new URL(u).host !== new URL(r.url).host)
      if (!candidates.length) continue
      const chosen = candidates[0]
      const ok = await attemptReplace(r.el, chosen, r.integrity)
      if (ok && DEFAULT.enableLogging) console.log('[index] replaced', r.url, '->', chosen)
      if (!ok && DEFAULT.enableLogging) console.log('[index] replacement failed for', r.url)
    } catch (e) {
      if (DEFAULT.enableLogging) console.error(e)
    }
  }
}

// run initial observe
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  observeResourceTiming()
} else {
  window.addEventListener('DOMContentLoaded', observeResourceTiming)
}

// run replacement cycle periodically
setInterval(() => {
  tryReplacementCycle()
}, 60_000)

export default {}
