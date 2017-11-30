'use strict';
(function (RongIM, Electron) {

function PCError(message) {
   this.message = message || 'PC 方法错误';
   this.name = 'PCError';
}
PCError.prototype = new Error();
PCError.prototype.constructor = PCError;

var channel = {
    SCREENSHOT: 'screenshot',
    SEARCH: 'menu.edit.search',
    LOGOUT: 'logout',
    ACCOUNT: 'menu.main.account_settings',
    BALLOON: 'balloon-click',
    DOWNLOADPROGRESS: 'chDownloadProgress',
    DOWNLOADSTATE: 'chDownloadState',
    preDownload: 'preDownload',
    downloading: 'downloading',
    downloaded: 'downloaded',
    downloadError: 'downloadError',
    onDownload: 'onDownload'
};

function regListener(listenerKey, callback) {
    Electron.ipcRenderer.on(listenerKey, callback);
}

function unRegListener(listenerKey, callback) {
    if (typeof callback === 'function') {
        Electron.ipcRenderer.removeListener(listenerKey, callback);
    } else {
        var events = Electron.ipcRenderer._events[listenerKey];
        if(events instanceof Function) {
            Electron.ipcRenderer.removeListener(listenerKey, events);
        } else if(events instanceof Array) {
            events.forEach(function(event){
                Electron.ipcRenderer.removeListener(listenerKey, event);
            });
        }
    }
}

function regScreeshot(callback){
    regListener(channel.SCREENSHOT, callback);
}

function unregScreeshot(){
    unRegListener(channel.SCREENSHOT);
}

function regSearch(callback){
    regListener(channel.SEARCH, callback);
}

function unregSearch(){
    unRegListener(channel.SEARCH);
}

function regLogout(callback){
    regListener(channel.LOGOUT, callback);
}

function unregLogout(){
    unRegListener(channel.LOGOUT);
}

function regAccount(callback){
    regListener(channel.ACCOUNT, callback);
}

function unregAccount(){
    unRegListener(channel.ACCOUNT);
}

function regBalloon(callback){
    regListener(channel.BALLOON, callback);
}

function unregBalloon(){
    unRegListener(channel.BALLOON);
}

function regStateChange(callback){
    regListener(channel.DOWNLOADPROGRESS, callback);
}

function unregStateChange(){
    unRegListener(channel.DOWNLOADPROGRESS);
}

function regDownloadProgress(callback){
    regListener(channel.DOWNLOADPROGRESS, callback);
}

function unregDownloadProgress(){
    unRegListener(channel.DOWNLOADPROGRESS);
}

function regDownloadState(callback){
    regListener(channel.DOWNLOADSTATE, callback);
}

function unregDownloadState(){
    unRegListener(channel.DOWNLOADSTATE);
}

function maxWin() {
    Electron.maxWin();
}

function minWin() {
    Electron.minWin();
}

function restoreWin() {
    Electron.restoreWin();
}

function closeWin() {
    Electron.closeWin();
}

function focus() {
    Electron.focus();
}

function chkFileExists(dir) {
    return Electron.chkFileExists(dir);
}

function openFile(localPath) {
    Electron.openFile(localPath);
}

function openFileDir(dir) {
    Electron.openFileDir(dir);
}

function getBlobByPath(path) {
    return Electron.getBlobByPath(path);
}

function updateBadgeNumber(number) {
    Electron.updateBadgeNumber(number);
}

function screenShot() {
    Electron.screenShot();
}

function toggleScreenShortcut(enabled) {
    Electron.toggleScreenShortcut(enabled);
}

function getPlatform() {
    return Electron.getPlatform();
}

function cancelDownload(url) {
    Electron.cancelDownload(url);
}

function logout() {
    if(typeof Electron.logout === 'function'){
        Electron.logout();
    } else {
        throw new PCError('logout 方法不存在!');
    }
}

function flashDock() {
    Electron.flashDock();
}

function downloadFile(url, name, id) {
    Electron.downloadFile(url, name, id);
}

function regPreDownload(callback) {
    regListener(channel.preDownload, callback);
}
function unregPreDownload() {
    unRegListener(channel.preDownload);
}

function regDownloading(callback) {
    regListener(channel.downloading, callback);
}
function unregDownloading() {
    unRegListener(channel.downloading);
}

function regDownloaded(callback) {
    regListener(channel.downloaded, callback);
}
function unregDownloaded() {
    unRegListener(channel.downloaded);
}
function regDownloadError(callback) {
    regListener(channel.downloadError, callback);
}
function unregDownloadError() {
    unRegListener(channel.downloadError);
}

function regDownload(callback) {
    regListener(channel.onDownload, callback);
}
function unregDownload() {
    unRegListener(channel.onDownload);
}

function getPathsFromClip() {
    return Electron.getPathsFromClip();
}

function getImgByPath() {
    return Electron.getImgByPath();
}

function getVersion() {
    return Electron.configInfo.PACKAGE.VERSION;
}

function showMessageBox(params, callback) {
    if(typeof Electron.showMessageBox === 'function'){
        Electron.showMessageBox(params, callback);
    } else {
        throw new PCError('showMessageBox 方法不存在!');
    }
}

function getUserStatusTitle() {
    return 'Login_Status_PC';
}
/*
    params.type
    params.method
    params.data
*/
function set(){
}

/*var storeItem = {
    '/staffs/batch': function(){

    },
    '/staffs/{id}': function(){

    },
    '/company': function(){

    },
    '/departments/{deptId}': function(){

    },
    '/departments/{deptId}/branches': function(){

    },
    '/departments/{deptId}/staffs': function(){

    }
};*/
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
    getVersion: getVersion,
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

function startVoip(params) {
    var im = RongIM.instance;
    if (im.voip.busy) {
        return;
    }
    RongIM.voip.openWin(function () {
        im.voip.busy = true;
        var message = params.data;
        im.voip.type = message.mediaType;
        im.voip.sharing = message.isShareScreen;
        RongIM.voip.IMRequest(params);
    });
}

var voip = {
    openWin: function (callback) {
        Electron.Voip.open(RongIM.instance.auth.id, RongIM.instance.config.locale);
        var openCallback = function () {
            unRegListener('onVoipReady', openCallback);
            callback();
        };
        regListener('onVoipReady', openCallback);
    },
    /*
    params.conversation
    params.type
    */
    invite: function(params, userApi) {
        var conversation = params.conversation;
        var isPrivate = conversation.conversationType === RongIM.utils.conversationType.PRIVATE;
        var arg = {
            type: 'message',
            data: {
                messageType: 'Call',
                conversationType: conversation.conversationType,
                targetId: conversation.targetId,
                self: RongIM.instance.loginUser,
                mediaType: params.type,
                isShareScreen: params.isShareScreen
            }
        };
        if (isPrivate) {
            var inviteUserIds = [conversation.targetId];
            userApi.get(inviteUserIds, function (errorCode, list) {
                arg.data.inviteUserList = list;
                startVoip(arg);
            });
        } else {
            var targetId = conversation.targetId;
            RongIM.dialog.voipInviteMember(targetId).done(function (memberList) {
                arg.data.inviteUserList = memberList;
                startVoip(arg);
            });
        }
    },
    IMRequest: function (params) {
        Electron.Voip.IMRequest(params);
    },
    regonVoipReady: function (callback) {
        regListener('onVoipReady', callback);
    },
    unregonVoipReady: function (callback) {
        unRegListener('onVoipReady', callback);
    },
    regVoipRequest: function (callback) {
        regListener('onVoipRequest', callback);
    },
    unregVoipRequest: function () {
        unRegListener('onVoipRequest');
    },
    regClose: function (callback) {
        regListener('onClose', callback);
    },
    unregClose: function () {
        unRegListener('onClose');
    }
};

var system = {
    getLocale: function () {
        return Electron.system.getLocale();
    }
};

RongIM.addon = addon;
RongIM.download = download;
RongIM.pcWin = pcWin;
RongIM.downloadSight = downloadSight;
RongIM.file = file;
RongIM.voip = voip;
RongIM.dataProvider = dataProvider;
RongIM.system = system;

})(RongIM, Electron);
