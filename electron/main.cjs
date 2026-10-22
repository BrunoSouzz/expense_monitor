const { app, BrowserWindow, Menu, shell } = require('electron')
const { spawn } = require('node:child_process')
const { existsSync } = require('node:fs')
const path = require('node:path')
const http = require('node:http')

const apiPort = 8000
let apiProcess
let isQuitting = false
let mainWindow = null

// Trava de instância única (igual ao Discord: impede abrir duas vezes e foca na janela aberta)
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

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
      ELECTRON_RUN_AS_NODE: '1',
      PORT: String(apiPort),
      EXPENSE_MONITOR_DATA_DIR: path.join(app.getPath('userData'), 'data'),
    },
    stdio: 'ignore',
    windowsHide: true,
  })
  
  apiProcess.once('error', (error) => {
    if (!isQuitting) {
      console.error('Erro no processo da API:', error)
    }
  })
}

function waitForApi(attempts = 50) {
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
      if (attempts <= 0) return reject(new Error('A API interna não iniciou a tempo.'))
      attempts -= 1
      setTimeout(check, 200)
    }
    check()
  })
}

async function createWindow() {
  startApi()
  await waitForApi()

  // Remove a barra de menus padrão de navegador (File, Edit, etc) estilo Discord
  Menu.setApplicationMenu(null)

  const iconPath = path.join(__dirname, '..', 'monitor_interface', 'public', 'expense-mark.svg')

  mainWindow = new BrowserWindow({
    title: 'Expense Monitor',
    width: 1300,
    height: 840,
    minWidth: 980,
    minHeight: 660,
    backgroundColor: '#fdfbf7',
    show: false, // Inicia oculto para evitar flash branco (aparece suavemente quando pronto)
    autoHideMenuBar: true,
    icon: existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  })

  // Exibe a janela assim que estiver renderizada
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // Links externos abrem no navegador padrão do usuário em vez de navegar para fora do app
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  const indexPath = getProjectPath('monitor_interface', 'dist', 'index.html')
  await mainWindow.loadFile(indexPath)
}

app.whenReady().then(async () => {
  try {
    await createWindow()
  } catch (error) {
    console.error('Falha ao inicializar aplicativo:', error)
    app.quit()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  isQuitting = true
  if (apiProcess && !apiProcess.killed) {
    try {
      apiProcess.kill()
    } catch {
      // Processo já finalizado
    }
  }
})
