// content_timing.js - inject into pages, respond to messages to return aggregated resource timing

function getResourceType(entry){
  // try to map initiatorType / name to simple categories
  const t = (entry.initiatorType || '').toLowerCase()
  if (t === 'link' || t === 'css' || (entry.name && entry.name.match(/\.css(\?|$)/i))) return 'css'
  if (t === 'script' || (entry.name && entry.name.match(/\.js(\?|$)/i))) return 'js'
  // treat images and icons as image
  if (t === 'img' || t === 'image' || (entry.name && entry.name.match(/\.(png|jpg|jpeg|gif|svg|ico)(\?|$)/i))) return 'image'
  return null
}

function aggregateTimings(){
  const entries = performance.getEntriesByType('resource') || []
  const types = {}
  for (const e of entries){
    // consider only completed resources with transferSize > 0 or responseEnd > 0
    // transferSize might be 0 for cross-origin without timing-allow-origin; use responseEnd - startTime > 0
    const duration = (e.responseEnd && e.startTime) ? (e.responseEnd - e.startTime) : (e.duration || 0)
    if (!duration || duration <= 0) continue
    const rt = getResourceType(e)
    if (!rt) continue
    if (!types[rt]) types[rt] = {sum:0,count:0}
    types[rt].sum += duration
    types[rt].count += 1
  }
  const out = {types:{}}
  for (const k of Object.keys(types)){
    out.types[k] = {avg: types[k].sum / types[k].count, count: types[k].count}
  }
  return out
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'get_resource_timing'){
    try{
      const data = aggregateTimings()
      sendResponse(data)
    }catch(err){
      sendResponse({error: err.message})
    }
    return true
  }
})
