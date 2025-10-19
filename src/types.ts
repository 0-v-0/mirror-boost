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
	latencyThresholdMs: number
	minSampleCount: number
	enableLogging: boolean
	writeBatchMs: number
}
