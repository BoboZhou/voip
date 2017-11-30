const {
    ipcRenderer,
    remote
} = require('electron');
const BrowserWindow = remote.BrowserWindow
// const i18n = require("i18n")
var locale = {};
const path = require('path')
const fs = require('fs')
const mime = require('mime')
const Regex = require("regex")
const currentWindow = remote.getCurrentWindow()
const mac = require('getmac')
// const MenuHandler = require('../handlers/menu');
var macAddress = null
//以下为 新版模块化代码
var screenShot = require('../modules/screenshot/screenshot.render.js')
var rongLib = require('../modules/ronglib/ronglib.render.js')
var downloadExtra = require('../modules/download_extra/download.render.js')
//以上为 新版模块化代码
const platform = {
    OSX: process.platform === 'darwin',
    Windows: process.platform === 'win32'
}
var appInfo, configInfo
try {
    appInfo = remote.require('./package.json')
} catch (err) {
    appInfo = null
}
try {
    configInfo = remote.require('./config.js')
} catch (err) {
    configInfo = null
}
const downloadSavePath = remote.app.getPath('downloads') + '/' + configInfo.PACKAGE.AUTHOR;
const Utils = remote.require('./utils.js')
var sharedObj = remote.getGlobal('sharedObj');
var sharedLocale = remote.getGlobal('locale');
var screencapture = null;
screencapture = sharedObj ? sharedObj.appCapture : screencapture;
ipcRenderer.setMaxListeners(0)
console.log('todo: utils.locale');
mac.getMac(function(err, mac) {
    if (err) throw err
    macAddress = mac;
})
/*i18n.configure({
    locales: ['en', 'zh-CN'],
    directory: __dirname + '/../locales',
    objectNotation: true,
    register: remote.app
});*/
window.RongDesktop = {
    setCallback: screenShot.setCallback,
    screenShot: screenShot.takeScreenshot,
    addon: rongLib.RongIMClient,
    system: {
        setLanguage: setLanguage,
    },
    download: {
        download: downloadExtra.download,
        pause: downloadExtra.pause,
        resume: downloadExtra.resume,
        cancel: downloadExtra.cancel,
    },
    window: {
        max: function() {
            currentWindow.maximize();
        },
        unmax: function() {
            currentWindow.unmaximize();
        },
        min: function() {
            currentWindow.minimize();
        },
        restore: function() {
            currentWindow.restore();
        },
        close: function() {
            currentWindow.close();
        },
        focus: function() {
            currentWindow.focus();
        },
        hide: function() {
            currentWindow.hide();
        },
        show: function() {
            currentWindow.show();
        }
    }
}
window.Electron = {
    ipcRenderer: ipcRenderer,
    // appInfo: appInfo,
    addon: rongLib.RongIMClient,
    configInfo: configInfo,
    require: require,
    remote: remote,
    //updateBadgeNumber为做兼容多加一个参数
    updateBadgeNumber: function(unreadCount, showCount) {
        // console.log('updateBadgeNumber')
        ipcRenderer.send('unread-message-count-changed', unreadCount, showCount)
    },
    toggleScreenShortcut: function(enabled) {
        ipcRenderer.send('toggle-screenshot-shortcut', enabled)
    },
    logout: function() {
        //修改图标
        ipcRenderer.send('logout')
    },
    displayBalloon: function(title, options) {
        if (platform.Windows) {
            ipcRenderer.send('display-balloon', title, options)
        }
    },
    openFile: function(path) {
        // var savePath = this.chkFileExists(url);
        if (remote.shell) {
            remote.shell.openItem(path);
        }
    },
    openFileDir: function(path) {
        // var savePath = this.chkFileExists(url);
        if (remote.shell) {
            remote.shell.showItemInFolder(path);
        }
    },
    chkFileExists: function(url) {
        if (!url || url == '') {
            return '';
        }
        var savePath = url;
        if (validateURL(url)) {
            savePath = path.join(downloadSavePath, Utils.getSavePath(url));
        }
        var exist = fileExists(savePath);
        return exist ? savePath : '';
    },
    flashDock: function() {
        ipcRenderer.send('flash-dock')
    },
    shakeWindow: function(interval, time) {
        ipcRenderer.send('shake-window', interval, time)
    },
    // windows 截图的粘贴走 web 方法; 图片的粘贴走这里的方法
    // 当改方法返回空时视为截图粘贴,走 web 方法
    getPathsFromClip: function() {
        if (screencapture) {
            return screencapture.getFilePathFromClipboard()
        }
    },
    // windows 复制图片时无法获取图片信息,Electron 中需借助壳中模块实现
    // electron 中复制图片统一用这种方式
    // 仅在只复制一张图片时生效,多张图片或文件直接走 文件上传
    getImgByPath: function() {
        var clipboardPaths = this.getPathsFromClip();
        var _imgFile = null;
        var arrFiles = clipboardPaths.fileList;
        if (arrFiles.length > 1) {
            return _imgFile;
        }
        arrFiles.forEach(function(filePath, index) {
            var mimeType = mime.lookup(filePath);
            if (mimeType.match('^image/')) {
                _imgFile = getFileByPath(filePath);
            }
        });
        return _imgFile;
    },
    uploadFile: function() {
        if (typeof(uploadByElectron) == "undefined") {
            console.log('uploadByElectron do not exist');
            return
        }
        var clipboardPaths = this.getPathsFromClip();
        var arrFiles = clipboardPaths.fileList;
        arrFiles.forEach(function(filePath, index) {
            var exist = fileExists(filePath);
            if (!exist) {
                return
            }
            if (uploadByElectron && typeof(eval(uploadByElectron)) == "function") {
                var _file = getFileByPath(filePath);
                uploadByElectron(_file)
            }
        });
    },
    clearChromeCache: function() {
        ipcRenderer.send('clear-chrome-cache');
    },
    cancelDownload: function(url) {
        ipcRenderer.send('cancel-download', url);
    },
    focus: function() {
        currentWindow.focus();
    },
    getPlatform: function() {
        return process.platform;
    },
    getBlobByPath: function(localPath) {
        var exist = fileExists(localPath);
        if (exist) {
            return getFileByPath(localPath);
        }
        return null;
    },
    openCacheFolder: function() {
        var path = remote.app.getPath('userData');
        if (remote.shell) {
            remote.shell.showItemInFolder(path);
        }
    },
    enableVueDevtool: function(path) {
        if (configInfo.DEBUG) {
            BrowserWindow.addDevToolsExtension(path || configInfo.DEBUGOPTION.VUEPATH);
        }
    },
    showVoip: function() {
        ipcRenderer.send('showVoip');
    },
    downloadFile: function(url, name, messageId) {
        ipcRenderer.send('downloadFile', url, name, messageId);
    },
    showMessageBox: function(params, callback) {
        Utils.showMessageBox(params, callback);
    },
    system: {
        getLocale: function() {
            return remote.app.getLocale();
        },
        getDeviceId: function() {
            return macAddress;
        },
        getDbPath: function() {
            return remote.app.getPath('userData');
        }
    },
    Voip: {
        open: function(userid, locale) {
            ipcRenderer.send('openVoip', userid, locale);
        },
        IMRequest: function(params) {
            ipcRenderer.send('IMRequest', params);
        }
    }
}

