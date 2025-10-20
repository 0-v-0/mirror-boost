import { Monitor, collectSriLinks } from './monitor'
import { attemptReplace } from './replacer'
import { Config, SriElement } from './types'
import { sendMsg } from './util'

chromeGet<Config>('settings').then((cfg = DEFAULT.settings) => {
	const monitor = new Monitor(cfg)

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
		// Track URLs observed via Resource Timing
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
		// filter out resources that appear already loaded so we don't attempt replacement on them
		tryReplace(resources)
		let aggregated = 0
		const aggregate = async () => {
			const samples = monitor.drain()
			if (samples.length) {
				await sendMsg({ message: 'aggregate', samples })
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
		// compute per-host average durations from Resource Timing API for the detected resources
		if (cfg.enableLogging && resources.length) {
			console.log(`[mb] found ${resources.length} sri-protected resources`)
		}
		// build URL -> resource map for quick lookup
		const byUrl = new Map<string, SriElement>()
		for (const r of resources) byUrl.set(r.url, r)

		const hostDurations: Record<string, number[]> = {}
		try {
			const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
			for (const e of entries) {
				const url = e.name
				const matched = byUrl.get(url)
				if (matched) {
					const host = new URL(matched.url).host
					hostDurations[host] = hostDurations[host] || []
					hostDurations[host].push(e.responseEnd - e.startTime)
				}
			}
		} catch (e) {
			if (cfg.enableLogging)
				console.warn('[mb] resource timing failed when computing host averages', e)
		}

		const hostAvg = new Map<string, number>()
		for (const h of Object.keys(hostDurations)) {
			const arr = hostDurations[h]
			if (arr && arr.length) {
				const sum = arr.reduce((a, b) => a + b, 0)
				hostAvg.set(h, sum / arr.length)
			}
		}

		for (const r of resources) {
			const host = new URL(r.url).host
			const avg = hostAvg.get(host) || 0
			if (avg < cfg.thresholdMs) {
				if (cfg.enableLogging)
					console.debug(`[mb] host ${host} avg ${avg.toFixed(1)}ms < threshold ${cfg.thresholdMs}ms, skipping ${r.url}`)
				continue
			}
			// find candidate urls from integrity map (read from storage)
			try {
				const map = await sendMsg({ message: 'get_integrity', key: r.integrity })
				if (!map?.urls) continue
				if (cfg.enableLogging)
					console.log(`[mb] found ${map.urls.length} candidates for integrity ${r.integrity}`)
				// pick first url on a different host
				const candidates: string[] = map.urls.filter((u: string) => new URL(u).host !== host)
				if (!candidates.length) continue
				const chosen = candidates[0]
				attemptReplace(r.el, chosen, r.integrity).then(() => {
					if (cfg.enableLogging)
						console.log(`[mb] replaced ${r.url} -> ${chosen}`)
				}, (e) => {
					if (cfg.enableLogging)
						console.error(`[mb] failed to replace ${r.url} -> ${chosen}`, e)
				})
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
