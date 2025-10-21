import { Sample, Config, SriElement } from './types'

export class Monitor {
	private samples: Sample[] = []
	constructor(private cfg: Config) { }

	addSample(s: Sample) {
		this.samples.push(s)
		if (this.cfg.enableLogging) console.debug('[Monitor] sample', s)
	}

	drain() {
		const out = this.samples.slice()
		this.samples.length = 0
		return out
	}
}

export function collectSriLinks() {
	const map = new Map<string, SriElement>()
	for (const el of (document.querySelectorAll('script[src][integrity]') as
		NodeListOf<HTMLScriptElement>)) {
		const integrity = el.integrity
		if (integrity)
			map.set(el.src, { el, url: el.src, integrity })
	}
	for (const el of (document.querySelectorAll('link[href][integrity]') as
		NodeListOf<HTMLLinkElement>)) {
		const integrity = el.integrity
		if (integrity)
			map.set(el.href, { el, url: el.href, integrity })
	}
	return map
}
