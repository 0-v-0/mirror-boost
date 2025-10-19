export async function attemptReplace(el: Element, newUrl: string, integrity?: string) {
	return new Promise((res) => {
		let newEl: Element | null = null
		if (el.tagName.toLowerCase() === 'script') {
			const s = document.createElement('script')
			s.src = newUrl
			if (integrity) s.integrity = integrity
			newEl = s
		} else if (el.tagName.toLowerCase() === 'link') {
			const l = document.createElement('link')
			// preserve rel where appropriate; caller should ensure rel attribute is correct (stylesheet or icon)
			l.rel = (el as HTMLLinkElement).rel || 'stylesheet'
			l.href = newUrl
			if (integrity) l.integrity = integrity
			newEl = l
		} else {
			res(false)
			return
		}

		const onSuccess = () => {
			newEl?.removeEventListener('load', onSuccess)
			newEl?.removeEventListener('error', onError)
			// swap
			el.replaceWith(newEl!)
			res(true)
		}
		const onError = () => {
			newEl?.removeEventListener('load', onSuccess)
			newEl?.removeEventListener('error', onError)
			// do not replace
			res(false)
		}

		newEl.addEventListener('load', onSuccess)
		newEl.addEventListener('error', onError)

		// insert but keep original until success
		el.parentElement?.insertBefore(newEl, el.nextSibling)
	})
}
