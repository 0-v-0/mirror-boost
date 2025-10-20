export type Sample = {
	url: string
	host: string
	durationMs: number
	timestamp: string // ISO
	integrity?: string
}

export type Stats = {
	key: string // host:<host>
	samples: number
	avgMs: number
	firstAt: string
	lastAt: string
}

export type IntegrityMap = {
	key: string // integrity:<val>
	urls: string[]
	lastSeenAt: string
}

export type Config = {
	thresholdMs: number
	minSampleCount: number
	enableLogging: boolean
	writeBatchMs: number
}

export type SriElement = {
	el: HTMLElement
	url: string
	integrity?: string
}

declare global {
	let DEFAULT: {
		settings: Config
		mirrors: string[]
	}
	let local: chrome.storage.StorageArea | undefined
	let chromeGet: <T = any>(key: string) => Promise<T | undefined>
	let chromeSet: (obj: Record<string, any>) => Promise<void>
}
