const ipc = require("electron").ipcRenderer;

document.addEventListener("DOMContentLoaded", function (event) {
  ipc.on("clear", function (event, response) {
    console.log("????");
    document.getElementById("q").value = "";
  });
  document.getElementById("q").addEventListener("keypress", function (event) {
    var keyCode = event.keyCode;
    // console.log(keyCode);
    if (keyCode == 13) {
      ipc.send("processQuery", document.getElementById("q").value);
      // processQuery(document.getElementById("q").value);
    }
  });
  document.getElementById("q").addEventListener("keydown", function (event) {
    var keyCode = event.keyCode;
    // console.log(keyCode);
    if (keyCode == 27) {
      ipc.send("invokeAction", "escape");
    } else if (keyCode == 38) {
      ipc.send("invokeAction", "up");
    } else if (keyCode == 40) {
      ipc.send("invokeAction", "down");
    } else if (keyCode == 37) {
      ipc.send("invokeAction", "left");
    } else if (keyCode == 39) {
      ipc.send("invokeAction", "right");
    }
  });
});
