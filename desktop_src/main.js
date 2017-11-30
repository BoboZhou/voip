'use strict'
const {
    app, BrowserWindow, globalShortcut, ipcMain,
    Tray, Menu, MenuItem, shell, crashReporter, clipboard, dialog
} = require('electron');
    
const path = require('path')
const fs = require('fs')
const jsonfile = require('jsonfile')
const i18n = require("i18n")
const url = require('url');
const Config = require('./config.js')
const Utils = require('./utils')
// const log = require('electron-log');
const mkdirp = require('mkdirp')
const request = require('request')
// const extract = require('extract-zip');

const initSize = {width: 1000, height: 640}
const platform = {
  Windows: /^win/i.test(process.platform),
  OSX: /^darwin/i.test(process.platform),
  Linux: /^linux/i.test(process.platform)
}

const logger = require('./common/logger');

const mime = require('mime')
// const logDir = path.resolve(app.getPath('userData'), 'logs');

let appMenu = null
let mainWindow = null
let forceQuit = false
let tray = null
let bounceID = undefined
let blink = null
let shake = null
let isManualClose = false
let myScreen = null
let qt = null
let appCapture = null
let downloadObject = {}
//url 参数,主要用于 protocal 带参数进入
let urlParam = ''
let lastError = null
let winVoip = null
let downloadPath = path.join(app.getPath('userData'), 'video')
let downloadListener = {}
let workAreaSize = null
let screenSize = null
let scaleFactor = 1
// console.log(app.getAppPath(), app.getPath('userData'));

var fileExists = (filePath) => {
    try
    {
        return fs.statSync(filePath).isFile()
    }
    catch (err)
    {
        return false
    }
}
// Load window bounds info from setting file. create an empty file when not exist
var loadWindowBounds = () => {
    let bounds = null
    let src = path.join(__dirname, 'settings.json')
    let dest = path.join(app.getPath('userData'), 'settings.json')

    try{
        if(fileExists(dest)){
            try{
                bounds = jsonfile.readFileSync(dest)
            }
            catch(err){
                bounds = {"x": 0, "y": 0, "width": 0, "height": 0}
            }
        }
        else{
            bounds = {"x": 0, "y": 0, "width": 0, "height": 0}
            fs.closeSync(fs.openSync(dest, 'w'));
        }
    }
    catch (err){
        Utils.showError(err)
    }
    return bounds
}

var saveWindowBounds = () => {
    let bounds = mainWindow.getBounds()
    jsonfile.writeFile(path.join(app.getPath('userData'), 'settings.json'), bounds)
}

var sendToWebContents = () => {
    'use strict';

    var wc = mainWindow.webContents;
    if (wc.loadFinished) {
        wc.send.apply(wc, arguments);
    }
};

var handleImage = (item) => {
    item.once('done', (event, state) => {
        if (state === 'completed') {
            var fileName = item.getFilename();
            if(fileName.indexOf('.') == -1){
                var filePath = item.getSavePath();
                fs.rename(filePath, filePath + '.png', function(err) {
                    if (err) {
                        logger.error('rename file error:' + filePath);
                    }
                });
            }
            console.log(item.getMimeType(), item.getFilename());
        } else {
            console.log(`Download failed: ${state}`)
        }
    })
}

var regShortCut = () => {
    if(globalShortcut.isRegistered('CTRL+F')){
        return;
    }
    globalShortcut.register('CTRL+F', searchFriend);
}

var unregShortCut = () => {
    if(globalShortcut.isRegistered('CTRL+F')){
        globalShortcut.unregister('CTRL+F');
    }
}

