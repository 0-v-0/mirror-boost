import { Monitor, collectSriLinks } from './monitor'
import { Aggregator } from './aggregator'
import { attemptReplace } from './replacer'
import { Config, SriElement } from './types'
import { storage } from './storage'

chromeGet<Config>('settings').then((cfg = DEFAULT.settings) => {
	const monitor = new Monitor(cfg)
	const aggregator = new Aggregator(cfg)

	function processResources() {
		// Prefer Resource Timing API to compute accurate resource load durations.
		// Fallback: for resources not present in the timing buffer, attach a one-time
		// load listener like the old implementation.
		const resources = collectSriLinks()

		// Map by absolute URL for quick lookup
		const byUrl = new Map<string, SriElement>()
		for (const r of resources) {
			byUrl.set(r.url, r)
		}

		try {
			const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
			for (const e of entries) {
				const url = e.name
				const matched = byUrl.get(url)
				if (matched) {
					monitor.addSample({
						url: matched.url,
						host: new URL(matched.url).host,
						durationMs: e.responseEnd - e.startTime,
						timestamp: new Date().toISOString(),
						integrity: matched.integrity,
					})
					// remove matched so we don't attach fallback listeners
					byUrl.delete(url)
				}
			}
		} catch (e) {
			if (cfg.enableLogging)
				console.warn('[mb] resource timing failed', e)
		}

		// For any resources not observed via Resource Timing API, attach load listeners as fallback
		for (const [, r] of byUrl) {
			const start = performance.now()
			r.el.addEventListener('load', () => {
				const duration = performance.now() - start
				monitor.addSample({
					url: r.url,
					host: new URL(r.url).host,
					durationMs: duration,
					timestamp: new Date().toISOString(),
					integrity: r.integrity,
				})
			}, { once: true })
		}

		// proceed to replacement logic using the detected resources
		tryReplace(resources)
		let aggregated = 0
		const aggregate = () => {
			const samples = monitor.drain()
			if (samples.length) {
				aggregator.aggregate(samples)
				aggregated += samples.length
			}
			if (aggregated < resources.length) {
				setTimeout(aggregate, cfg.writeBatchMs)
			}
		}
		aggregate()
	}

	// simple strategy: when page has enough stats for a host and avg >= threshold, try replacement using other mirrors from integrity_map
	async function tryReplace(resources: SriElement[]) {
		// load stats and integrity_map keys from storage
		// Minimal: scan detected resources and attempt replace with same integrity urls from different hosts with lower avg
		if (cfg.enableLogging && resources.length) {
			console.log(`[mb] found ${resources.length} sri-protected resources`)
		}
		for (const r of resources) {
			if (!r.integrity) continue
			// find candidate urls from integrity map (read from storage)
			try {
				const mapKey = `integrity:${r.integrity}`
				const map = await storage.get(mapKey)
				if (!map?.urls) continue
				if (cfg.enableLogging)
					console.log(`[mb] found ${map.urls.length} candidates for integrity ${r.integrity}`)
				const host = new URL(r.url).host
				// pick first url on a different host
				const candidates: string[] = map.urls.filter((u: string) => new URL(u).host !== host)
				if (!candidates.length) continue
				const chosen = candidates[0]
				const ok = await attemptReplace(r.el, chosen, r.integrity)
				if (cfg.enableLogging)
					console.log(`[mb] ${ok ? 'replaced' : 'failed to replace'
						} ${r.url} -> ${chosen}`)
			} catch (e) {
				if (cfg.enableLogging) console.error(e)
			}
		}
	}

	// run initial observe
	if (document.readyState === 'complete' || document.readyState === 'interactive') {
		processResources()
	} else {
		window.addEventListener('DOMContentLoaded', processResources)
	}
})
