type KV = Record<string, any>

const local = chrome.storage?.local

export function chromeGet<T = any>(key: string): Promise<T | undefined> {
	return new Promise((res) => {
		if (!local) return res(undefined)
		local.get(key, (items) => {
			res((items as any)[key])
		})
	})
}

export function chromeSet(obj: Record<string, any>): Promise<void> {
	return new Promise((res) => {
		if (!local) return res()
		local.set(obj, () => res())
	})
}

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