var initApp = () => {
    'use strict';

    // process.setMaxListeners(0)
    // require('events').EventEmitter.defaultMaxListeners = 0
    app.commandLine.appendSwitch('ignore-certificate-errors');
    app.commandLine.appendSwitch('remote-debugging-port', '48075');
    crashReporter.start({
        productName: Config.PACKAGE.PRODUCTNAME,
        companyName: Config.PACKAGE.AUTHOR,
        submitURL: `${Config.REPORT_URL}/post`,
        autoSubmit: true
    })

    if (platform.Windows) {
        app.setAppUserModelId(Config.APP_ID)
    }

    const {screen} = require('electron');
    workAreaSize = screen.getPrimaryDisplay().workAreaSize;
    screenSize = screen.getPrimaryDisplay().size;
    
    screen.on('display-metrics-changed', (event, display, changedMetrics) => {
        workAreaSize = display.workAreaSize;
        screenSize = display.size;
        // scaleFactor = display.scaleFactor;
    })

    var savedBounds = loadWindowBounds();
    var downloadSavePath = app.getPath('downloads') + '/' + Config.PACKAGE.AUTHOR;
    
    let winLocation = {
        x: savedBounds.x || (workAreaSize.width - initSize.width)/2,
        y: savedBounds.y || (workAreaSize.height - initSize.height)
    }
    
    // 以下代码用于在主显示器显示
    if(Config.ALWAYS_SHOW_IN_PRIMARY){
        let primaryDisplay = screen.getPrimaryDisplay()
        let savedDisplay = screen.getDisplayMatching(savedBounds);
        let saveInPrimary = savedDisplay.bounds.x === 0 && savedDisplay.bounds.y === 0
        winLocation.x = saveInPrimary ? savedBounds.x : primaryDisplay.bounds.x + 50
        winLocation.y = saveInPrimary ? savedBounds.y : primaryDisplay.bounds.y + 50
    }

    // Create the browser window.
    var windowConfig = {
        x: winLocation.x,
        y: winLocation.y,
        width: savedBounds.width || initSize.width,
        height: savedBounds.height || initSize.height,
        minWidth: 890,
        minHeight: 640,
        titleBarStyle: 'hidden',
        // icon: path.join(__dirname, 'res', Config.WINICON),
        title: Config.PACKAGE.APPNAME,
        show: false,
        frame: false,
        // alwaysOnTop: true,
        'webPreferences': {
            preload: path.join(__dirname, 'js', 'preload.js'),
            nodeIntegration: false,
            allowDisplayingInsecureContent: true,
            webSecurity: false,
            plugins: true
        }
    };
    if (platform.Linux) {
        windowConfig.icon = path.join(__dirname, 'res', Config.PACKAGE.LINUX.APPICON);
    }
    mainWindow = new BrowserWindow(windowConfig);

    // mainWindow.loadURL('https://yuhongda0315.github.io/martin-demo/voip/webrtc/index.html')
    mainWindow.loadURL("file://" + path.join(__dirname, 'index.html'), {"extraHeaders" : "pragma: no-cache\n"});
    // TODO 带参数进入,可直接登录
    // mainWindow.loadURL("file://" + path.join(__dirname, 'index.html?urlParam=' + urlParam));

    mainWindow.webContents.session.on('will-download', (event, item, webContents) => {
        let _url = item.getURL();
        let _parseUrl = url.parse(_url);
        let isImage = (item.getMimeType().indexOf('image/') > -1 || _parseUrl.hostname === 'rongcloud-image.ronghub.com');
        if(isImage){
            handleImage(item);
            // return;
        } 

        // let savePath = path.join(downloadSavePath, Utils.getSavePath(_url));
        let totalBytes = item.getTotalBytes();
        let callbackState;
        let params = {};
        downloadObject[_url] = item;
        // item.setSavePath(savePath);
        item.on('updated', (event, state) => {
            mainWindow.setProgressBar(item.getReceivedBytes() / totalBytes);
            callbackState = state
            if(state == 'interrupted'){
                callbackState = 'paused'
            }
            params = {
                url : _url, 
                state : callbackState, 
                progress : item.getReceivedBytes() / item.getTotalBytes() * 100, 
                localPath : item.getSavePath()
            }
            mainWindow.webContents.send('chDownloadProgress', params)
            // sendToWebContents('chDownloadProgress', _url, state, item.getReceivedBytes() / item.getTotalBytes() * 100);
            if (state === 'interrupted') {
                console.log('Download is interrupted but can be resumed')
            } else if (state === 'progressing') {
                if (item.isPaused()) {
                    console.log('Download is paused')
                } else {
                    // console.log(`Received bytes: ${item.getReceivedBytes()}`)
                }
            }
        })
        item.once('done', (event, state) => {
            if (!mainWindow.isDestroyed()) {
                mainWindow.setProgressBar(-1);
                // var downloadProgress = (state == 'completed' ? 100 : 0);
                // mainWindow.webContents.send('chDownloadState', _url, state, item.getSavePath())
                params = {
                    url : _url, 
                    state : state, 
                    progress : 100, 
                    localPath : item.getSavePath()
                }
                mainWindow.webContents.send('chDownloadProgress', params)

                // sendToWebContents('chDownloadState', _url, state, item.getSavePath());
            }
            if (state === 'completed') {
                // console.log(`getSavePaths: ${item.getSavePath()}`);  //这里可以得到另存为的路径
                // shell.openItem(savePath);
                console.log(item.getMimeType(), item.getFilename());
            } else {
                console.log(`Download failed: ${state}`)
            }
        })
    })

    mainWindow.on('close', (event) => {
        if (forceQuit) {
            if(blink){
                clearInterval(blink)
            }
            if(mainWindow && mainWindow.webContents){
                mainWindow.webContents.send('lougout')
            }
        } else {
            event.preventDefault()
            if (mainWindow.isFullScreen()) {
                mainWindow.setFullScreen(false)
            } else {
                mainWindow.hide()
            }
        }
    })

    mainWindow.on('closed', () => {
        mainWindow.removeAllListeners();
        mainWindow = null;
    })

    mainWindow.on('maximize', () => {
        mainWindow.webContents.send('change-win-state', 'maximize')
    })

    mainWindow.on('unmaximize', () => {
        mainWindow.webContents.send('change-win-state', 'unmaximize')
    })

    var webContents = mainWindow.webContents;

    webContents.on('dom-ready', () => {
        var cssfile = path.join(__dirname, 'res', 'browser_win.css');
        if (platform.OSX) {
            cssfile = path.join(__dirname, 'res', 'browser_mac.css');
        }
        webContents.insertCSS(fs.readFileSync(cssfile, 'utf8'));
        webContents.executeJavaScript(fs.readFileSync(path.join(__dirname, 'js', 'postload.js'), 'utf8'));
    })

    webContents.on('did-finish-load', () => {
        mainWindow.webContents.loadFinished = true;
        mainWindow.show();
    });

    webContents.on('new-window', (event, url) => {
        event.preventDefault()
        shell.openExternal(url)
    })

    webContents.on('devtools-opened', () => {
        unregShortCut();
    });

    webContents.on('devtools-closed', () => {
        regShortCut();
    });

    webContents.on('context-menu', (e, props) => {
        const { selectionText, isEditable } = props;
        if(selectionText == '' && !isEditable){
            return;
        }
        let menuTemplate = require('./js/menu_context')(i18n.getLocale(), isEditable)
        const contextMenu = Menu.buildFromTemplate(menuTemplate)
        contextMenu.popup(mainWindow);
    })
};

