export async function attemptReplace(el: Element, newUrl: string, integrity?: string): Promise<boolean> {
  return new Promise((resolve) => {
    let replacement: Element | null = null
    if (el.tagName.toLowerCase() === 'script') {
      const s = document.createElement('script')
      s.src = newUrl
      if (integrationAvailable(integrity)) s.setAttribute('integrity', integrity!)
      s.async = true
      replacement = s
    } else if (el.tagName.toLowerCase() === 'link') {
      const l = document.createElement('link')
      l.rel = 'stylesheet'
      l.href = newUrl
      if (integrationAvailable(integrity)) l.setAttribute('integrity', integrity!)
      replacement = l
    } else if (el.tagName.toLowerCase() === 'img') {
      const i = document.createElement('img')
      i.src = newUrl
      if (integrationAvailable(integrity)) i.setAttribute('integrity', integrity!)
      replacement = i
    } else {
      resolve(false)
      return
    }

    const onSuccess = () => {
      replacement?.removeEventListener('load', onSuccess)
      replacement?.removeEventListener('error', onError)
      // swap
      el.replaceWith(replacement!)
      resolve(true)
    }
    const onError = () => {
      replacement?.removeEventListener('load', onSuccess)
      replacement?.removeEventListener('error', onError)
      // do not replace
      resolve(false)
    }

    replacement.addEventListener('load', onSuccess)
    replacement.addEventListener('error', onError)

    // insert but keep original until success
    el.parentElement?.insertBefore(replacement, el.nextSibling)
  })
}

function integrationAvailable(val?: string) {
  return typeof val === 'string' && val.length > 0
}
