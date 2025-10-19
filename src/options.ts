import 'uno.css'
import { error, success } from '@cydon/ui/Message'
import '@cydon/ui/src/c-message.css'

const DEFAULT = {
	settings: {
		thresholdMs: 300,
		minSampleCount: 3,
		enableLogging: false,
		writeBatchMs: 30_000,
	},
	mirrors: [],
}

function qs(id) { return document.getElementById(id) }

async function load() {
	const data = await new Promise((res) => {
		if (!chrome?.storage?.local) return res({})
		chrome.storage.local.get(['settings', 'mirrors'], (items) => res(items || {}))
	})

	const settings = data.settings || DEFAULT.settings
	const mirrors = Array.isArray(data.mirrors) ? data.mirrors : DEFAULT.mirrors

	qs('thresholdMs').value = settings.thresholdMs ?? DEFAULT.settings.thresholdMs
	qs('minSampleCount').value = settings.minSampleCount ?? DEFAULT.settings.minSampleCount
	qs('mirrors').value = mirrors.join('\n')
}

async function save() {
	const threshold = Number(qs('thresholdMs').value) || DEFAULT.settings.thresholdMs
	const minSamples = Math.max(1, Math.floor(Number(qs('minSampleCount').value) || DEFAULT.settings.minSampleCount))
	const mirrorsText = qs('mirrors').value.trim()
	const mirrors = mirrorsText ? mirrorsText.split('\n').map(s => s.trim()).filter(Boolean) : []

	const payload = {
		settings: {
			thresholdMs: threshold,
			minSampleCount: minSamples,
			enableLogging: DEFAULT.settings.enableLogging,
			writeBatchMs: DEFAULT.settings.writeBatchMs,
		},
		mirrors,
	}

	await new Promise<void>((resolve) => {
		if (!chrome?.storage?.local) return resolve()
		chrome.storage.local.set(payload, () => resolve())
	})

	success('已保存')
}

async function resetDefaults() {
	await new Promise<void>((res) => {
		if (!chrome?.storage?.local) return res()
		chrome.storage.local.set(DEFAULT, () => res())
	})
	await load()
	success('已重置为默认')
}

function exportJson() {
	const obj = {
		v: 1,
		data: {
			settings: {
				thresholdMs: Number(qs('thresholdMs').value) || DEFAULT.settings.thresholdMs,
				minSampleCount: Number(qs('minSampleCount').value) || DEFAULT.settings.minSampleCount,
			},
			mirrors: qs('mirrors').value.split('\n').map(s => s.trim()).filter(Boolean),
		}
	}
	const json = JSON.stringify(obj)
	const blob = new Blob([json], { type: 'application/json' })
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url
	a.download = 'mirrorboost-config.json'
	a.click()
	URL.revokeObjectURL(url)
}

function handleImportFile(file) {
	const reader = new FileReader()
	reader.onload = async () => {
		try {
			const parsed = JSON.parse(reader.result)
			if (!parsed || !parsed.data) throw new Error('invalid format')
			const { settings, mirrors } = parsed.data
			// basic validation
			if (settings) {
				qs('thresholdMs').value = Number(settings.thresholdMs) || DEFAULT.settings.thresholdMs
				qs('minSampleCount').value = Number(settings.minSampleCount) || DEFAULT.settings.minSampleCount
			}
			if (Array.isArray(mirrors)) {
				qs('mirrors').value = mirrors.join('\n')
			}
			await save()
			success('导入并保存成功')
		} catch {
			error('导入失败: 无效的JSON')
		}
	}
	reader.readAsText(file)
}

function init() {
	qs('saveBtn').addEventListener('click', () => save())
	qs('resetBtn').addEventListener('click', () => resetDefaults())
	qs('exportBtn').addEventListener('click', () => exportJson())
	qs('importBtn').addEventListener('click', () => qs('importInput').click())

	qs('importInput').addEventListener('change', (e) => {
		const f = e.target.files[0]
		if (f) handleImportFile(f)
		e.target.value = ''
	})

	load()
}

document.addEventListener('DOMContentLoaded', init)

export default {}
