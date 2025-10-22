// Injected into pages; responds to messages to return aggregated resource timing
/// <reference types="vitest/importMeta" />
import { Config } from './types'

function getResourceType(entry: PerformanceResourceTiming) {
	// try to map initiatorType / name to simple categories
	const t = entry.initiatorType.toLowerCase()
	if (t === 'link')
		return /\.css(\?|$)/i.test(entry.name) ? 'css' : /\.(ico|png)(\?|$)/i.test(entry.name) ? 'icon' : null
	if (t === 'script') return 'js'
	return null
}

function aggregateTimings(entries: PerformanceEntryList) {
	const types: Record<string, { sum: number; count: number }> = {}
	for (const e of entries) {
		const duration = e.duration
		if (duration <= 0) continue
		const rt = getResourceType(e as PerformanceResourceTiming)
		if (!rt) continue
		types[rt] ||= { sum: 0, count: 0 }
		types[rt].sum += duration
		types[rt].count++
	}
	return types
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest

	const makeEntry = (name: string, initiatorType: string, duration: number) => ({
		name,
		initiatorType,
		duration,
	} as PerformanceResourceTiming)
	describe('getResourceType', () => {
		it('classifies script as js', () => {
			expect(getResourceType(makeEntry('a.js', 'script', 10))).toBe('js')
		})
		it('classifies css link as css', () => {
			expect(getResourceType(makeEntry('styles.css', 'link', 5))).toBe('css')
		})
		it('classifies non-css link as icon', () => {
			expect(getResourceType(makeEntry('favicon.ico', 'link', 5))).toBe('icon')
		})
		it('returns null for unknown types', () => {
			expect(getResourceType(makeEntry('font.woff2', 'font', 5))).toBeNull()
		})
	})

	describe('aggregateTimings', () => {
		it('aggregates durations by type', () => {
			const entries = [
				makeEntry('a.js', 'script', 10),
				makeEntry('b.js', 'script', 15),
				makeEntry('s.css', 'link', 5),
			]
			const res = aggregateTimings(entries)
			expect(res.js.count).toBe(2)
			expect(res.js.sum).toBe(25)
			expect(res.css.count).toBe(1)
			expect(res.css.sum).toBe(5)
		})

		it('ignores non-positive durations and unknown types', () => {
			const entries = [
				makeEntry('a.js', 'script', 0),
				makeEntry('b.js', 'script', -5),
				makeEntry('c.woff2', 'font', 20),
			]
			const res = aggregateTimings(entries)
			expect(res.js).toBeUndefined()
			expect(res.css).toBeUndefined()
			expect(res.icon).toBeUndefined()
		})
	})
} else {
	chrome.runtime.onMessage.addListener((msg: any, _sender: any, sendResponse: (resp: any) => void) => {
		if (msg?.type === 'get_resource_timing') {
			try {
				sendResponse(aggregateTimings(performance.getEntriesByType('resource')))
			} catch (err) {
				sendResponse({ error: err })
			}
		}
	})

	chromeGet<Config>('settings').then((cfg = DEFAULT.settings) => {
		chrome.runtime.sendMessage({
			action: 'clear_expired',
			config: cfg,
		});
	});
}
