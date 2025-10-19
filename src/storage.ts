type KV = Record<string, any>

const local = globalThis.chrome?.storage?.local

function chromeGet<T = any>(key: string): Promise<T | undefined> {
	return new Promise((resolve) => {
		if (!local) return resolve(undefined)
		local.get(key, (items) => {
			resolve((items as any)[key])
		})
	})
}

function chromeSet(obj: Record<string, any>): Promise<void> {
	return new Promise((resolve) => {
		if (!local) return resolve()
		local.set(obj, () => resolve())
	})
}

export class StorageWrapper {
	private mem: KV = {}

	async get<T = any>(key: string): Promise<T | undefined> {
		if (local) {
			return await chromeGet<T>(key)
		}
		return this.mem[key]
	}

	async set(key: string, value: any): Promise<void> {
		if (local) {
			return await chromeSet({ [key]: value })
		}
		this.mem[key] = value
	}

	// simple batch writer used by aggregator
	async writeBatch(items: Array<{ key: string; value: any }>): Promise<void> {
		if (local) {
			const payload: KV = {}
			for (const it of items) payload[it.key] = it.value
			await chromeSet(payload)
			return
		}
		for (const it of items) this.mem[it.key] = it.value
	}
}

export const storage = new StorageWrapper()
