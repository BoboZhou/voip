'use strict';

(function (win,setting) {

    var dev = {
        appkey: 'z3v5yqkbvwla0',
        server: 'http://dev.api.rce.rongcloud.net:8080/rce/api'
    };
    var test = {
        appkey: 'pwe86ga5pwrj6',
        navi : '120.92.118.233:8082',
        api: '120.92.118.233:8081',
        // server: 'http://test.api.rce.rongcloud.net:8080/rce/api'
        server: 'https://et-rce-test-guanyu.rongcloud.net/api'
    };

    var _config = ({
        'dev.im.rce.rongcloud.net': dev,
        'test.im.rce.rongcloud.net': test,
        'web.hitalk.im': test,
        'im.rce.rongcloud.net': setting,
        'production.im.rce.rongcloud.net': setting
    })[location.hostname] || setting;

//默认线上关闭调试模式
    var debug = (location.hostname !== 'im.rce.rongcloud.net');

    var supportLocales = [
        {value: 'zh', name: '中文'},
        {value: 'en', name: 'English'}
    ];

    var recallMessageTimeout = setting.recallMessageTimeout || 3;
    var config = {
        debug: debug,
        locale: setting.locale,
        supportLocales: supportLocales,
        appkey: _config.appkey,
        dataModel: {
            server: _config.server
        },
        sdk: setting.sdk,
        upload: setting.upload,
        recallMessageTimeout: recallMessageTimeout * 60 * 1000,// 单位毫秒
        messageInputPastePreferenceText: false,
        bqmm: {
            support: setting.bqmm,
            appId: 'cbe972fc12fc4c22ac6b53f704724fa4',
            appSecret: '6c8ed93a5cd14815965d1f10e61e97d2'
        },
        product: setting.product
    };

    win.RongIM = {
        locale: {},
        dialog: {},
        components: {},
        config: config,
        debug: {}
    };

})(window, config);
