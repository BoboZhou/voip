'use strict';
(function (RongIM, components) {

var common = RongIM.common;
var utils = RongIM.utils;

components.getSettingPassword = function (resolve, reject) {
    var im = RongIM.instance;
    var options = {
        name: 'setting-password',
        template: 'templates/setting/password.html',
        data: function () {
            return {
                busy: false,
                oldPassword: null,
                newPassword: null,
                confirmPassword: null
            };
        },
        computed: {
            disabled: function () {
                return utils.isEmpty(this.oldPassword)
                    || utils.isEmpty(this.newPassword)
                    || utils.isEmpty(this.confirmPassword);
            }
        },
        mixins: [
            components.getValidate()
        ],
        methods: {
            submit: function () {
                var params = {
                    newPassword: this.newPassword,
                    oldPassword: this.oldPassword
                };
                submit(this, im.dataModel.User, params, im);
            }
        }
    };
    utils.asyncComponent(options, resolve, reject);
};

function submit(context, userApi, params) {
    if (!context.valid() || context.busy) {
        return;
    }
    context.busy = true;
    userApi.changePassword(params, function(errorCode){
        context.busy = false;
        if(errorCode) {
            var errDes = common.getErrorMessage(errorCode);
            // 同一个错误码 在设置密码时 提示信息不一样
            if (errorCode === 10101) {
                errDes = context.locale.errorCode['old-password-error'];
            }
            return context.$set(context.errors, 'oldPassword', errDes);
        }
        // common.messagebox({
        //     message: context.locale.changePwdSuccess,
        //     callback: im.logout
        // });
    });
}

})(RongIM, RongIM.components);
