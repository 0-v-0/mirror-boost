// popup.ts - minimal logic to request timing data from the active tab and render

function el(id: string) { return document.getElementById(id)! }

const statusEl = el('status')
const listEl = el('list')
const openExtEl = el('openExt')

openExtEl?.addEventListener('click', (e) => {
    e.preventDefault()
    // open options page
    chrome.runtime.openOptionsPage?.()
})

function colorForMs(ms: number) {
    if (ms <= 200) return '#28a745' // green
    if (ms <= 500) return '#ffc107' // yellow
    if (ms <= 1000) return '#ff8c00' // orange
    return '#dc3545' // red
}

type ResourceStat = {
    sum: number
    count: number
}

type PopupData = Record<string, ResourceStat>

function render(data: PopupData) {
    listEl.innerHTML = ''
    if (Object.keys(data).length === 0) {
        statusEl.textContent = '无数据'
        return
    }
    statusEl.textContent = ''
    for (const t of ['css', 'js', 'image']) {
        const item = data[t]
        if (!item) {
            // show no data row
            const row = document.createElement('div')
            row.className = 'resource-row'
            row.innerHTML = `<div class="resource-left"><span class="color-dot" style="background:#ddd"></span><div><div class="resource-type">${t.toUpperCase()}</div><div class="small">无成功加载条目</div></div></div>`
            listEl.appendChild(row)
            continue
        }
        const row = document.createElement('div')
        row.className = 'resource-row'
        const avg = Math.round(item.sum / item.count)
        const c = colorForMs(avg)
        row.innerHTML = `<div class="resource-left"><span class="color-dot" style="background:${c}"></span><div><div class="resource-type">${t.toUpperCase()}</div><div class="small">${avg} ms — ${item.count} 条</div></div></div><div class="resource-right"><div class="small">${avg} ms</div></div>`
        listEl.appendChild(row)
    }
}

function requestData() {
    if (!statusEl || !listEl) return
    statusEl.textContent = '加载中…'
    listEl.innerHTML = ''
    // query active tab and send message
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs?.[0]) {
            statusEl.textContent = '无活动页面'
            return
        }
        chrome.tabs.sendMessage(tabs[0].id as number, { type: 'get_resource_timing' }, (resp?: PopupData) => {
            if (chrome.runtime.lastError) {
                statusEl.textContent = '无法获取页面时序\n' + chrome.runtime.lastError.message
                return
            }
            if (resp) {
                render(resp)
            }
        })
    })
}

el('refresh').addEventListener('click', requestData)

// on open
requestData()
