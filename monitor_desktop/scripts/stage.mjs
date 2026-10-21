// Copia a API (monitor_api/src) e o front-end compilado (monitor_interface/dist)
// para monitor_desktop/app, que é o que entra no executável.
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const desktop = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const apiSource = path.join(desktop, '..', 'monitor_api', 'src')
const webSource = path.join(desktop, '..', 'monitor_interface', 'dist')
const target = path.join(desktop, 'app')

if (!existsSync(path.join(webSource, 'index.html'))) {
  console.error('Front-end não compilado. Rode "npm run build" em monitor_interface (ou use "npm run dist" aqui).')
  process.exit(1)
}

rmSync(target, { recursive: true, force: true })
mkdirSync(target, { recursive: true })
cpSync(apiSource, path.join(target, 'api'), { recursive: true })
cpSync(webSource, path.join(target, 'web'), { recursive: true })
console.log('Arquivos do app preparados em', target)
