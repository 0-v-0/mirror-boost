import 'uno.css'
import { CydonElement, watch } from 'cydon'
import { error, success } from '@cydon/ui/Message'
import { Rule } from './types'
import { Message } from './util'
import '@cydon/ui/src/c-message.css'

type Options = typeof DEFAULT | undefined

const sendMsg = (msg: Message) => new Promise<any>((res, rej) => {
	chrome.runtime.sendMessage(msg, (resp) => {
		const err = chrome.runtime.lastError || resp?.error;
		if (err) return rej(err);
		res(resp);
	});
});
const getRules = async (): Promise<Rule[]> => (await sendMsg({ action: 'get_rules' }))?.rules || []
function load() {
	const cfg = new Promise<Options>((res) => {
		if (!chrome?.storage?.local) return res(void 0)
		chrome.storage.local.get(['settings'], async (items) => {
			const rules = await getRules()
			res({ ...items, rules: JSON.stringify(rules, null, 2) } as any)
		})
	})
	return cfg
}

class MbOptions extends CydonElement {
	inputFile!: HTMLInputElement

	thresholdMs!: number
	minSampleCount!: number
	enableLogging!: boolean
	writeBatchMs!: number
	rules!: string

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
			this.rules = cfg.rules
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
			rules: this.rules,
		}
		await chromeSet(payload)
	}

	async reset() {
		await chromeSet(DEFAULT)
		await load()
		success('已重置设置')
	}

	async clearData() {
		await sendMsg({ action: 'clear_db' })
		success('已清空统计数据')
	}

	async clearRules() {
		const rules = await getRules()
		if (rules.length) {
			console.log(`removing ${rules.length} rules`)
			await sendMsg({ action: 'update_rules', removeRuleIds: rules.map(r => r.id) })
		}
		this.rules = ''
		success('已清空所有规则')
	}

	exportJson() {
		const obj = {
			v: 1,
			data: {
				settings: {
					thresholdMs: this.thresholdMs,
					minSampleCount: this.minSampleCount,
				},
				rules: this.rules.split('\n').map(s => s.trim()).filter(Boolean),
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
					rules: data.rules,
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
