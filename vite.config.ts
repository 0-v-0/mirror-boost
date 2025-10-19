import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
	build: {
		target: 'es2020',
		lib: {
			entry: path.resolve(__dirname, 'src/index.ts'),
			name: 'mirrorBoost',
			formats: ['es'],
			fileName: (format) => `mirror-boost.${format}.js`,
		},
		rollupOptions: {
			// make sure to externalize deps that shouldn't be bundled
			external: [],
		},
		outDir: 'dist',
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, 'src'),
		},
	},
})
