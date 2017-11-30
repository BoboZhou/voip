'use strict';
(function (win, setting) {
    var config = {
        voip: {
            url: setting.server, // WebRTC 服务器地址
            timeout: 1000 * 60 // 未接听超时时间。单位: 毫秒
        },
        winSize: {
            audio: { width: 340, height: 250 },
            audiomulti: { width: 340, height: 490 },
            video: { width: 460, height: 380 },
            videomulti: { width: 460, height: 480 }
        },
        busyShowTime: 3, // 对方忙碌时提示显示时长。单位: 秒
        tipShowTime: 3,
        maxMemberCount: 9,
    };
    win.Voip = {
        config: config,
        locale: {}
    };
})(window, config);
