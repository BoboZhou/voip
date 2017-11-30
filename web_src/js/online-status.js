'use strict';
(function (RongIM, dependencies, components) {

var utils = RongIM.utils;
var cache = utils.cache;

components.getOnlineStatus = function (resolve, reject) {
    var im = RongIM.instance;
    var userApi = RongIM.dataModel.User;
    var cacheKey = 'online-status';
    var options = {
        name: 'online-status',
        template: '#rong-template-online-status',
        data: function () {
            return {
                showMenu: false,
                status: cache.get(cacheKey) || 'online' /*'online' or 'leave' or 'busy'*/
            };
        },
        computed: {
            statusText: function () {
                // var map = {
                //     online: this.locale.online,
                //     leave: this.locale.leave,
                //     busy: this.locale.busy,
                //     offline: this.locale.offline
                // };
                return this.locale[this.status];
            }
        },
        mounted: function () {
            im.$on('imclick', this.close);
        },
        methods: {
            setStatus: function (value) {
                this.status = value;
                cache.set(cacheKey, value);
                userApi.setStatus(value);
                this.close();
            },
            close: function () {
                this.showMenu = false;
            }
        }
    };
    utils.asyncComponent(options, resolve, reject);
};

})(RongIM, null, RongIM.components);
