'use strict'

const electron = require('electron')
const app = electron.app ? electron.app : electron.remote.app
const path = require('path')
const json = require('./package.json')

const dialog = electron.dialog
const iconPath = path.resolve(__dirname, './res/app.png')

exports.handleError = function (error, extra, isShowError) {
   console.log('err', error, extra);
  // if (typeof extra === "boolean") {
  //   isShowError = extra
  //   extra = {}
  // }
  //
  // // Handle the error
  // try {
  //   ravenClient.captureError(error, {
  //     extra: extra || {},
  //     tags: {
  //       version: json.version
  //     }
  //   })
  // } catch (err) {
  //   console.log('Raven error', err)
  // }
  //
  // if (isShowError) exports.showError(error)
}

exports.showError = function (error) {
  dialog.showErrorBox(app.__('main.UncaughtException.Title'), [
    error.toString(),
    "\n",
    app.__('main.UncaughtException.Content'),
    app.__('main.UncaughtException.Website') + ": http://www.rongcloud.cn",
    app.__('main.UncaughtException.Email') + ": support@rongcloud.cn"
  ].join("\n"))
}

exports.showSave = function (win) {
  var savePath = dialog.showSaveDialog(win, {
    title: '存储为',
    defaultPath: path.join(app.getPath('downloads'), '123.zip'),
    filters: [
      { name: 'All Files', extensions: ['*'] }
      // { name: 'HTML Files', extensions: ['html'] }
    ]
  })
  return savePath;
}

exports.showMessage = function (type, message, title, detail) {
  dialog.showMessageBox({
    type: type,
    buttons: ['OK'],
    icon: iconPath,
    message: message,
    title: title,
    detail: detail
  })
}

exports.showMessageBox = function (params, callback) {
  dialog.showMessageBox({
    type: params.type,
    buttons: ['OK'],
    icon: iconPath,
    message: params.message,
    title: params.title,
    detail: params.detail
  }, callback)
}


exports.getNameByUrl = function (field, url) {
    var href = url ? url : window.location.href;
    var reg = new RegExp( '[?&]' + field + '=([^&#]*)', 'i' );
    var string = reg.exec(href);
    return string ? decodeURIComponent(decodeURIComponent(string[1])) : null;
}

exports.getDirByUrl = function (url) {
  var re = /([\w\d_-]*)\.?[^\\\/]*$/i;
  return url.match(re)[1];
}

exports.getSavePath = function (url) {
  url = decodeURIComponent(url);
  var fileName = this.getNameByUrl('attname', url) || '';
  var savePath = path.join(this.getDirByUrl(url), fileName);
  return savePath;
}
