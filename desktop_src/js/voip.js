const ipcRenderer = require('electron').ipcRenderer
const remote = require('electron').remote
const BrowserWindow = remote.BrowserWindow
const path = require('path')
const currentWindow = remote.getCurrentWindow()

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

window.Electron = {
    ipcRenderer: ipcRenderer,
    // appInfo: appInfo,
    configInfo: configInfo,
    require: require,
    remote: remote,
    shakeWindow: function(interval, time) {
        ipcRenderer.send('shake-window', interval, time)
    },
    Voip: {
        voipReady: function() {
            ipcRenderer.send('voipReady', currentWindow.id)
        },
        voipRequest: function(params) {
            ipcRenderer.send('voipRequest', params)
        },
        setBounds: function(params) {
            ipcRenderer.send('voipSetBounds', params)
        },
        setRingPos: function() {
            ipcRenderer.send('setRingPos')
        }
    },
    Win: {
        max : function(){
            currentWindow.maximize();
        },
        unmax : function(){
            currentWindow.unmaximize();
        },
        min : function(){
            currentWindow.minimize(); 
        },
        restore : function(){
            currentWindow.restore(); 
        },
        close : function(){
            currentWindow.close();
        },
        bringFront: function(){
            currentWindow.setAlwaysOnTop(false);
        },
        focus: function(){
            currentWindow.focus();
        },
        showInactive: function(){
            currentWindow.showInactive();
        },
        show: function(show){
            if(show){
                currentWindow.show();
            } else {
                currentWindow.hide();
            }
        }
    },
    Extra: {
        enableVueDevtool: function(path){
            if(configInfo.DEBUG){
                BrowserWindow.addDevToolsExtension(path || configInfo.DEBUGOPTION.VUEPATH);
            }
        }
    }
}
