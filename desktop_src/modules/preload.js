const {ipcRenderer} = require('electron')
var screenShot = require('./screenshot/screenshot.render.js')
var file = require('./screenshot/file.render.js')
var download = require('./download/download.render.js')
var downloadExtra = require('./download_extra/download.render.js')
var windowAction = require('./window/window.render.js')
window.RongDesktop = {
    screenShot: screenShot,
    download: download.download,
    cancelDownload: download.cancelDownload,
    getPathsFromClipboard: file.getPathsFromClipboard,
    getBlobsByPaths: file.getBlobsByPaths,
    shakeWindow: windowAction.shakeWindow,
    downloadExta: downloadExtra,
    downloadCallback: []
}

window.Electron = {
    ipcRenderer: ipcRenderer
}