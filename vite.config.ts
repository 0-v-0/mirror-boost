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
				config: path.resolve(__dirname, 'config.ts'),
				index: path.resolve(__dirname, 'src/index.ts'),
			},
		},
		modulePreload: false,
		outDir: 'dist',
	},
	plugins: [UnoCSS()],
})
