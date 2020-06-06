const electron = require("electron");

const app = electron.app;

const BrowserWindow = electron.BrowserWindow;

const path = require("path");
const url = require("url");
const tray = require("./tray");
const AutoLaunch = require("auto-launch");
const { globalShortcut } = require("electron");
const {ipcMain} = require('electron')
const ElectronSampleAppLauncher = new AutoLaunch({
  name: "Remindo",
});
let mainWindow;
let isQuitting = false;

/*process.on('uncaughtException', (err) => {
  console.log('application almost crashed!', err);
});*/
try {
  const isAlreadyRunning = app.makeSingleInstance(() => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }

      mainWindow.webContents.on("did-finish-load", function () {
        setTimeout(function () {
          mainWindow.show();
        }, 60);
      });
    }
  });

  if (isAlreadyRunning) {
    app.quit();
  }
} catch (e) {}

function createWindow() {
  /*if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
  }*/

  const screenHeight = 50;
  const screenWidth = 600;
  const nativeImage = require('electron').nativeImage;
  var image = nativeImage.createFromPath(__dirname + '/icon.icns'); 

  // image.setTemplateImage(true);
  mainWindow = new BrowserWindow({
    maxWidth: screenWidth,
    maxHeight: screenHeight,
    minHeight: screenHeight,
    minWidth: screenWidth,
    height: screenHeight,
    width: screenWidth,
    frame: false,
    movable: false,
    center: true,
    icon: __dirname +  '/icon.icns'
  });
  app.dock.setIcon(image);
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "index.html"),
      protocol: "file:",
      slashes: true,
    })
  );
  // mainWindow.openDevTools();
  // mainWindow.setAlwaysOnTop(true);
  mainWindow.setMenuBarVisibility(false);
  ElectronSampleAppLauncher.enable();

  ElectronSampleAppLauncher.isEnabled()
    .then(function (isEnabled) {
      if (isEnabled) {
        return;
      }
      ElectronSampleAppLauncher.enable();
    })
    .catch(function (err) {});

  mainWindow.on("close", (e) => {
    if (!isQuitting) {
      e.preventDefault();

      if (process.platform === "darwin") {
        app.hide();
      } else {
        mainWindow.hide();
      }
    }
  });

  mainWindow.on("page-title-updated", (e) => {
    e.preventDefault();
    // tray.create(mainWindow);
  });

  return mainWindow;
}

app.on("ready", function () {
  /*setTimeout(() => {
    nonExistentFunc();
    console.log('more important stuff'); 
  }, 2000);*/
  globalShortcut.unregisterAll()
  createWindow();
  globalShortcut.register(`Control+Command+R`, async () => {
    if (!mainWindow.isVisible()) {
      mainWindow.show();
    } else {
      mainWindow.hide();
    }
  });
});

app.on('browser-window-blur', () => {
  mainWindow.hide();
})

ipcMain.on('asynchronous-message', (event, arg) => {
  console.log( arg );
  
  // send message to index.html
  event.sender.send('asynchronous-reply', 'hello' );
  });

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", function () {
  if (mainWindow === null) {
    createWindow();
  }
});
