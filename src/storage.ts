import { openDB, deleteDB } from 'idb'

type DBSchema = {
	stats: { key: string; };
	integrity_map: { key: string; };
	kv: { key: string; };
}

export class KVStorage {
	private dbPromise = this.initDB()

	private initDB() {
		return openDB<DBSchema>('mirror-boost-db', 1, {
			upgrade(db) {
				const objectStoreNames = db.objectStoreNames
				if (!objectStoreNames.contains('stats'))
					db.createObjectStore('stats', { keyPath: 'key' })
				if (!objectStoreNames.contains('integrity_map'))
					db.createObjectStore('integrity_map', { keyPath: 'key' })
				if (!objectStoreNames.contains('kv'))
					db.createObjectStore('kv', { keyPath: 'key' })
			}
		})
	}

	// store-specific getters/setters
	async getStats<T = any>(key: string): Promise<T | undefined> {
		const db = await this.dbPromise
		try {
			return (await db.get('stats', key)) as T | undefined
		} catch (e) {
			console.error('[storage] getStats error', e)
			return undefined
		}
	}

	async setStats(key: string, value: any) {
		const db = await this.dbPromise
		try {
			await db.put('stats', { ...value, key })
		} catch (e) {
			console.error('[storage] setStats error', e)
		}
	}

	async getIntegrity<T = any>(key: string): Promise<T | undefined> {
		const db = await this.dbPromise
		try {
			return await db.get('integrity_map', key) as T | undefined
		} catch (e) {
			console.error('[storage] getIntegrity error', e)
			return undefined
		}
	}

	async setIntegrity(key: string, value: any) {
		const db = await this.dbPromise
		try {
			const existing = await db.get('integrity_map', key)
			const createdAt = existing?.createdAt ?? new Date().toISOString()
			const ttlExpiresAt = existing?.ttlExpiresAt
			await db.put('integrity_map', { ...value, key, createdAt, ttlExpiresAt })
		} catch (e) {
			console.error('[storage] setIntegrity error', e)
		}
	}

	async getKV<T = any>(key: string): Promise<T | undefined> {
		const db = await this.dbPromise
		try {
			return (await db.get('kv', key)) as T | undefined
		} catch (e) {
			console.error('[storage] getKV error', e)
			return undefined
		}
	}

	async setKV(key: string, value: any) {
		const db = await this.dbPromise
		try {
			await db.put('kv', { ...value, key })
		} catch (e) {
			console.error('[storage] setKV error', e)
		}
	}

	// batch writer used by aggregator. performs transactional writes and preserves createdAt for integrity_map
	// batch writer for stats/kv records (not integrity_map)
	async writeBatchRecords(items: Array<{ key: string; value: any }>) {
		if (!items || !items.length) return
		const db = await this.dbPromise
		const tx = db.transaction(['stats'], 'readwrite')
		const store = tx.objectStore('stats');
		try {
			for (const it of items) {
				const record = { ...it.value, key: it.key }
				await store.put(record)
			}
			await tx.done
		} catch (e) {
			console.error('[storage] writeBatchRecords error', e)
			try { tx.abort() } catch { /* ignore */ }
		}
	}

	// batch writer specifically for integrity_map entries
	async writeBatchIntegrity(items: Array<{ key: string; value: any }>) {
		if (!items || !items.length) return
		const db = await this.dbPromise
		const tx = db.transaction(['integrity_map'], 'readwrite')
		try {
			for (const it of items) {
				const existing = await tx.objectStore('integrity_map').get(it.key)
				const createdAt = existing?.createdAt ?? new Date().toISOString()
				const record = {
					...it.value,
					key: it.key,
					integrity: it.key,
					urls: it.value.urls,
					createdAt,
					ttlExpiresAt: existing?.ttlExpiresAt,
				}
				await tx.objectStore('integrity_map').put(record)
			}
			await tx.done
		} catch (e) {
			console.error('[storage] writeBatchIntegrity error', e)
			try { tx.abort() } catch { /* ignore */ }
		}
	}

	async clear() {
		const db = await this.dbPromise
		const name = db.name
		db.close()
		await deleteDB(name)
		this.dbPromise = this.initDB()
	}
}

export const storage = new KVStorage()
