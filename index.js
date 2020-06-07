const electron = require("electron");

const app = electron.app;

const BrowserWindow = electron.BrowserWindow;

const path = require("path");
const url = require("url");

const ipc = require("electron").ipcMain;
const AutoLaunch = require("auto-launch");
const { globalShortcut } = require("electron");

const ElectronSampleAppLauncher = new AutoLaunch({
  name: "Remindo",
});
let mainWindow;
let isQuitting = false;

const DATE_PHRASE_SPECIAL_WORDS = ["me", "to", "on"];
const scriptPath = `${__dirname}/add_reminder.applescript`;

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
  const nativeImage = require("electron").nativeImage;
  var image = nativeImage.createFromPath(__dirname + "/icon.icns");

  // image.setTemplateImage(true);
  mainWindow = new BrowserWindow({
    maxWidth: screenWidth,
    maxHeight: screenHeight,
    minHeight: screenHeight,
    minWidth: screenWidth,
    height: screenHeight,
    width: screenWidth,
    movable: false,
    center: true,
    transparent: true,
    frame: false,
    icon: __dirname + "/icon.icns",
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
  mainWindow.setAlwaysOnTop(true);
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
  globalShortcut.unregisterAll();
  createWindow();

  globalShortcut.register(`Control+Command+R`, async () => {
    if (!mainWindow.isVisible()) {
      mainWindow.focus();
      app.show();
    } else {
      app.hide();
    }
  });
  mainWindow.on("show", async () => {
    mainWindow.focus();
  });
  mainWindow.on("blur", async () => {
    app.hide();
  });
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

const chrono = require("chrono-node");
const moment = require("moment");
const applescript = require("applescript-promise");
// const osascript = require('node-osascript');

ipc.on("invokeAction", function (event, data) {
  // console.log(data);
  processActions(data);
});

ipc.on("processQuery", function (event, data) {
  if (data == "quit" || data == "exit") {
    app.exit(0);
  } else {
    console.log(data);
    if (data.includes("tmro")) {
      data = data.replace("tmro", "tomorrow");
    }
    const info = parsePharse(data);
    console.log("Given input -----");
    console.log(info);
    try {
      console.log(
        moment(`${info.startDate} ${info.startTime}`, "DD/MM/YYYY HH:mm")
      );
      console.log(`${info.startDate} ${info.startTime}`);
      console.log(moment());
      console.log();
      const time = moment(
        `${info.startDate} ${info.startTime}`,
        "DD/MM/YYYY HH:mm"
      );
      info.startDateTime = time.format("DD/MM/YYYY HH:mm");
      info.startDate = time.format("DD/MM/YYYY");
      console.log("Creating reminder at ---- ");
      console.log(info);
      applescript.default.execFile(scriptPath, Object.values(info));
      event.sender.send("clear", "");
    } catch (e) {
      console.log(e);
    }
  }
});

function clearPhrase(phrase) {
  const wordsToRemove = [...DATE_PHRASE_SPECIAL_WORDS];

  return phrase.split(" ").reduce((words, word) => {
    if (wordsToRemove.includes(word)) {
      wordsToRemove.splice(wordsToRemove.indexOf(word), 1);

      return `${words}`;
    }

    return `${words} ${word}`.trim();
  }, "");
}

function formatAMPM(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? "0" + minutes : minutes;
  var strTime = hours + ":" + minutes + " " + ampm;
  return strTime;
}

// eslint-disable-next-line import/prefer-default-export
function parsePharse(phrase) {
  const [parsedPhrase] = chrono.parse(phrase);

  if (!parsedPhrase) {
    return null;
  }

  const eventName = phrase.replace(parsedPhrase.text, "");

  const startDate =
    parsedPhrase.start &&
    moment(parsedPhrase.start.date()).format("DD/MM/YYYY-HH:mm").split("-");
  startDate[1] = formatAMPM(parsedPhrase.start.date()).toUpperCase();
  const endDate =
    parsedPhrase.end &&
    moment(parsedPhrase.end.date()).format("DD/MM/YYYY-HH:mm").split("-");

  return {
    name: clearPhrase(eventName),
    startDate: startDate && startDate[0],
    startTime: startDate && startDate[1],
    startDateTime: startDate[0] + " " + startDate[1],
    endDate: endDate && endDate[0],
    endTime: endDate && endDate[1],
  };
}

function processActions(data) {
  if (data == "escape") {
    app.hide();
  }
}
