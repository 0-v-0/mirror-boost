import { Sample, Config } from './types'
import { storage } from './storage'
import { openDB } from 'idb'

function hostKey(host: string) {
	return `host:${host}`
}

export class Aggregator {
	constructor(private cfg: Config) { }

	async aggregate(samples: Sample[]) {
		if (!samples.length) return

		const byHost: Record<string, Sample[]> = {}
		for (const s of samples) {
			byHost[s.host] = byHost[s.host] || []
			byHost[s.host].push(s)
		}

		const recordsWrites = []
		const now = new Date().toISOString()
		for (const host in byHost) {
			const key = hostKey(host)
			const existing = await storage.getStats(key)
			const group = byHost[host]
			const sum = group.reduce((a, b) => a + b.durationMs, 0)
			const avg = sum / group.length
			const totalSamples = (existing?.samples) ? existing.samples + group.length : group.length
			const merged = existing
				? {
					key,
					type: existing.type || 'host',
					id: existing.id || host,
					samples: totalSamples,
					avgMs: (existing.avgMs * existing.samples + sum) / totalSamples,
					firstAt: existing.firstAt,
					lastAt: now,
				}
				: {
					key,
					type: 'host',
					id: host,
					samples: group.length,
					avgMs: avg,
					firstAt: now,
					lastAt: now,
				}

			const min = this.cfg.minSampleCount || 3
			if (merged.samples < min && this.cfg.enableLogging)
				console.debug('[Aggregator] small sample count for', key, merged.samples)

			recordsWrites.push({ key, value: merged })
		}
		if (recordsWrites.length) await storage.writeBatchRecords(recordsWrites)

		const integrityWrites = []
		// integrity map updates
		for (const s of samples) {
			const ik = s.integrity
			const ex = await storage.getIntegrity(ik)
			const urls = Array.isArray(ex?.urls) ? [...new Set([...ex.urls, s.url])] : [s.url]
			const merged = {
				key: ik,
				integrity: s.integrity,
				urls,
				createdAt: ex?.createdAt ?? now,
				lastSeenAt: now,
			}
			integrityWrites.push({ key: ik, value: merged })
		}

		// batch write: write records and integrity maps separately
		if (integrityWrites.length) await storage.writeBatchIntegrity(integrityWrites)
	}

	async clearExpired(ttlMs: number) {
		const now = Date.now()
		try {
			const db = await openDB('mirror-boost-db', 1)
			const tx = db.transaction(['stats', 'integrity_map'], 'readwrite')
			const statsStore = tx.objectStore('stats')
			const imStore = tx.objectStore('integrity_map')

			// remove expired stats based on lastAt
			try {
				const allStats = await statsStore.getAll()
				for (const s of allStats) {
					const lastAt = s?.lastAt
					if (!lastAt) continue
					const t = Date.parse(lastAt)
					if (t < now - ttlMs) {
						await statsStore.delete(s.key)
						if (this.cfg.enableLogging) console.debug('[Aggregator] deleted expired stat', s.key)
					}
				}
			} catch (e) {
				console.error('[Aggregator] failed to clear expired stats', e)
			}

			// remove expired integrity_map entries based on ttlExpiresAt (if present)
			try {
				const all = await imStore.getAll()
				for (const it of all) {
					const lastAt = it?.lastAt
					if (!lastAt) continue
					const t = Date.parse(lastAt)
					if (t < now - ttlMs) {
						await imStore.delete(it.key)
					}
				}
			} catch (e) {
				console.error('[Aggregator] failed to clear expired integrity_map entries', e)
			}

			await tx.done
		} catch (e) {
			console.error('[Aggregator] clearExpired error', e)
		}
	}
}
