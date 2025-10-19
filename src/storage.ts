type KV = Record<string, any>

export class KVStorage {
	private mem: KV = {}

	async get<T = any>(key: string): Promise<T | undefined> {
		if (local) {
			return await chromeGet<T>(key)
		}
		return this.mem[key]
	}

	async set(key: string, value: any) {
		if (local) {
			return await chromeSet({ [key]: value })
		}
		this.mem[key] = value
	}

	// simple batch writer used by aggregator
	async writeBatch(items: Array<{ key: string; value: any }>) {
		if (local) {
			const payload: KV = {}
			for (const it of items) payload[it.key] = it.value
			await chromeSet(payload)
		}
		for (const it of items) this.mem[it.key] = it.value
	}
}

export const storage = new KVStorage()
