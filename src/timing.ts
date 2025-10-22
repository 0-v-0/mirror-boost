// Injected into pages; responds to messages to return aggregated resource timing

function getResourceType(entry: PerformanceResourceTiming) {
	// try to map initiatorType / name to simple categories
	const t = entry.initiatorType.toLowerCase()
	if (t === 'link') return /\.css(\?|$)/i.test(entry.name) ? 'css' : 'other'
	if (t === 'script' || /\.js(\?|$)/i.test(entry.name)) return 'js'
	return null
}

function aggregateTimings() {
	const entries = (performance.getEntriesByType('resource') as PerformanceResourceTiming[]) || []
	const types: Record<string, { sum: number; count: number }> = {}
	for (const e of entries) {
		// consider only completed resources with transferSize > 0 or responseEnd > 0
		// transferSize might be 0 for cross-origin without timing-allow-origin; use responseEnd - startTime > 0
		const duration = (e.responseEnd && e.startTime) ? (e.responseEnd - e.startTime) : (e.duration || 0)
		if (!duration || duration <= 0) continue
		const rt = getResourceType(e)
		if (!rt) continue
		if (!types[rt]) types[rt] = { sum: 0, count: 0 }
		types[rt].sum += duration
		types[rt].count += 1
	}
	return types
}

chrome.runtime.onMessage.addListener((msg: any, _sender: any, sendResponse: (resp: any) => void) => {
	if (msg?.type === 'get_resource_timing') {
		try {
			const data = aggregateTimings()
			sendResponse(data)
		} catch (err: any) {
			sendResponse({ error: err && err.message ? err.message : String(err) })
		}
		return true
	}
	return false
})

