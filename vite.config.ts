import { defineConfig } from 'vite'
import UnoCSS from 'unocss/vite'
import path from 'path'

export default defineConfig({
	build: {
		target: 'es2023',
		lib: {
			entry: path.resolve(__dirname, 'src/index.ts'),
			name: 'mirrorBoost',
			formats: ['es'],
			fileName: (_, entry) => `${entry}.js`,
		},
		rollupOptions: {
			input: {
				options: path.resolve(__dirname, 'options.html'),
				popup: path.resolve(__dirname, 'popup.html'),
				background: path.resolve(__dirname, 'src/background.ts'),
				config: path.resolve(__dirname, 'config.ts'),
				idle: path.resolve(__dirname, 'src/idle.ts'),
				index: path.resolve(__dirname, 'src/index.ts'),
				timing: path.resolve(__dirname, 'src/timing.ts'),
			},
		},
		modulePreload: false,
		outDir: 'dist',
	},
	plugins: [UnoCSS()],
	test: {
		includeSource: ['src/timing.ts'],
	},
	define: {
		'import.meta.vitest': 'undefined',
	},
})