var getWinTopState = () => {
    if(mainWindow){
        return mainWindow.isAlwaysOnTop();
    } 
    logger.error('mainWindow lost, getWinTopState failed');
    return false;
};

var initTray = () => {
    let iconFile = platform.OSX ? Config.MAC.TRAY : Config.WIN.TRAY

    tray = new Tray(path.join(__dirname, 'res', iconFile))
    tray.setToolTip(Config.PACKAGE.PRODUCTNAME)
    tray.on('click', () => {
        if (mainWindow) {
            mainWindow.show()
        }
    })

    if (platform.Windows || platform.Linux) {
        const trayMenu = Menu.buildFromTemplate([{
            label: app.__('winTrayMenus.Open'),
            click () {
                if (mainWindow) {
                    mainWindow.show()
                }
            }
        }, 
        {
            label: app.__('winTrayMenus.BringFront'),
            type: 'checkbox',
            checked: getWinTopState() == true,
            click () {
                app.emit('menu.view.bringFront', !getWinTopState())
            }
        }, 
        // {
        //     label: app.__('winTrayMenus.CheckUpdate'),
        //     click () {
        //         app.emit('menu.checkUpdate')
        //     }
        // }, 
        {
            type: 'separator'
        }, {
            label: app.__('winTrayMenus.Exit'),
            click () {
                app.quit()
            }
        }])
        tray.setContextMenu(trayMenu)
    }

    if (platform.OSX) {
        tray.setPressedImage(path.join(__dirname, 'res', Config.MAC.PRESSEDIMAGE))
    }
};

