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
    const integrity = el.getAttribute('integrity') || undefined
    out.push({ el, url: el.src, integrity })
  }
  const links = Array.from(document.querySelectorAll('link[rel=stylesheet][href][integrity]'))
  for (const l of links) {
    const el = l as HTMLLinkElement
    const integrity = el.getAttribute('integrity') || undefined
    out.push({ el, url: el.href, integrity })
  }
  // favicon / icon links
  const icons = Array.from(document.querySelectorAll('link[rel~="icon"][href][integrity]'))
  for (const it of icons) {
    const el = it as HTMLLinkElement
    const integrity = el.getAttribute('integrity') || undefined
    out.push({ el, url: el.href, integrity })
  }
  return out
}
