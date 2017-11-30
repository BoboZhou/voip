'use strict';
(function (RongIM, dependencies, components) {

var common = RongIM.common;
var utils = RongIM.utils;
var $ = dependencies.jQuery;
var shareData = {};

components.forgetPassword = function (resolve, reject) {
    var im = RongIM.instance;
    var userApi = im.dataModel.User;
    var options = {
        name: 'forget-password',
        template: 'templates/forget-password/index.html',
        data: function () {
            return {
                currentView: 'step-phone'
            };
        },
        components: {
            'step-phone': function (resolve, reject) {
                getStepPhone(userApi, resolve, reject);
            },
            'step-password': function (resolve, reject) {
                getStepPassword(userApi, resolve, reject);
            },
            'step-success': function (resolve, reject) {
                getStepSuccess(resolve, reject);
            }
        },
        methods: {
            currentViewChanged: function (currentView) {
                this.currentView = currentView;
            }
        }
    };
    utils.asyncComponent(options, resolve, reject);
};

function getStepPhone(userApi, resolve, reject) {
    var options = {
        name: 'step-phone',
        template: 'templates/forget-password/step-phone.html',
        data: function () {
            return {
                busy: false,
                region: '86',
                phone: null,
                captcha: null,
                captchaButtonBusy: false,
                captchaButtonText: ''
            };
        },
        mixins: [
            components.getValidate()
        ],
        computed: {
            phoneInvalid: function () {
                return utils.isEmpty(this.phone) || this.errors.phone;
            }
        },
        mounted: function () {
            this.captchaButtonText = this.locale.sendCaptcha;
        },
        methods: {
            sendCaptcha: function () {
                sendCaptcha(this);
            },
            sendCode: function () {
                return sendCode(this, userApi);
            },
            submit: function () {
                submitPhone(this, userApi);
            }
        }
    };

    return utils.asyncComponent(options, resolve, reject);
}

function getStepPassword(userApi, resolve, reject) {
    var options = {
        name: 'step-password',
        template: 'templates/forget-password/step-password.html',
        data: function () {
            return {
                busy: false,
                password: null,
                confirmPassword: null,
                token: shareData.token
            };
        },
        mixins: [
            components.getValidate()
        ],
        methods: {
            submit: function () {
                resetPassword(this, userApi);
            }
        }
    };

    return utils.asyncComponent(options, resolve, reject);
}

function getStepSuccess(resolve, reject) {
    var options = {
        name: 'step-success',
        template: 'templates/forget-password/step-success.html'
    };

    return utils.asyncComponent(options, resolve, reject);
}

function sendCaptcha(context) {
    if(!context.valid('[name=phone]')) {
        return;
    }

    context.captchaButtonBusy = true;
    context.sendCode()
        .then(function () {
            var captchaButtonTextBackup = context.captchaButtonText;
            var count = 59;
            var timer = setInterval(function () {
                if (count > 0) {
                    context.captchaButtonText = context.localeFormat(context.locale.sentCaptcha, count);
                    count--;
                } else {
                    context.captchaButtonText = captchaButtonTextBackup;
                    context.captchaButtonBusy = false;
                    clearInterval(timer);
                }
            }, 1000);
        })
        .fail(function () {
            context.captchaButtonBusy = false;
        })
        .always(function () {
            sendCaptcha.done = true;
        });
}

function sendCode(context, userApi) {
    var defer = $.Deferred();
    var params = {
        region: context.region,
        phone: context.phone
    };
    userApi.sendCode('resetpwd', params, function (errorCode) {
        if(errorCode) {
            context.$set(context.errors, 'phone', common.getErrorMessage(errorCode));
            defer.reject(errorCode);
        } else {
            defer.resolve();
        }
    });
    return defer.promise();
}

function submitPhone(context, userApi) {
    if (!context.valid() || context.busy) {
        return;
    }
    if(!sendCaptcha.done) {
        context.$set(context.errors, 'captcha', common.getErrorMessage('require-captcha'));
        return;
    }

    context.busy = true;
    var params = {
        region: context.region,
        phone: context.phone,
        code: context.captcha
    };
    userApi.checkCode(params, function (errorCode, result) {
        if(errorCode) {
            var errorCodeForCaptcha = [10117, 10120];
            var field = errorCodeForCaptcha.indexOf(errorCode) >= 0 ? 'captcha': 'phone';
            context.$set(context.errors, field, common.getErrorMessage(errorCode));
        } else {
            shareData.phone = context.phone;
            shareData.token = result.token;
            context.$emit('current-view', 'step-password');
        }
        context.busy = false;
    });
}

function resetPassword(context, userApi) {
    if (!context.valid() || context.busy) {
        return;
    }
    context.busy = true;
    var params = {
        phone: shareData.phone,
        password: context.password,
        verifyToken: context.token
    };
    userApi.resetPassword(params, function (errorCode) {
        if(errorCode) {
            context.$set(context.errors, 'password', common.getErrorMessage(errorCode));
        } else {
            context.$emit('current-view', 'step-success');
        }
        context.busy = false;
    });
}

})(RongIM, {
    jQuery: jQuery
}, RongIM.components);
