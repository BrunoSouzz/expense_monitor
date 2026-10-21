import { createServer } from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import path from 'node:path'
import { openDatabase } from './db.js'
import { createStore } from './store.js'
import { isValidMonth, localDate } from './dates.js'
import { validateExpense, validateIncome } from './validation.js'

const DEV_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173']
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
}

const CONTENT_SECURITY_POLICY = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"

class HttpError extends Error {
  constructor(status, detail) {
    super(detail)
    this.status = status
  }
}

const hostName = (hostHeader) => hostHeader.replace(/:\d+$/, '').toLowerCase()

function sendJson(response, status, body) {
  if (body === undefined) {
    response.writeHead(status, { 'Cache-Control': 'no-store' })
    return response.end()
  }
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
  return response.end(JSON.stringify(body))
}

async function readJson(request, limit) {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > limit) throw new HttpError(413, 'Corpo da requisição muito grande.')
    chunks.push(chunk)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw new HttpError(400, 'JSON inválido.')
  }
}

/**
 * Cria a API. Nada escuta em rede até `listen()` ser chamado, e só em 127.0.0.1.
 *
 * - `dataDir`: pasta do banco SQLite.
 * - `staticDir`: (opcional) build do front-end, servido na mesma origem — sem CORS.
 * - `clock`: função que retorna a data de hoje (AAAA-MM-DD); injetável nos testes.
 */