var initMenu = () => {
    let menuTemplate

    if (platform.OSX) {
        menuTemplate = require('./js/menu_osx')(i18n.getLocale())
        const menu = Menu.buildFromTemplate(menuTemplate)
        Menu.setApplicationMenu(menu)
        appMenu = Menu.getApplicationMenu()
    }
    else if (platform.Windows) {
    // menuTemplate = require('./js/menu_win')
    }
};

var setBadge = (unreadCount) => {
    let text

    if (unreadCount < 1) {
        text = ''
    } else if (unreadCount > 99) {
        text = '99+'
    } else {
        text = unreadCount.toString()
    }

    app.dock.setBadge(text)
    tray.setTitle(text == '' ? '' : text)
}

var clearShake = () => {
    if(shake){
        clearInterval(shake)
    }
    shake = null
}

var execShake = (flag) => {
    var _position;
    if (mainWindow) {
        _position = mainWindow.getPosition()
        if(flag){
            mainWindow.setPosition(_position[0] + 10, _position[1])
        } else {
            mainWindow.setPosition(_position[0] - 10, _position[1])
        }
    }
}
/**
 * [shakeWindow description]
 * @param  {[number]} _interval [振动频率]
 * @param  {[number]} _time     [振动时间]
 * @return {[type]}           [description]
*/
var shakeWindow = (_interval, _time) => {
    if (mainWindow) {
        var flag = false;
        clearShake();
        if(typeof _interval != 'number'){
            _interval = 25;
        }
        if(typeof _time != 'number'){
            _time = 1000;
        }
        shake = setInterval(() => {
            flag = !flag;
            execShake(flag);
        },_interval);
        setTimeout(() => {
            clearShake()
        },_time)
    }
}

var deleteChromeCache = () => {
    var chromeCacheDir = path.join(app.getPath('userData'), 'Cache'); 
    if(fs.existsSync(chromeCacheDir)) {
        var files = fs.readdirSync(chromeCacheDir);
        for(var i=0; i<files.length; i++) {
            var filename = path.join(chromeCacheDir, files[i]);
            if(fs.existsSync(filename)) {
                try {
                    fs.unlinkSync(filename);
                }
                catch(e) {
                    console.log(e);
                }
            }
        }
    }
}

var setTray = (unreadCount) => {
    let iconFile = [Config.WIN.TRAY_OFF,Config.WIN.TRAY]
    let flag

    if(unreadCount > 0){
        if(!blink){
            blink = setInterval(function(){
            flag = !flag
            tray.setImage(path.join(__dirname, 'res', iconFile[flag ? 1 : 0]))
            },500)
        }
    }
    else{
        if(blink){
            clearInterval(blink)
        }
        blink = null
        tray.setImage(path.join(__dirname, 'res', iconFile[1]))
    }
}

