/*
https://electron.atom.io/docs/api/ipc-main/
*/
const {ipcRenderer, clipboard, remote} = require('electron')
const app = remote.app

var sharedObj = remote.getGlobal('sharedObj');
var captureCallback;
var appCapture = null;
appCapture = sharedObj ? sharedObj.appCapture : null;

function setCallback(callback){
    captureCallback = callback;
}

const takeScreenshot = () => {
    try{
        appCapture.screenCapture("", function(result){
            if(result === 'image'){
                var clipboardData = clipboard.readImage();
                if(captureCallback){
                    captureCallback(clipboardData.toDataURL());
                }
            } else {
                captureCallback(result);
            }
        });
    } 
    catch(ex){
        // logger.error(ex.toString());
    }
}

module.exports = {
    setCallback: setCallback,
    takeScreenshot : takeScreenshot
};