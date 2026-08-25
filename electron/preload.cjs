const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("gongtuDesktop", Object.freeze({
  platform: process.platform,
  desktop: true
}));
