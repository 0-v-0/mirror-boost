#!/usr/bin/env node
import { createServer } from 'http'
import { existsSync, statSync, createReadStream } from 'fs'
import { resolve, join, extname } from 'path'

function parseArg(name, fallback) {
	const idx = process.argv.findIndex(a => a === `--${name}`)
	if (idx >= 0 && process.argv.length > idx + 1) return process.argv[idx + 1]
	return fallback
}

const port = parseInt(parseArg('port', process.env.PORT || '8000'), 10)
const delay = parseInt(parseArg('delay', process.env.DELAY || '2000'), 10)

const root = resolve(__dirname)

const mime = {
	'.html': 'text/html; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.js': 'application/javascript; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.ico': 'image/x-icon',
}

function safeJoin(base, target) {
	const resolved = resolve(base, '.' + target)
	if (!resolved.startsWith(base)) return null
	return resolved
}

const server = createServer((req, res) => {
	const url = decodeURIComponent(new URL(req.url, `http://localhost`).pathname)
	let filePath = safeJoin(root, url)
	if (!filePath) {
		res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' })
		res.end('Bad request')
		return
	}

	// default to index.html for directory
	try {
		const stat = existsSync(filePath) && statSync(filePath)
		if (stat && stat.isDirectory()) {
			filePath = join(filePath, 'index.html')
		}
	} catch (e) {
		// ignore
	}

	if (!existsSync(filePath) || !statSync(filePath).isFile()) {
		res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
		res.end('Not found')
		return
	}

	const ext = extname(filePath).toLowerCase()
	const type = mime[ext] || 'application/octet-stream'

	// introduce artificial delay
	setTimeout(() => {
		res.writeHead(200, { 'Content-Type': type })
		const stream = createReadStream(filePath)
		stream.pipe(res)
		stream.on('error', () => {
			res.writeHead(500)
			res.end('Server error')
		})
	}, delay)
})

server.listen(port, () => {
	console.log(`Slow static server running at http://localhost:${port}/ (root: ${root})`)
	console.log(`Respond delay: ${delay} ms`)
	console.log('Press Ctrl+C to stop')
})
