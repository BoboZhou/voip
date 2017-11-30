'use strict';
(function (Voip) {

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
/*
Electron 提供的接口文档
http://gitlab.rongcloud.net/zhengyi/desktop-builder-new/wikis/home
*/
var win = {
    max: function () {
        Electron.Win.max();
    },
    unmax: function () {
        Electron.Win.unmax();
    },
    min: function () {
        Electron.Win.min();
    },
    restore: function () {
        Electron.Win.restore();
    },
    close: function () {
        window.close();
    },
    regonClose: function (callback) {
        regListener('onClose', callback);
    },
    unregonClose: function () {
        unRegListener('onClose');
    },
    setRingPos: function () {
        Electron.Voip.setRingPos();
        win.showInactive();
    },
    setBounds: function (params) {
        Electron.Voip.setBounds(params);
        win.showInactive();
    },
    focus: function () {
        Electron.Win.focus();
    },
    showInactive: function() {
        Electron.Win.showInactive();
    },
    show: function () {
        Electron.Win.show();
    }
};

function ready() {
    Electron.Voip.voipReady();
}

function request(params, callback) {
    callback = callback || function(){};
    Electron.Voip.voipRequest(params);
    // 模拟发送命令回调
    var requestCallback = function (event, req) {
        var isCommandCallback = req.type === 'commandCallback';
        if (isCommandCallback) {
            var data = req.data;
            if (data.command === params.command) {
                callback(data.error, data.result);
                unRegListener('onIMRequest', requestCallback);
            }
        }
    };
    regListener('onIMRequest', requestCallback);
}

Voip.ready = ready;

Voip.request = request;

Voip.win = win;

})(Voip);
