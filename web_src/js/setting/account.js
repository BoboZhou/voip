'use strict';
(function (RongIM, components) {

var common = RongIM.common;
var utils = RongIM.utils;

components.getSettingAccount = function (resolve, reject) {
    var im = RongIM.instance;
    var options = {
        name: 'setting-account',
        template: '#rong-template-account',
        computed: {
            account: function () {
                return im.loginUser;
            }
        },
        components: {
            avatar: components.getAvatar
        },
        methods: {
            format: function (mobile) {
                return mobile.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3');
            },
            logout: function () {
                logout(this, im);
            }
        }
    };
    utils.asyncComponent(options, resolve, reject);
};

function logout(context, im) {
    common.messagebox({
        // type: 'confirm',
        title: context.locale.quitTitle,
        message: context.locale.quitMessage,
        callback: function () {
            context.$emit('close');
            im.logout();
        }
    });
}

})(RongIM, RongIM.components);
