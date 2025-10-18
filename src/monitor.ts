import { Sample, Config } from './types'

export class Monitor {
  private samples: Sample[] = []
  constructor(private cfg: Config) {}

  addSample(s: Sample) {
    this.samples.push(s)
    if (this.cfg.enableLogging) console.debug('[Monitor] sample', s)
  }

  drain(): Sample[] {
    const out = this.samples.slice()
    this.samples.length = 0
    return out
  }
}

export function detectResourcesWithIntegrity(): Array<{ el: Element; url: string; integrity?: string }> {
  const out: Array<{ el: Element; url: string; integrity?: string }> = []
  const scripts = Array.from(document.querySelectorAll('script[src][integrity]'))
  for (const s of scripts) {
    const el = s as HTMLScriptElement
    out.push({ el, url: el.src, integrity: el.integrity || undefined })
  }
  const links = Array.from(document.querySelectorAll('link[rel=stylesheet][href][integrity]'))
  for (const l of links) {
    const el = l as HTMLLinkElement
    out.push({ el, url: el.href, integrity: el.integrity || undefined })
  }
  const imgs = Array.from(document.querySelectorAll('img[src][integrity]'))
  for (const i of imgs) {
    const el = i as HTMLImageElement
    const integrity = el.getAttribute('integrity') || undefined
    out.push({ el, url: el.src, integrity })
  }
  return out
}
