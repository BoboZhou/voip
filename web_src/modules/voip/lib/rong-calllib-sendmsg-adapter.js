'use strict';
(function (win, Electron) {

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

var MessageCtrl = {
    sendCommand: function (params, callback) {
        console.log('sendCommand...', params);
        callback = callback || function(){};
        Electron.Voip.voipRequest(params);
        // 模拟发送命令回调
        var requestCallback = function (event, req) {
            console.log('onIMRequest', req);
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
    },
    watch: function (callback) {
        regListener('onIMRequest', function (event, req) {
            console.log('onIMRequest', req);
            if (req.type === 'message') {
                var message = req.data;
                console.log('watch:', message);
                callback(req.data);
            }
        });
    },
    unwatch: function () {
        unRegListener('onIMRequest');
    }
};

win.MessageCtrl = MessageCtrl;

})(window, window.Electron);
