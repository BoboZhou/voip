'use strict'

/*eslint-env browser, node */
/*global Electron:false*/

// Support local cookies
Electron.require('electron-cookies')
delete Electron.require

function setStatus(status) {
    var loadFail = document.querySelector('#load-fail')

    switch (status) {
    case 0:
        loadFail.className = 'hide'
        break
    case -1:
        loadFail.className = ''
        break
    }
}

function setVersion() {
    // document.querySelector('#version').innerText = `${Electron.configInfo.PACKAGE.APPNAME} ${Electron.configInfo.PACKAGE.VERSION}`
}

function startApp() {
    if (!navigator.onLine) {
        setStatus(-1)
        return
    }

    setStatus(0)
    var config = Electron.configInfo;
    var appUrl = config.APP_HOST + config.APP_INDEX + '?r=' + Math.random()
    var Utils = Electron.remote.require('./utils')

    fetch(appUrl)
      .then(function (resp) {
        setStatus(1)
        if (!resp.ok) {
            let extra = {}
            Object.keys(resp).forEach(key => ['url', 'status', 'statusText', 'headers', 'bodyUsed', 'size', 'ok', 'timeout', 'json', 'text'].includes(key) && (extra[key] = resp[key]))
            Utils.handleError('Response is not ok', extra)
        }
        // TODO 带参数进入,截取参数 window.location.search
        window.location = appUrl;
      })
      .catch(function (err) {
        setStatus(-1)
        Utils.handleError(err)
      })
}

function bootstrap() {
    setVersion()
    document.querySelector('#retry').onclick = startApp
}

bootstrap()
startApp()

if (!navigator.onLine) {
    window.addEventListener('online', startApp)
}