function getFileByPath(filePath) {
    var file = null;
    var buffer = fs.readFileSync(filePath);
    var fileStat = fs.statSync(filePath);
    var fileInfo = {
        buffer: buffer, // use this Buffer instead of reading file
        name: path.basename(filePath), // optional when using `path`
        type: mime.lookup(filePath)
    };
    var blob = new window.Blob([fileInfo.buffer], {
        type: fileInfo.type
    });
    file = new window.File([blob], fileInfo.name, {
        type: fileInfo.type
    });
    return file;
}

function fileExists(filePath) {
    try {
        return fs.statSync(filePath)
            .isFile()
    } catch (err) {
        return false
    }
}

function validateURL(str) {
    // var urlRegex = new Regex("^(http|https|ftp)\://([a-zA-Z0-9\.\-]+(\:[a-zA-Z0-9\.&amp;%\$\-]+)*@)*((25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9])\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[0-9])|localhost|([a-zA-Z0-9\-]+\.)*[a-zA-Z0-9\-]+\.(com|edu|gov|int|mil|net|org|biz|arpa|info|name|pro|aero|coop|museum|[a-zA-Z]{2}))(\:[0-9]+)*(/($|[a-zA-Z0-9\.\,\?\'\\\+&amp;%\$#\=~_\-]+))*$");
    // var urlRegex = new Regex(/[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi);
    // return urlRegex.test(str);
    return str.startsWith('http');
}

function validateLocalPath(str) {
    var winRegex = /^[a-z]+\:(\/|\\){1,2}([\w\-]+\/|\\)+[\w\-]+\.[a-z]+$/i;
    var macRegex = '';
    return winRegex.test(str) || macRegex.test(str);
}

function setLanguage(lang) {
    /*if (lang === 'zh') {
        lang = 'zh-CN';
    }
    ipcRenderer.send('set-locale', lang);
    new MenuHandler()
        .create(sharedLocale);*/
}
window.Electron.ipcRenderer.on('logOutput', (event, msg) => {
    console.log('logOutput:', msg)
})
window.Electron.ipcRenderer.on('takeScreenshot', () => {
    if (window.RongDesktop.screenShot) {
        window.RongDesktop.screenShot();
    }
})
window.Electron.ipcRenderer.on('change-win-state', (event, state) => {
    RongIM.instance.isMaxWindow = state == 'maximize' ? true : false;
})
window.Electron.ipcRenderer.on('contextMenu', (event, params) => {
    const {
        selectionText,
        isEditable
    } = params.props;
    if (selectionText == '' && !isEditable) {
        return;
    }
    params.isEditable = isEditable;
    params.locale = locale;
    let menuTemplate  =  MenuHandler.showContextMenu(params);
})
window.Electron.ipcRenderer.on('enableScreenshot', (event, enabled) => { 
    MenuHandler.enableScreenshot(enabled);
})
// window.Electron.require('electron-cookies')
/* eslint-disable no-native-reassign, no-undef */
// Extend and replace the native notifications.
function checkWin7() {
    var sUserAgent = navigator.userAgent
    var isWin7 = sUserAgent.indexOf("Windows NT 6.1") > -1 || sUserAgent.indexOf("Windows 7") > -1
    return isWin7
}
const NativeNotification = Notification
Notification = function(title, options) {
    if (platform.OSX) {
        delete options.icon
    }
    const notification = new NativeNotification(title, options)
    // 消息提示均由app端调用Notification做,这里只处理win7情况(win7不支持Notification)
    notification.addEventListener('click', () => {
        // console.log('click')
        window.Electron.ipcRenderer.send('notification-click')
    })
    if (platform.Windows) {
        if (checkWin7() && title && options.body) {
            window.Electron.displayBalloon(title, options)
        }
    }
    return notification
}
Notification.prototype = NativeNotification.prototype
// Notification.permission = NativeNotification.permission
// Notification.permission = "granted"
Notification.requestPermission = NativeNotification.requestPermission.bind(Notification)
//如果加载本地页面后加载 web url,此处不延时会有问题,取不到值
setTimeout(function() {
    Notification.permission = NativeNotification.permission
}, 0)
/* eslint-enable no-native-reassign, no-undef */