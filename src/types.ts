/**
 * A single network sample / measurement for a resource.
 *
 * Represents a single observation of a resource load which can be aggregated
 * into statistics. All timestamps are ISO strings.
 */
export type Sample = {
	/** Resource request URL (absolute). */
	url: string
	/** Hostname portion of the URL (e.g. example.com). */
	host: string
	/** Measured duration in milliseconds for the request. */
	durationMs: number
	/** ISO timestamp when this sample was recorded (e.g. 2021-01-01T00:00:00.000Z). */
	timestamp: string
	/** SRI integrity string observed for this resource (e.g. sha256-...). */
	integrity: string
}

/**
 * Aggregated statistics for a host or key.
 *
 * The `key` typically encodes the aggregation target (for example `host:<host>`).
 */
export type Stats = {
	/** Aggregation key (for example "host:example.com"). */
	key: string // host:<host>
	/** Total number of samples included in this aggregation. */
	samples: number
	/** Average request duration in milliseconds across included samples. */
	avgMs: number
	/** ISO timestamp of the first sample included. */
	firstAt: string
	/** ISO timestamp of the last sample included. */
	lastAt: string
}

/**
 * Maps a raw SRI integrity value to the set of URLs that were observed with
 * that integrity string and the last time it was seen.
 */
export type IntegrityMap = {
	/** The raw integrity value (for example `sha256-...`). */
	key: string
	/** List of resource URLs observed carrying this integrity value. */
	urls: string[]
	/** ISO timestamp when this integrity value was last observed. */
	lastSeenAt: string
}

/**
 * Runtime configuration settings for the extension.
 */
export type Config = {
	/** Threshold in milliseconds above which a response is considered slow. */
	thresholdMs: number
	/** Minimum number of samples required before taking action or reporting. */
	minSampleCount: number
	/** Enable verbose logging for diagnostics. */
	enableLogging: boolean
	/** Time window in milliseconds to batch writes to storage. */
	writeBatchMs: number
	/** Time-to-live for samples stored, in milliseconds. */
	ttlMs: number
}

/** Chrome declarativeNetRequest.Rule type alias for convenience. */
export type Rule = chrome.declarativeNetRequest.Rule

/**
 * A DOM element (link or script) together with its resolved URL and integrity
 * attribute value.
 */
export type SriElement = {
	/** The actual DOM element (either <link> or <script>). */
	el: HTMLLinkElement | HTMLScriptElement
	/** The resolved resource URL referenced by the element. */
	url: string
	/** The element's integrity attribute value (SRI string). */
	integrity: string
}

declare global {
	/**
	 * Global defaults used by the extension. Mutable for test/override.
	 */
	let DEFAULT: {
		/** Current runtime settings. */
		settings: Config
		/** Rules array as JSON string. */
		rules: string
	}
	/** Convenience reference to Chrome's local storage area (may be undefined in tests). */
	let local: chrome.storage.StorageArea | undefined
	/** Helper to get a value from chrome storage by key. Resolves undefined when missing. */
	let chromeGet: <T = any>(key: string) => Promise<T | undefined>
	/** Helper to set multiple keys in chrome storage. */
	let chromeSet: (obj: Record<string, any>) => Promise<void>
}
