'use strict';
(function (RongIM, dependencies, components) {

var utils = RongIM.utils;
var common = RongIM.common;

components.getStatus = function (resolve, reject) {
    var im = RongIM.instance;
    var options = {
        name: 'status',
        template: '#rong-template-status',
        props: ['code'],
        computed: {
            error: function () {
                var locale = this.locale;
                if(this.connecting || this.connected) {
                    return;
                }
                var defaultMessage = locale.netErr;
                var errorKey = 'status-' + this.code;
                var errorMessage = common.getErrorMessage(errorKey, defaultMessage);
                if(this.code === utils.status.KICKED_OFFLINE_BY_OTHER_CLIENT){
                    common.messagebox({
                        message: errorMessage,
                        callback: function () {
                            im.logout();
                            return;
                        }
                    });
                }
                return errorMessage;
            },
            connected: function () {
                return this.code === utils.status.CONNECTED;
            },
            connecting: function () {
                return this.code === utils.status.CONNECTING;
            }
        }
    };
    utils.asyncComponent(options, resolve, reject);
};

})(RongIM, null, RongIM.components);
