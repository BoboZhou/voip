'use strict';
(function (RongIM, dependencies, components) {

var common = RongIM.common;
var utils = RongIM.utils;
var cache = utils.cache;

components.getSignup = function (resolve, reject) {
    var im = RongIM.instance;
    var userApi = im.dataModel.User;
    var options = {
        name: 'signup',
        template: 'templates/signup.html',
        data: function () {
            return {
                busy: false,
                nickname: null,
                phone: null,
                password: null,
                captcha: null,
                region: '+86',
                captchaButtonBusy: false,
                captchaButtonText: ''
            };
        },
        mixins: [
            components.getValidate()
        ],
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
                submit(this, userApi, im);
            }
        }
    };
    utils.asyncComponent(options, resolve, reject);
};

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
                    count = count < 10 ? ('0' + count) : count;
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
    userApi.sendCode('register', params, function (errorCode) {
        if(errorCode) {
            context.$set(context.errors, 'phone', common.getErrorMessage(errorCode));
            defer.reject(errorCode);
        } else {
            defer.resolve();
        }
    });
    return defer.promise();
}

function checkCode(context, userApi){
    var defer = $.Deferred();
    var params = {
        region: context.region,
        phone: context.phone,
        code: context.captcha
    };
    userApi.checkCode(params, function (errorCode, result) {
        if(errorCode) {
            defer.reject(errorCode);
        } else {
            defer.resolve(result);
        }
    });
    return defer.promise();
}

function register(context, userApi, params, im) {
    userApi.register(params, function (errorCode) {
        if(errorCode) {
            context.$set(context.errors, 'phone', common.getErrorMessage(errorCode));
            context.busy = false;
        } else {
            cache.set('phone', context.phone);
            var path = {
                name: 'login',
                params: {
                    selected: 'password'
                }
            };
            im.$router.push(path);
        }
    });
}

function submit(context, userApi, im) {
    if (!context.valid() || context.busy) {
        return;
    }
    context.busy = true;

    checkCode(context, userApi)
        .then(function (result) {
            var params = {
                name: context.nickname,
                zip: context.region,
                tel: context.phone,
                verifyToken: result.token,
                password: context.password
            };
            register(context, userApi, params, im);
        })
        .fail(function (errorCode) {
            context.$set(context.errors, 'captcha', common.getErrorMessage(errorCode));
            context.busy = false;
        });
}

})(RongIM, {
    jQuery: jQuery
}, RongIM.components);
