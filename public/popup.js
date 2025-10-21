// popup.js - minimal logic to request timing data from the active tab and render

function el(id){return document.getElementById(id)}

const status = el('status')
const list = el('list')
const refreshBtn = el('refresh')
const openExt = el('openExt')

openExt.addEventListener('click', (e)=>{
  e.preventDefault()
  // open options page
  chrome.runtime.openOptionsPage?.()
})

function colorForMs(ms){
  if (ms <= 200) return '#28a745' // green
  if (ms <= 500) return '#ffc107' // yellow
  if (ms <= 1000) return '#ff8c00' // orange
  return '#dc3545' // red
}

function render(data){
  list.innerHTML = ''
  if (!data || !data.types || Object.keys(data.types).length===0){
    status.textContent = '无数据'
    return
  }
  status.textContent = ''
  for (const t of ['css','js','image']){
    const item = data.types[t]
    if (!item){
      // show no data row
      const row = document.createElement('div')
      row.className = 'resource-row'
      row.innerHTML = `<div class="resource-left"><span class="color-dot" style="background:#ddd"></span><div><div class="resource-type">${t.toUpperCase()}</div><div class="small">无成功加载条目</div></div></div>`
      list.appendChild(row)
      continue
    }
    const row = document.createElement('div')
    row.className = 'resource-row'
    const c = colorForMs(item.avg)
    row.innerHTML = `<div class="resource-left"><span class="color-dot" style="background:${c}"></span><div><div class="resource-type">${t.toUpperCase()}</div><div class="small">${Math.round(item.avg)} ms — ${item.count} 条</div></div></div><div class="resource-right"><div class="small">${Math.round(item.avg)} ms</div></div>`
    list.appendChild(row)
  }
}

function requestData(){
  status.textContent = '加载中…'
  list.innerHTML = ''
  // query active tab and send message
  chrome.tabs.query({active:true,currentWindow:true}, (tabs)=>{
    if (!tabs || !tabs[0]){ status.textContent='无活动页面'; return }
    chrome.tabs.sendMessage(tabs[0].id, {type:'get_resource_timing'}, (resp)=>{
      if (chrome.runtime.lastError){
        status.textContent = '无法获取页面时序（content script 未注入或页面不支持）'
        return
      }
      render(resp)
    })
  })
}

refreshBtn.addEventListener('click', requestData)

// on open
requestData()
