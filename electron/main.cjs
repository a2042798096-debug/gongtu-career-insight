const { app, BrowserWindow, Menu, session, shell } = require("electron");
const path = require("node:path");

const APP_FILE = path.join(__dirname, "..", "index.html");

function isSafeExternalUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function openExternalSafely(rawUrl) {
  if (isSafeExternalUrl(rawUrl)) shell.openExternal(rawUrl);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 960,
    minHeight: 680,
    backgroundColor: "#f2f1ed",
    icon: path.join(__dirname, "..", "assets", "icon.png"),
    autoHideMenuBar: true,
    show: false,
    title: "工途 · 本科专业就业深析",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      spellcheck: false,
      devTools: !app.isPackaged
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    openExternalSafely(url);
    return { action: "deny" };
  });

  win.webContents.on("will-navigate", (event, url) => {
    if (url !== win.webContents.getURL()) {
      event.preventDefault();
      openExternalSafely(url);
    }
  });

  win.webContents.on("will-attach-webview", (event) => event.preventDefault());
  win.once("ready-to-show", () => win.show());
  win.loadFile(APP_FILE);
}

app.commandLine.appendSwitch("disable-features", "HardwareMediaKeyHandling");

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);

  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });

  session.defaultSession.setPermissionCheckHandler(() => false);

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "X-Content-Type-Options": ["nosniff"],
        "Referrer-Policy": ["no-referrer"],
        "Cross-Origin-Opener-Policy": ["same-origin"]
      }
    });
  });

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
