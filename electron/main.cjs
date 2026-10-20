const { app, BrowserWindow } = require('electron')
const { spawn } = require('node:child_process')
const { existsSync } = require('node:fs')
const path = require('node:path')
const http = require('node:http')

const apiPort = 8000
let apiProcess
let isQuitting = false

function getProjectPath(...segments) {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'app', ...segments)
    : path.join(__dirname, '..', ...segments)
}

function startApi() {
  const apiEntry = getProjectPath('monitor_api', 'server.js')
  if (!existsSync(apiEntry)) throw new Error(`API não encontrada em ${apiEntry}`)

  const nodeExecutable = app.isPackaged ? process.execPath : process.env.NODE || 'node'
  const nodeArguments = app.isPackaged ? ['--runAsNode', apiEntry] : [apiEntry]
  apiProcess = spawn(nodeExecutable, nodeArguments, {
    cwd: app.getPath('userData'),
    env: {
      ...process.env,
      PORT: String(apiPort),
      EXPENSE_MONITOR_DATA_DIR: path.join(app.getPath('userData'), 'data'),
    },
    stdio: 'ignore',
    windowsHide: true,
  })
  apiProcess.once('error', (error) => {
    if (!isQuitting) throw error
  })
}

function waitForApi(attempts = 40) {
  return new Promise((resolve, reject) => {
    const check = () => {
      const request = http.get(`http://127.0.0.1:${apiPort}/health`, (response) => {
        response.resume()
        if (response.statusCode === 200) return resolve()
        retry()
      })
      request.on('error', retry)
      request.setTimeout(500, () => {
        request.destroy()
        retry()
      })
    }
    const retry = () => {
      if (attempts <= 0) return reject(new Error('A API não iniciou a tempo.'))
      attempts -= 1
      setTimeout(check, 250)
    }
    check()
  })
}

async function createWindow() {
  startApi()
  await waitForApi()
  const window = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#fdfbf7',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  await window.loadFile(getProjectPath('monitor_interface', 'dist', 'index.html'))
}

app.whenReady().then(async () => {
  try {
    await createWindow()
  } catch (error) {
    console.error(error)
    app.quit()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  isQuitting = true
  if (apiProcess && !apiProcess.killed) apiProcess.kill()
})
