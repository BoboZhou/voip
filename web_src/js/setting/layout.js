'use strict';
(function (RongIM, components) {

var common = RongIM.common;

RongIM.dialog.setting = function () {
    var im = RongIM.instance;
    var options = {
        name: 'setting',
        template: '#rong-template-setting-layout',
        data: function () {
            return {
                show: true,
                im: im,
                currentView: 'account'
            };
        },
        components: {
            account: components.getSettingAccount,
            password: components.getSettingPassword,
            system: components.getSettingSystem
        },
        methods: {
            isCurrentView: function (name) {
                return this.currentView === name;
            },
            setCurrentView: function (name) {
                this.currentView = name;
            },
            close: function () {
                this.show = false;
            }
        }
    };

    common.mountDialog(options, function (dialog) {
        im.$watch('$route', function () {
            dialog.show = false;
        });
    });
};

})(RongIM, RongIM.components);