var displayBalloon = (title, msg) => {
    var options = {
        icon: path.join(__dirname, 'res', Config.WIN.BALLOON_ICON),
        title: title,
        content: msg
    };
    tray.displayBalloon(options);
    tray.on('balloon-click', (opt) => {
        if (mainWindow && mainWindow.webContents) {
            mainWindow.show()
            mainWindow.webContents.send('balloon-click', opt)
        }
    })

}

var initIpcEvents = () => {
    'use strict';
    ipcMain.on('unread-message-count-changed', (event, count, display) => {
        if (platform.OSX) {
            setBadge(display)
        }
        else if (platform.Windows){
            setTray(display)
        }
    })

    ipcMain.on('notification-click', () => {
        if (mainWindow) {
           mainWindow.show()
        }
    })

    ipcMain.on('logout', () => {
        if (platform.OSX){
            setBadge(0)
            tray.setImage(path.join(__dirname, 'res', 'Mac_Template.png'))
        } else if (platform.Windows){
            setTray(0)
        }
        if(mainWindow){
            mainWindow.removeAllListeners();
        }
    })

  /*  ipcMain.on('screen-shot', () => {
        takeScreenshot()
    })*/

    ipcMain.on('display-balloon', (event, title, opt) => {
        displayBalloon(title, opt.body)
        tray.on('balloon-click', () => {
            if (mainWindow && mainWindow.webContents) {
                mainWindow.show()
                mainWindow.webContents.send('balloon-click', opt)
            }
        })
    })

    ipcMain.on('flash-dock', () => {
        if (mainWindow) {
            mainWindow.flashFrame(true)
        }
    })

    ipcMain.on('shake-window', (event, _interval, _time) => {
        shakeWindow(_interval, _time);
    })

    ipcMain.on('clear-chrome-cache', () => {
        deleteChromeCache();
    })

    ipcMain.on('cancel-download', (event, url) => {
        var downloadItem = downloadObject[url];
        if(downloadItem){
            downloadItem.cancel();
        }
    })
    ipcMain.on('toggle-screenshot-shortcut', (event, enabled) => {
        var screenshotReg = null;
        if (platform.OSX) {
            var screenShotMenu = appMenu.items[4].submenu.items[0];
            if(screenShotMenu){
                screenShotMenu.enabled = enabled;
            } else {
                logger.error('toggle-screenshot-shortcut error: can not find appMenu.items[4].submenu.items[0]');
            }
            
        } else {
            screenshotReg = 'CTRL+ALT+S';
            if(enabled){
                globalShortcut.register(screenshotReg, takeScreenshot);
                return;
            }
            globalShortcut.unregister(screenshotReg);
        }
    });

    ipcMain.on('downloadFile', (event, _url, fileName, messageId, showSaveAs) => {
        var parsedUrl = url.parse(_url, true);
        var queryData = parsedUrl.query;
        var folderName = path.basename(parsedUrl.pathname);
        // var filename = queryData.attname;
        // filename = filename ? decodeURIComponent(decodeURIComponent(filename)) : path.basename(parsedUrl.pathname);
        var savePath = path.join(downloadPath, folderName, fileName);
        try {
            mkdirp.sync(path.join(downloadPath, folderName));
        } catch (e) {
            logger.error(e.stack);
            Utils.showMessage("info", '创建目录错误', '提示', e.toString());
        }

        downloadFile(_url, savePath, messageId);
    })

    ipcMain.on('downloadExtra', (event, _url, fileName, messageId) => {
        var parsedUrl = url.parse(_url, true);
        var name = path.basename(parsedUrl.pathname);
        if(name.indexOf('.') == -1){
            name = name + '.png';
        }
        var default_path = path.join(app.getPath('downloads'), fileName || name)
        var options = {
            title: fileName,
            defaultPath: default_path,
            filters: [
              { name: 'Images', extensions: ['png', 'jpg', 'gif'] }
            ]
        };
        dialog.showSaveDialog(mainWindow, options, function(result){
            if(result){
                downloadFile(_url, result, messageId);
            }
        });
        
    })

    ipcMain.on('pause', (event, id) => {
        var curRequest = downloadListener[id]
        if(curRequest){
            curRequest.pause()
        }
    })

    ipcMain.on('resume', (event, id) => {
        var curRequest = downloadListener[id]
        if(curRequest){
            curRequest.resume()
        }
    })

    ipcMain.on('cancel', (event, id) => {
        var curRequest = downloadListener[id]
        if(curRequest){
            curRequest.abort()
        }
    })

};

