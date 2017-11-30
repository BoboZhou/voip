/*
https://electron.atom.io/docs/api/ipc-main/
此处与 screenshot 模块共享 screenshot.main.js
如果单独使用此模块,需要在 main.js 中引入 screenshot.main.js 配合
*/
module.exports = (function(){
const {ipcRenderer, clipboard, remote} = require('electron')
const app = remote.app

const path = require('path')
const fs = require('fs')
const mime = require('mime')
var sharedObj = remote.getGlobal('sharedObj');
var appCapture = null;
appCapture = sharedObj ? sharedObj.appCapture : screencapture;

function fileExists(filePath) {
    try {
        return fs.statSync(filePath).isFile()
    } catch (err) {
        return false
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

//暴露方法给页面dom注册调用
return {
    getPathsFromClipboard: function() {
        if(appCapture){
            return appCapture.getFilePathFromClipboard()
        }
    },
    getBlobsByPaths: function(arrPaths){
        var arrBlob = [];
        arrPaths.forEach(function(path){
            var exist = fileExists(path);
            var file = null;
            if(exist){
                file = getFileByPath(path);
            }
            arrBlob.push(file);
        });
        return arrBlob;
    }
}
})();