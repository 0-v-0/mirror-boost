import 'uno.css'
import { CydonElement, watch } from 'cydon'
import { error, success } from '@cydon/ui/Message'
import '@cydon/ui/src/c-message.css'

type Options = typeof DEFAULT | undefined
function load() {
	return new Promise<Options>((res) => {
		if (!chrome?.storage?.local) return res(void 0)
		chrome.storage.local.get(['settings', 'mirrors'], (items) => res(items as any))
	})
}

function parseUrls(text: string) {
	return text.trim().split('\n').map(s => s.trim()).filter(Boolean)
}

class MbOptions extends CydonElement {
	inputFile!: HTMLInputElement

	thresholdMs!: number
	minSampleCount!: number
	enableLogging!: boolean
	writeBatchMs!: number
	mirrors!: string

	async connectedCallback() {
		await this.load()
		watch(this, function () {
			this.save()
		})
		super.connectedCallback()
	}

	async load(cfg?: Options) {
		cfg ||= await load()
		if (cfg) {
			this.thresholdMs = cfg.settings?.thresholdMs ?? DEFAULT.settings.thresholdMs
			this.minSampleCount = cfg.settings?.minSampleCount ?? DEFAULT.settings.minSampleCount
			this.enableLogging = cfg.settings?.enableLogging ?? DEFAULT.settings.enableLogging
			this.writeBatchMs = cfg.settings?.writeBatchMs ?? DEFAULT.settings.writeBatchMs
			this.mirrors = Array.isArray(cfg.mirrors) ? cfg.mirrors.join('\n') : DEFAULT.mirrors.join('\n')
		}
	}

	async save() {
		const payload = {
			settings: {
				thresholdMs: this.thresholdMs,
				minSampleCount: Math.max(1, this.minSampleCount),
				enableLogging: this.enableLogging,
				writeBatchMs: this.writeBatchMs,
			},
			mirrors: parseUrls(this.mirrors),
		}
		await chromeSet(payload)
	}

	async reset() {
		await chromeSet(DEFAULT)
		await load()
		success('已重置为默认')
	}

	exportJson() {
		const obj = {
			v: 1,
			data: {
				settings: {
					thresholdMs: this.thresholdMs,
					minSampleCount: this.minSampleCount,
				},
				mirrors: this.mirrors.split('\n').map(s => s.trim()).filter(Boolean),
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
	handleImportFile(file: File) {
		const reader = new FileReader()
		reader.onload = async () => {
			try {
				const parsed = JSON.parse(reader.result as string,)
				const data = parsed?.data
				if (!data) throw new Error('invalid format')
				await this.load({
					settings: data.settings,
					mirrors: data.mirrors,
				})
				await this.save()
				success('导入并保存成功')
			} catch {
				error('导入失败: 无效的JSON')
			}
		}
		reader.readAsText(file)
	}

	importFile() {
		this.inputFile.click()
	}

	onChange(e: Event) {
		const f = (e.target as HTMLInputElement)?.files?.[0]
		if (f) this.handleImportFile(f)
	}
}
customElements.define('mb-options', MbOptions)
