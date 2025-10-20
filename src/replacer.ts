export async function attemptReplace(el: HTMLLinkElement | HTMLScriptElement, newUrl: string, _integrity?: string) {
	const tag = el.tagName.toLowerCase()
	if (tag !== 'script' && tag !== 'link')
		throw new Error('Element is not script or link')

	const url = tag === 'script' ? (el as HTMLScriptElement).src : (el as HTMLLinkElement).href
	if (!url)
		throw new Error('Element has no src/href')

	// Create a unique rule id
	const ruleId = Math.floor(Math.random() * 0x7FFFFFFE) + 1

	// Build DNR rule to redirect originalUrl to newUrl. Match as exact URL.
	const rule: chrome.declarativeNetRequest.Rule = {
		id: ruleId,
		priority: 1,
		action: {
			type: 'redirect' as const,
			redirect: { url: newUrl }
		},
		condition: {
			urlFilter: url,
			resourceTypes: tag === 'script' ? ['script'] : ['stylesheet', 'image'],
		}
	}

	// Some browsers require urlFilter to be a pattern; using urlFilter with full URL works in Chrome.
	// Content scripts cannot call declarativeNetRequest directly, so proxy via background.
	const sendUpdate = (ruleOrId: any) => new Promise<void>((res, rej) => {
		chrome.runtime.sendMessage({ message: 'update_rules', rule: ruleOrId }, (resp) => {
			const err = chrome.runtime.lastError || resp?.error
			if (err) return rej(err)
			res()
		})
	})

	await sendUpdate(rule)

	// Now perform the DOM swap keeping original URL on element so that browser requests originalUrl
	return new Promise<void>((res, rej) => {
		const cleanup = () => {
			el.removeEventListener('load', onLoad)
			el.removeEventListener('error', onError)
			// fire-and-forget removal via background message; ignore errors
			sendUpdate(ruleId).catch(() => { /* ignore */ })
		}

		const onLoad = () => {
			cleanup()
			res()
		}
		const onError = (e: Event) => {
			cleanup()
			rej((e as ErrorEvent).error)
		}

		el.addEventListener('load', onLoad)
		el.addEventListener('error', onError)
	})
}