var initIpcVoipEvents = (voip) => {
    ipcMain.on('openVoip', (event, userid, locale) => {
        winVoip = new BrowserWindow({
            x: voip.BOUNDS.X,
            y: voip.BOUNDS.Y,
            width: voip.BOUNDS.WIDTH,
            height: voip.BOUNDS.HEIGHT,
            minWidth: voip.MINWIDTH,
            minHeight: voip.MINHEIGHT,
            titleBarStyle: 'hidden',
            // resizable: false,
            minimizable: true,
            maximizable: true,
            // maxHeight: workAreaSize.height, //如果此处设置,mac最大化窗体时 左上角按钮显示有问题
            // icon: path.join(__dirname, 'res', Config.WINICON),
            // title: Config.PACKAGE.APPNAME,
            show: false,
            frame: false,
            transparent: true,
            alwaysOnTop: true,
            // parent: mainWindow,
            'webPreferences': {
                preload: path.join(__dirname, 'js', 'voip.js'),
                nodeIntegration: false,
                allowDisplayingInsecureContent: true
                // webSecurity: false,
            }
        });
        winVoip.loadURL(Config.APP_HOST + voip.INDEX + '?userid=' + userid + '&locale=' + locale);
        // winVoip.loadURL(path.join(Config.APP_ONLINE + voip.URL));
        // winVoip.toggleDevTools()
        winVoip.once('ready-to-show', () => {
            // winVoip.showInactive()
        })

        winVoip.on('close', (event) => {
            if(mainWindow && mainWindow.webContents){
                // mainWindow.webContents.send('onClose', winVoip.id);
                mainWindow.webContents.send('onClose', '');
            }
            winVoip = null;
        })

        var voipWebContents = winVoip.webContents;

        voipWebContents.on('dom-ready', () => {
            var cssfile = path.join(__dirname, 'res', 'browser_voip.css');
            voipWebContents.insertCSS(fs.readFileSync(cssfile, 'utf8'));
            // voipWebContents.executeJavaScript(fs.readFileSync(path.join(__dirname, 'js', 'postload.js'), 'utf8'));
        })

        voipWebContents.on('did-finish-load', () => {
            voipWebContents.send('message', 'Hello second window!');
        });
    });

    ipcMain.on('voipReady', (event, winid) => {
         if(mainWindow && mainWindow.webContents){
            mainWindow.webContents.send('onVoipReady', winid);
         }
    })
    
    ipcMain.on('voipRequest', (event, params) => {
         if(mainWindow && mainWindow.webContents){
            mainWindow.webContents.send('onVoipRequest', params);
         }
    })

    ipcMain.on('IMRequest', (event, params) => {
         if(winVoip && winVoip.webContents){
            winVoip.webContents.send('onIMRequest', params);
         }
    })

    ipcMain.on('voipSetBounds', (event, params) => {
        var position = {};
        var mainBounds = mainWindow.getBounds();
        position.x = Math.min(mainBounds.x + mainBounds.width, workAreaSize.width - params.width);
        position.y = Math.min(mainBounds.y + mainBounds.height - params.height, workAreaSize.height - params.height);
        winVoip.setBounds({x: position.x, y: position.y, width: params.width, height: params.height});
        winVoip.setMinimumSize(params.width, params.height);
        winVoip.setAlwaysOnTop(false);
        winVoip.focus();
    })

    ipcMain.on('setRingPos', () => {
        var position = {};
        var voipSize = winVoip.getSize();
        position.x = workAreaSize.width - voipSize[0] * scaleFactor;
        position.y = workAreaSize.height - voipSize[1] * scaleFactor;
        winVoip.setPosition(position.x, position.y);
        winVoip.setMinimumSize(voipSize[0] * scaleFactor, voipSize[1] * scaleFactor);
    })

    ipcMain.on('showVoip', () => {
        if(winVoip){
            winVoip.show();
        }
    })
}

