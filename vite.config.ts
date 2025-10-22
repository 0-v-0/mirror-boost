import { defineConfig } from 'vite'
import UnoCSS from 'unocss/vite'
import path from 'path'

export default defineConfig({
	build: {
		target: 'es2023',
		rollupOptions: {
			input: {
				options: path.resolve(__dirname, 'options.html'),
				popup: path.resolve(__dirname, 'popup.html'),
				background: path.resolve(__dirname, 'src/background.ts'),
				config: path.resolve(__dirname, 'config.ts'),
				index: path.resolve(__dirname, 'src/index.ts'),
				timing: path.resolve(__dirname, 'src/timing.ts'),
			},
			output: {
				format: 'es',
				assetFileNames: '[name][extname]',
				entryFileNames: '[name].js',
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
