import { app, BrowserWindow, Menu, dialog, session, shell } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createApp } from './app/api/app.js'

const here = path.dirname(fileURLToPath(import.meta.url))

// Uma janela só: abrir o programa de novo apenas traz a janela existente para frente.
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  await run()
}

async function run() {
  let backend = null
  let window = null
  let closing = false

  app.on('second-instance', () => {
    if (!window) return
    if (window.isMinimized()) window.restore()
    window.focus()
  })

  app.on('window-all-closed', () => app.quit())

  // Fecha o servidor e o banco antes de sair, para não deixar o SQLite no meio de uma escrita.
  app.on('before-quit', (event) => {
    if (closing || !backend) return
    event.preventDefault()
    closing = true
    backend.close().finally(() => app.quit())
  })

  await app.whenReady()

  try {
    // Os dados ficam na pasta do usuário (ex.: %APPDATA%\Expense Monitor\data), fora do programa,
    // então atualizar ou reinstalar o app não apaga nada.
    backend = createApp({
      dataDir: path.join(app.getPath('userData'), 'data'),
      staticDir: path.join(here, 'app', 'web'),
    })
    const port = await backend.listen(0) // porta livre, só em 127.0.0.1
    const origin = `http://127.0.0.1:${port}`

    session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false))

    Menu.setApplicationMenu(Menu.buildFromTemplate([
      { label: 'Editar', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] },
      { label: 'Exibir', submenu: [{ role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { type: 'separator' }, { role: 'togglefullscreen' }] },
    ]))

    window = new BrowserWindow({
      width: 1180,
      height: 820,
      minWidth: 380,
      minHeight: 560,
      show: false,
      autoHideMenuBar: true,
      backgroundColor: '#fdfbf7',
      title: 'Expense Monitor',
      icon: path.join(here, 'build', 'icon.png'),
      webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
    })

    window.once('ready-to-show', () => window.show())
    window.on('closed', () => { window = null })

    // O app só mostra a própria interface; links externos abrem no navegador do sistema.
    window.webContents.setWindowOpenHandler(({ url }) => {
      if (/^https?:\/\//i.test(url)) shell.openExternal(url)
      return { action: 'deny' }
    })
    window.webContents.on('will-navigate', (event, url) => {
      if (!url.startsWith(origin)) event.preventDefault()
    })

    await window.loadURL(origin)
  } catch (error) {
    dialog.showErrorBox('Não foi possível iniciar o Expense Monitor', String(error?.message ?? error))
    closing = true
    app.quit()
  }
}