var takeScreenshot = () => {
    if(mainWindow && mainWindow.webContents){
        mainWindow.webContents.send('takeScreenshot');
    }
};

//TODO 需重写
var registerScreenshot = () => {
    require('./modules/screenshot/screenshot.main.js')
};

var toggleDevTools = () => {
    var curWindow = BrowserWindow.getFocusedWindow(); 
    curWindow && curWindow.toggleDevTools()
}

var reload = () => {
    app.emit('menu.edit.reload')
}

var searchFriend = () => {
    app.emit('menu.edit.search')
}
//TODO 需重写,将快捷键提出来
var bindGlobalShortcuts = () => {
    if (platform.OSX) {
        globalShortcut.register('CTRL+CMD+SHIFT+I', toggleDevTools)
        globalShortcut.register('CTRL+CMD+X', shakeWindow)
        // globalShortcut.register('CTRL+CMD+S', copyFilesToClipboard(paths))
    } else {
        globalShortcut.register('CTRL+ALT+SHIFT+I', toggleDevTools)
        regShortCut();
        globalShortcut.register('CTRL+R', reload)
        globalShortcut.register('CTRL+ALT+X', shakeWindow)
    }
}

var main = () => {
    'use strict';
    // qt会影响 menu 的显示,所以需放在前面初始化
    // 如放在后面初始化,页面加载完成后需要重新初始化菜单
    registerScreenshot();
    initApp();
    initTray();
    initMenu();
    initIpcEvents();
    initIpcVoipEvents(Config.VOIP);
    // registerScreenshot();
    // registerActivateWindow();
    bindGlobalShortcuts();
};

(() => {
    let shouldQuit = app.makeSingleInstance((argv, workingDirectory) => {
  // Someone tried to run a second instance, we should focus our window
        if (mainWindow) {
            mainWindow.show()
        }
        return true
    })

    if (shouldQuit) {
        app.quit()
    }

    // setLogConfig();
    i18n.configure({
        locales:['en', 'zh-CN'],
        directory: __dirname + '/locales',
        defaultLocale: 'zh-CN',
        objectNotation: true ,
        register: app,
        // syncFiles: true,
        api: {
          '__': 't',
          '__n': 'tn'
        }
    });

    app.on('ready', main);

    app.on('menu.help.about', () => {
        shell.openExternal(Config.ABOUT)
    })
    
    // Show main window when activate app icon.
    app.on('activate', () => {
        if (mainWindow) {
            mainWindow.show()
        }
    })

    app.on('browser-window-created', (event, win) => {
        // win.setMenu(null);
    });

    app.on('menu.main.account_settings', () => {
        if (mainWindow && mainWindow.webContents) {
            mainWindow.show()
            mainWindow.webContents.send('menu.main.account_settings')
        }
    })

    // Set language.
    app.on('menu.view.languages', (lang) => {
        // mainWindow.loadURL('https://web.hitalk.im/?lang=' + lang)
        i18n.setLocale(lang)
        initMenu()
    })

    app.on('menu.view.bringFront', (checked) => {
        if(mainWindow){
            mainWindow.setAlwaysOnTop(checked);
        }
    })
    
    // Focus on search input element.
    app.on('menu.edit.search', () => {
        if (mainWindow && mainWindow.webContents) {
            mainWindow.webContents.send('menu.edit.search')
        }
    })

    // Reload page on reload menu item selected.
    app.on('menu.edit.reload', () => {
        if (mainWindow && mainWindow.webContents) {
            mainWindow.show()
            mainWindow.webContents.reloadIgnoringCache()
        }
    })

    // Open homepage on homeplage menu item selected.
    app.on('menu.help.homepage', () => {
        shell.openExternal(Config.HOME)
    })

    app.on('menu.help.purgecache', () => {
        if (!mainWindow) return
        let session = mainWindow.webContents.session
        new Promise(rslv => session.clearCache(() => rslv()))
        .then(() => new Promise(rslv => session.clearStorageData(() => rslv())))
        .then(() => loadHome())
    })

    app.on('menu.edit.takeScreenshot', () => {
        takeScreenshot()
    })

    app.on('browser-window-blur', () => {
        globalShortcut.unregisterAll()
        if (platform.Windows) {
            unregShortCut()
        }
    })

    app.on('browser-window-focus', () => {
        bindGlobalShortcuts()
    })

    app.on('before-quit', () => {
        console.log('app before-quit');
        forceQuit = true
        if(winVoip){
            winVoip.close();
            // winVoip.destroy();
        }
        if(mainWindow){
            mainWindow.removeAllListeners();
        }
        saveWindowBounds()
    })

    app.on('window-all-closed', () => {
        console.log('app window-all-closed');
        app.quit()
    })

    app.on('open-url', function(event, url) {
        event.preventDefault();
        urlParam = url;
    });

    app.on('will-quit', () => {
        globalShortcut.unregisterAll()
    })

})();

