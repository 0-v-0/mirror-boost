export async function attemptReplace(el: Element, newUrl: string, integrity?: string) {
	return new Promise((res) => {
		let newEl: Element
		if (el.tagName.toLowerCase() === 'script') {
			const s = document.createElement('script')
			s.src = newUrl
			if (integrity) {
				s.integrity = integrity
				s.crossOrigin = 'anonymous'
			}
			newEl = s
		} else if (el.tagName.toLowerCase() === 'link') {
			const l = document.createElement('link')
			l.rel = (el as HTMLLinkElement).rel
			l.href = newUrl
			if (integrity) {
				l.integrity = integrity
				l.crossOrigin = 'anonymous'
			}
			newEl = l
		} else {
			res(false)
			return
		}

		const onSuccess = () => {
			newEl.removeEventListener('load', onSuccess)
			newEl.removeEventListener('error', onError)
			res(true)
		}
		const onError = () => {
			newEl.removeEventListener('load', onSuccess)
			newEl.removeEventListener('error', onError)
			newEl.replaceWith(el)
			res(false)
		}

		newEl.addEventListener('load', onSuccess)
		newEl.addEventListener('error', onError)
		el.replaceWith(newEl)
	})
}
