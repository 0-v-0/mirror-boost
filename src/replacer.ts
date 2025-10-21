import { sendMsg } from './util'

export async function attemptReplace(el: HTMLLinkElement | HTMLScriptElement, newUrl: string, _integrity?: string) {
	const tag = el.tagName.toLowerCase()
	if (tag !== 'script' && tag !== 'link')
		throw new Error('Element is not script or link')

	const attr = tag === 'script' ? 'src' : 'href'
	const url = (el as any)[attr] as string
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
	return sendMsg({ action: 'update_rules', addRule: rule })
}
