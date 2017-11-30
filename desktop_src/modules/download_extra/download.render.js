/*
https://electron.atom.io/docs/api/ipc-main/
*/
const {ipcRenderer, remote} = require('electron')
const dialog = remote.dialog;
const request = require('request')
const fs = require('fs')
const path = require('path')
const url = require("url");
let downloadListener = {}
let app = remote.app
//暴露方法给页面dom注册调用

/*options {
    fileUrl:下载地址,
    savePath: 下载路径,
    id:回调下载进度的标识,
    showDialog:是否显示保持对话框,
    name:默认下载名称,
    filters:扩展名过滤
}*/
var download = (options, callback) => {
    var noop = function () {};
    callback = callback || noop;
    var parsed = url.parse(options.fileUrl);
    var filename = path.basename(parsed.pathname);
    filename = options.name || filename;
    var downloadPath = app.getPath('downloads');
    var savePath = path.join(downloadPath, filename);
    if(!options.showDialog){
        downloadFile(options.fileUrl, savePath, options.id, callback);
        return;
    }
    savePath = path.join(downloadPath, filename);
    var dialogOptions = {
        title: filename,
        defaultPath: options.savePath || savePath,
        filters: [
          // { name: 'Images', extensions: ['png', 'jpg', 'gif'] }
            options.filters
        ]
    };
    dialog.showSaveDialog(dialogOptions, function(result){
        if(result){
            downloadFile(options.fileUrl , result,  options.id, callback)
        }
    });
    
}

var downloadFile = (fileUrl , savePath, messageId, callback) => {
    var receivedBytes = 0;
    var totalBytes = 0;
    var req = request({
        method: 'GET',
        uri: fileUrl
    });
    downloadListener[messageId] = req || [];
    var out = fs.createWriteStream(savePath);
    req.pipe(out);
    var params = {
        state: '',
        messageId: '',
        receivedBytes: '',
        totalBytes: '',
        targetPath: ''
    };
    req.on('response', function ( data ) {
        params = {
            state: 'preDownload',
            messageId: messageId,
            receivedBytes: 0,
            totalBytes: totalBytes,
            targetPath: savePath
        };
        receivedBytes = 0;
        totalBytes = parseInt(data.headers['content-length' ]);
        callback(params);
    });

    req.on('data', function(chunk) {
        // console.log(chunk.length);
        receivedBytes += chunk.length;
            params = {
            state: 'downloading',
            messageId: messageId,
            receivedBytes: receivedBytes,
            totalBytes: totalBytes,
            targetPath: savePath
        };
        // mainWindow.webContents.send('onDownload', params)
        callback(params);
    });

    req.on('end', function() {
        params = {
            state: 'downloaded',
            messageId: messageId,
            receivedBytes: receivedBytes,
            totalBytes: totalBytes,
            targetPath: savePath
        };
        callback(params);
    });
    
    req.on('error', function(error) {
        console.log('error', error.status);
        params = {
            state: 'downloadError',
            messageId: messageId,
            receivedBytes: receivedBytes,
            totalBytes: totalBytes,
            targetPath: savePath,
            error: error
        };
        callback(params);
        // logger.error(error);
    });
};

function pause (id) {
    var curRequest = downloadListener[id]
    if(curRequest){
        curRequest.pause()
    }
}

function resume (id) {
    var curRequest = downloadListener[id]
    if(curRequest){
        curRequest.resume()
    }
}

function cancel (id) {
    var curRequest = downloadListener[id]
    if(curRequest){
        curRequest.abort()
    }
}

module.exports = {
    download: download,
    pause: pause,
    resume: resume,
    cancel: cancel
}
