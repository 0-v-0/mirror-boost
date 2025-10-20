import { defineConfig, presetAttributify, presetMini } from 'unocss'
//import directives from '@unocss/transformer-directives'
import { presetDaisy } from 'unocss-preset-daisyui-next'

export default defineConfig({
	//mode: 'shadow-dom',
	content: {
		filesystem: ['public/*.html'],
	},
	preflights: [],
	presets: [
		presetAttributify(),
		presetMini({
			dark: 'media',
			preflight: 'on-demand',
			variablePrefix: 'u-',
		}),
		presetDaisy({
			base: false,
			themes: false,
			utils: true,
			//variablePrefix: 'u-',
		})
	],
	transformers: [
		//directives({ applyVariable: ['--uno'] })
	]
})