process.on('error', function(err) {
    logger.error(err.toString());
    // console.log(err);
});

process.on('uncaughtException', function (error) {
    // console.log(error)
    if(error == lastError){
        return;
    }
    logger.error(error);
    // if (error) throw error;
    // if(mainWindow){
    //     mainWindow.webContents.send('logout')
    // }
   
    lastError = error;
    Utils.showError(error);
    // if (error) throw error;
    // return setTimeout((function() {
    //     return process.exit(1);
    // }), 5000);
})

var curRequest;
var downloadFile = (file_url , target_path, messageId) => {
    // Save variable to know progress
    var received_bytes = 0;
    var total_bytes = 0;
    var req = request({
        method: 'GET',
        uri: file_url
    });
    downloadListener[messageId] = req || [];
    var out = fs.createWriteStream(target_path);
    req.pipe(out);

    var params = {
        state: '',
        messageId: '',
        receivedBytes: '',
        totalBytes: '',
        targetPath: ''
    };
    req.on('response', function ( data ) {
        // Change the total bytes value to get progress later.
        // console.log('response', data.statusCode)
        params = {
            state: 'preDownload',
            messageId: messageId,
            receivedBytes: 0,
            totalBytes: total_bytes,
            targetPath: target_path
        };
        if(mainWindow && mainWindow.webContents){
            total_bytes = parseInt(data.headers['content-length' ]);
            mainWindow.webContents.send('onDownload', params);
        }
    });

    req.on('data', function(chunk) {
        // console.log(chunk.length);
        if(mainWindow && mainWindow.webContents){
            received_bytes += chunk.length;
            params = {
                state: 'downloading',
                messageId: messageId,
                receivedBytes: received_bytes,
                totalBytes: total_bytes,
                targetPath: target_path
            };
            mainWindow.webContents.send('onDownload', params)
        }
    });

    req.on('end', function() {
        // console.log('end');
        if(mainWindow && mainWindow.webContents){
            params = {
                state: 'downloaded',
                messageId: messageId,
                receivedBytes: total_bytes,
                totalBytes: total_bytes,
                targetPath: target_path
            };
            mainWindow.webContents.send('onDownload', params)
        }
    });
    
    req.on('error', function(error) {
        console.log('error', error.status);
        if(mainWindow && mainWindow.webContents){
            params = {
                state: 'downloadError',
                messageId: messageId,
                receivedBytes: received_bytes,
                totalBytes: total_bytes,
                targetPath: target_path,
                error: error
            };
            mainWindow.webContents.send('onDownload', params)
            logger.error(error);
        }
    });
};

