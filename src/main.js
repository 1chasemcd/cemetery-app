const { app, BrowserWindow, screen, Menu} = require('electron');


// 76780 Blue Mountain School Road Cottage Grove Oregon
function createWindow () {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize

    const win = new BrowserWindow({
        width: width,
        height: height,
        minHeight: 300,
        minWidth: 365,
        webPreferences: {
            nodeIntegration: true
        }
    });

    win.loadFile('./src/index.html');

    const isMac = process.platform === 'darwin'

    const template = [
    // { role: 'appMenu' }
    ...(isMac ? [{
        label: app.name,
        submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
        ]
    }] : []),
    // { role: 'fileMenu' }
    {
        label: 'File',
        submenu: [
            {
                label: 'New Entry', 
                accelerator: isMac ? 'Cmd+N' : 'Ctrl+N',
                click() {
                    win.webContents.send('menu-action', 'show-add-window')
                }
            },
            isMac ? { role: 'close' } : { role: 'quit' }
        ]
    },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' },
    ]

    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});