import express from 'express'
import cors from 'cors'
import { existsSync, readFileSync } from 'fs'
import http from 'http'
import https from 'https'
import { networkInterfaces } from 'os'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { DB_PATH } from './db.js'
import authRoutes from './routes/auth.js'
import dataRoutes from './routes/data.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT) || 3847
const DIST_DIR = join(__dirname, '..', 'dist')
const CERT_DIR = join(__dirname, '..', 'certs')
const CERT_PATH = process.env.SSL_CERT ?? join(CERT_DIR, 'cert.pem')
const KEY_PATH = process.env.SSL_KEY ?? join(CERT_DIR, 'key.pem')
const USE_HTTPS =
  process.env.HTTPS === '1' || (existsSync(CERT_PATH) && existsSync(KEY_PATH))

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, db: DB_PATH })
})

app.use('/api/auth', authRoutes)
app.use('/api', dataRoutes)

if (existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR))
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(join(DIST_DIR, 'index.html'))
  })
}

function getLocalIp(): string | null {
  for (const nets of Object.values(networkInterfaces())) {
    for (const net of nets ?? []) {
      if (net.family === 'IPv4' && !net.internal) return net.address
    }
  }
  return null
}

function onListen(): void {
  const proto = USE_HTTPS ? 'https' : 'http'
  console.log(`FitnessPal server running on ${proto}://127.0.0.1:${PORT}`)
  const ip = getLocalIp()
  if (ip) console.log(`  Phone (same Wi-Fi): ${proto}://${ip}:${PORT}`)
  console.log(`SQLite database: ${DB_PATH}`)
  if (USE_HTTPS) {
    console.log('HTTPS enabled — camera and Add to Home Screen work on mobile.')
  }
}

function bindErrorHandler(server: http.Server | https.Server): void {
  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `Port ${PORT} is already in use (another app may be running). Stop it or run with PORT=<free-port>.`,
      )
      process.exit(1)
    }
    throw err
  })
}

if (USE_HTTPS) {
  if (!existsSync(CERT_PATH) || !existsSync(KEY_PATH)) {
    console.error('HTTPS requested but certificates are missing.')
    console.error('Run:  npm run phone:setup')
    process.exit(1)
  }
  const server = https.createServer(
    {
      cert: readFileSync(CERT_PATH),
      key: readFileSync(KEY_PATH),
    },
    app,
  )
  bindErrorHandler(server)
  server.listen(PORT, '0.0.0.0', onListen)
} else {
  const server = app.listen(PORT, '0.0.0.0', onListen)
  bindErrorHandler(server)
}
