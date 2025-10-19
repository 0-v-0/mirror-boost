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
	const out: SriElement[] = []
	for (const el of (document.querySelectorAll('script[src][integrity]') as
		NodeListOf<HTMLScriptElement>)) {
		out.push({ el, url: el.src, integrity: el.integrity })
	}
	for (const el of (document.querySelectorAll('link[href][integrity]') as
		NodeListOf<HTMLLinkElement>)) {
		out.push({ el, url: el.href, integrity: el.integrity })
	}
	return out
}