export function createApp({ dataDir, staticDir = null, allowedOrigins = DEV_ORIGINS, clock = () => localDate(), maxBodyBytes = 64 * 1024 }) {
  const db = openDatabase(dataDir)
  const store = createStore(db, clock)
  const staticRoot = staticDir && existsSync(staticDir) ? path.resolve(staticDir) : null

  function serveStatic(request, response, pathname) {
    let relative
    try {
      relative = decodeURIComponent(pathname)
    } catch {
      throw new HttpError(400, 'Caminho inválido.')
    }
    if (relative.includes('\0')) throw new HttpError(400, 'Caminho inválido.')

    let file = path.join(staticRoot, path.normalize(relative))
    if (file !== staticRoot && !file.startsWith(staticRoot + path.sep)) throw new HttpError(403, 'Acesso negado.')
    if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, 'index.html')
    if (!existsSync(file)) {
      if (path.extname(relative)) throw new HttpError(404, 'Arquivo não encontrado.')
      file = path.join(staticRoot, 'index.html') // rota do front-end (SPA)
    }
    if (!existsSync(file)) throw new HttpError(404, 'Front-end não encontrado. Rode "npm run build" em monitor_interface.')

    const extension = path.extname(file).toLowerCase()
    const isHtml = extension === '.html'
    const headers = {
      'Content-Type': MIME_TYPES[extension] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': isHtml ? 'no-cache' : 'public, max-age=31536000, immutable',
    }
    if (isHtml) headers['Content-Security-Policy'] = CONTENT_SECURITY_POLICY
    response.writeHead(200, headers)
    if (request.method === 'HEAD') return response.end()
    return createReadStream(file).pipe(response)
  }

  async function handleApi(request, response, segments, searchParams) {
    const [, version, resource, id, extra] = segments
    if (version !== 'v1') throw new HttpError(404, 'Rota não encontrada.')
    const { method } = request
    const methodNotAllowed = (allowed) => {
      response.setHeader('Allow', allowed)
      throw new HttpError(405, 'Método não permitido.')
    }
    const monthFilter = () => {
      const month = searchParams.get('month')
      if (month === null) return undefined
      if (!isValidMonth(month)) throw new HttpError(400, 'Mês inválido. Use AAAA-MM.')
      return month
    }

    if (resource === 'summary' && !id) {
      if (method !== 'GET') return methodNotAllowed('GET')
      return sendJson(response, 200, store.summary(monthFilter()))
    }

    if (resource === 'recurring' && id === 'process' && !extra) {
      if (method !== 'POST') return methodNotAllowed('POST')
      return sendJson(response, 200, { processed: store.processRecurring() })
    }

    if (resource === 'expenses' && !extra) {
      if (!id) {
        if (method === 'GET') return sendJson(response, 200, store.listExpenses(monthFilter()))
        if (method === 'POST') {
          const { value, error } = validateExpense(await readJson(request, maxBodyBytes))
          if (error) throw new HttpError(400, error)
          return sendJson(response, 201, store.createExpense(value))
        }
        return methodNotAllowed('GET, POST')
      }
      if (method === 'PUT') {
        const { value, error } = validateExpense(await readJson(request, maxBodyBytes))
        if (error) throw new HttpError(400, error)
        const updated = store.updateExpense(id, value)
        if (!updated) throw new HttpError(404, 'Despesa não encontrada.')
        return sendJson(response, 200, updated)
      }
      if (method === 'DELETE') {
        if (!store.deleteExpense(id)) throw new HttpError(404, 'Despesa não encontrada.')
        return sendJson(response, 204)
      }
      return methodNotAllowed('PUT, DELETE')
    }

    if (resource === 'income' && !extra) {
      if (!id) {
        if (method === 'GET') return sendJson(response, 200, store.listIncome())
        if (method === 'POST') {
          const { value, error } = validateIncome(await readJson(request, maxBodyBytes), clock())
          if (error) throw new HttpError(400, error)
          return sendJson(response, 201, store.createIncome(value))
        }
        return methodNotAllowed('GET, POST')
      }
      if (method === 'PUT') {
        const { value, error } = validateIncome(await readJson(request, maxBodyBytes), clock())
        if (error) throw new HttpError(400, error)
        const updated = store.updateIncome(id, value)
        if (!updated) throw new HttpError(404, 'Entrada não encontrada.')
        return sendJson(response, 200, updated)
      }
      if (method === 'DELETE') {
        if (!store.deleteIncome(id)) throw new HttpError(404, 'Entrada não encontrada.')
        return sendJson(response, 204)
      }
      return methodNotAllowed('PUT, DELETE')
    }

    throw new HttpError(404, 'Rota não encontrada.')
  }

  async function handle(request, response) {
    const host = request.headers.host ?? ''
    // Barra DNS rebinding: uma página externa não consegue falar com a API por outro nome de host.
    if (!LOCAL_HOSTS.has(hostName(host))) throw new HttpError(403, 'Host não permitido.')

    const origin = request.headers.origin
    const sameOrigin = origin === `http://${host}`
    if (origin && !sameOrigin) {
      if (!allowedOrigins.includes(origin)) throw new HttpError(403, 'Origem não permitida.')
      response.setHeader('Access-Control-Allow-Origin', origin)
      response.setHeader('Vary', 'Origin')
    }

    if (request.method === 'OPTIONS') {
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
      response.setHeader('Access-Control-Max-Age', '600')
      return sendJson(response, 204)
    }

    const { pathname, searchParams } = new URL(request.url, 'http://localhost')

    // Exigir JSON nas escritas força o preflight de CORS e impede CSRF por formulário/text-plain.
    if (['POST', 'PUT'].includes(request.method) && pathname.startsWith('/api/')
      && !/^application\/json\b/i.test(request.headers['content-type'] ?? '')) {
      throw new HttpError(415, 'Use Content-Type: application/json.')
    }

    if (pathname === '/health' && request.method === 'GET') return sendJson(response, 200, { status: 'ok' })
    if (pathname.startsWith('/api/')) return handleApi(request, response, pathname.split('/').filter(Boolean), searchParams)
    if (staticRoot && ['GET', 'HEAD'].includes(request.method)) return serveStatic(request, response, pathname)
    throw new HttpError(404, 'Rota não encontrada.')
  }

  const server = createServer(async (request, response) => {
    try {
      await handle(request, response)
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500
      if (status === 500) console.error(error)
      if (status === 413) response.setHeader('Connection', 'close')
      if (response.headersSent) return response.destroy()
      sendJson(response, status, { detail: status === 500 ? 'Erro interno do servidor.' : error.message })
    }
  })

  return {
    server,
    db,
    store,
    listen: (port = 0, host = '127.0.0.1') => new Promise((resolve, reject) => {
      server.once('error', reject)
      server.listen(port, host, () => {
        server.off('error', reject)
        resolve(server.address().port)
      })
    }),
    close: () => new Promise((resolve) => {
      server.closeAllConnections?.()
      server.close(() => {
        db.close()
        resolve()
      })
    }),
  }
}
