'use strict';
(function (RongIM, win) {

function regScreeshot(){
}

function unregScreeshot(){
}

function regSearch(){
}

function unregSearch(){
}

function regLogout(){
}

function unregLogout(){
}

function regAccount(){
}

function unregAccount(){
}

function regBalloon(){
}

function unregBalloon(){
}

function regStateChange(){
}

function unregStateChange(){
}

function regDownloadProgress(){
}

function unregDownloadProgress(){
}

function regDownloadState(){
}

function unregDownloadState(){
}

function maxWin() {
}

function minWin() {
}

function restoreWin() {
}

function closeWin() {
}

function focus() {

}

function updateBadgeNumber() {
}

function screenShot() {
}

function toggleScreenShortcut() {
}

function getPlatform() {
    return 'web';
}

// 需跟产品确认 web 怎么处理重发文件/图片?
function getBlobByPath() {
}

function cancelDownload() {
}

function chkFileExists() {
    return '';
}

function openFile() {
}

function openFileDir() {
}

function logout() {
}
function flashDock() {
}
function getPathsFromClip() {
    return null;
}

function getImgByPath() {
    return null;
}

function showMessageBox() {
}

function getUserStatusTitle() {
    return 'Login_Status_Web';
}

var addon = {
    screenShot: screenShot,
    regScreeshot: regScreeshot,
    unregScreeshot: unregScreeshot,
    toggleScreenShortcut: toggleScreenShortcut,
    regSearch: regSearch,
    unregSearch: unregSearch,
    regLogout: regLogout,
    unregLogout: unregLogout,
    regAccount: regAccount,
    unregAccount: unregAccount,
    regBalloon: regBalloon,
    unregBalloon: unregBalloon,
    updateBadgeNumber: updateBadgeNumber,
    getPlatform: getPlatform,
    logout: logout,
    showMessageBox: showMessageBox,
    getUserStatusTitle: getUserStatusTitle
};

var download = {
    regProgress: regDownloadProgress,
    unregProgress: unregDownloadProgress,
    regState: regDownloadState,
    unregState: unregDownloadState,
    cancel: cancelDownload,
    regStateChange: regStateChange,
    unregStateChange: unregStateChange
};

function downloadFile(url) {
    // web 不需要下载小视频直接用浏览器打开
    var w = win.open('sight.html');
    w.name = url;
}

function regPreDownload() {
}
function unregPreDownload() {
}

function regDownloading() {
}
function unregDownloading() {
}

function regDownloaded() {
}
function unregDownloaded() {
}
function regDownloadError() {
}
function unregDownloadError() {
}
function regDownload() {
}
function unregDownload() {
}
/*
    params.type
    params.method
    params.data
*/
function set(){

}

/*
    params.type
    callback = function(error, result){
        // result.version ＝> 版本号，用来更新信息
        // result.data => 数据
    }
*/
function get(params, callback){
    var result = {
        version: 0
    };
    var error = null;
    callback(error, result);
}

var dataProvider = {
    get: get,
    set: set
};

var downloadSight = {
    downloadFile: downloadFile,
    regPreDownload: regPreDownload,
    unregPreDownload: unregPreDownload,
    regDownloading: regDownloading,
    unregDownloading: unregDownloading,
    regDownloaded: regDownloaded,
    unregDownloaded: unregDownloaded,
    regDownloadError: regDownloadError,
    unregDownloadError: unregDownloadError,
    regDownload: regDownload,
    unregDownload: unregDownload
};

var pcWin = {
    max: maxWin,
    min: minWin,
    restore: restoreWin,
    close: closeWin,
    focus: focus,
    flashDock: flashDock
};

var file = {
    chkExists: chkFileExists,
    open: openFile,
    openDir: openFileDir,
    getBlobByPath: getBlobByPath,
    getPathsFromClip: getPathsFromClip,
    getImgByPath: getImgByPath
};

var system = {
    getLocale: function () {
        return navigator.language || navigator.systemLanguage;
    }
};

RongIM.addon = addon;
RongIM.download = download;
RongIM.pcWin = pcWin;
RongIM.downloadSight = downloadSight;
RongIM.file = file;
RongIM.dataProvider = dataProvider;
RongIM.system = system;

})(RongIM, window);
