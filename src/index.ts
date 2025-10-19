import { Monitor, collectSriLinks } from './monitor'
import { Aggregator } from './aggregator'
import { attemptReplace } from './replacer'
import { Config, SriElement } from './types'
import { storage } from './storage'

const DEFAULT: Config = {
	latencyThresholdMs: 300,
	minSampleCount: 3,
	enableLogging: true,
	writeBatchMs: 5_000,
}

const monitor = new Monitor(DEFAULT)
const aggregator = new Aggregator(DEFAULT)

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
		if (DEFAULT.enableLogging)
			console.warn('[index] resource timing failed', e)
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
			setTimeout(aggregate, DEFAULT.writeBatchMs)
		}
	}
	aggregate()
}

// simple strategy: when page has enough stats for a host and avg >= threshold, try replacement using other mirrors from integrity_map
async function tryReplace(resources: SriElement[]) {
	// load stats and integrity_map keys from storage
	// Minimal: scan detected resources and attempt replace with same integrity urls from different hosts with lower avg
	if (DEFAULT.enableLogging && resources.length) {
		console.log(`[index] found ${resources.length} sri-protected resources`)
	}
	for (const r of resources) {
		if (!r.integrity) continue
		// find candidate urls from integrity map (read from storage)
		try {
			const mapKey = `integrity:${r.integrity}`
			const map = await storage.get(mapKey)
			if (!map?.urls) continue
			if (DEFAULT.enableLogging)
				console.log(`[index] found ${map.urls.length} candidates for integrity ${r.integrity}`)
			const host = new URL(r.url).host
			// pick first url on a different host
			const candidates: string[] = map.urls.filter((u: string) => new URL(u).host !== host)
			if (!candidates.length) continue
			const chosen = candidates[0]
			const ok = await attemptReplace(r.el, chosen, r.integrity)
			if (DEFAULT.enableLogging)
				console.log(`[index] ${ok ? 'replaced' : 'failed to replace'
					} ${r.url} -> ${chosen}`)
		} catch (e) {
			if (DEFAULT.enableLogging) console.error(e)
		}
	}
}

// run initial observe
if (document.readyState === 'complete' || document.readyState === 'interactive') {
	processResources()
} else {
	window.addEventListener('DOMContentLoaded', processResources)
}
