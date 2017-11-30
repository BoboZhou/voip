'use strict';
(function (RongIM, dependencies, components) {

var common = RongIM.common;
var utils = RongIM.utils;
var cache = utils.cache;

components.getLogin = function (resolve, reject) {
    var im = RongIM.instance;
    var dataModel = im.dataModel;
    var requriedPassword = utils.isEmpty(cache.get('login-params'));
    var options = {
        name: 'login',
        template: '#rong-template-login',
        data: function () {
            return {
                busy: false,
                selected: 'qrcode',
                qrcodeTimeout: false,
                phone: cache.get('phone'),
                password: requriedPassword ? '' : 'placeholder',
                region: '86',
                isRememberMe: !requriedPassword
            };
        },
        computed: {
            disabled: function () {
                return utils.isEmpty(this.phone) || utils.isEmpty(this.password);
            }
        },
        watch: {
            selected: function (value) {
                var context = this;
                if(value === 'qrcode') {
                    context.$nextTick(context.qrcodeLogin);
                }
            },
            password: function () {
                cache.remove('login-params');
            },
            isRememberMe: function (value) {
                var context = this;
                var loginParams = cache.get('login-params');
                if(!value && loginParams) {
                    cache.remove('login-params');
                    context.password = '';
                }
            }
        },
        mixins: [
            components.getValidate()
        ],
        directives: {
            'auto-focus': {
                inserted: autoFocus
            }
        },
        mounted: function () {
            var params = this.$route.params;
            if(params.selected){
                this.selected = params.selected;
            }
            cache.remove('auth');
            this.qrcodeLogin();
        },
        methods: {
            qrcodeRefresh: function () {
                this.qrcodeLogin();
            },
            qrcodeLogin: function () {
                var context = this;
                context.qrcodeTimeout = false;
                dataModel.QRCode.login(context.$refs.qrcode, function (errorCode, result) {
                    if(errorCode) {
                        var INVALID_TOKEN = 10123;
                        if(errorCode === INVALID_TOKEN) {
                            context.qrcodeTimeout = true;
                        } else {
                            common.handleError(errorCode);
                        }
                        return;
                    }

                    var staff = result.staff;
                    var auth = {
                        token: result.token,
                        id: staff.id,
                        companyId: staff.companyId,
                        deptId: staff.deptId,
                        isStaff: staff.user_type === 0
                    };
                    var isTemp = true;
                    cache.set('auth', auth, isTemp);
                    cache.set('local-auth', auth);
                    cache.set('phone', staff.mobile);
                    im.auth = auth;
                    im.$router.push({name: 'conversation'});
                });
            },
            passwordLogin: function () {
                var context = this;
                var params = {
                    phone: context.phone,
                    password: context.password,
                    region: context.region,
                    isRememberMe: context.isRememberMe
                };
                passwordLogin(this, params, RongIM.instance);
            }
        }
    };
    utils.asyncComponent(options, resolve, reject);
};

function autoFocus(el) {
    if(utils.isEmpty(el.value) && !autoFocus.done) {
        el.focus();
        autoFocus.done = true;
    }
}

function passwordLogin(context, params, im) {
    if (!context.valid() || context.busy) {
        return;
    }
    context.busy = true;

    im.login(params)
        .then(function () {
            cache.set('phone', context.phone);
        })
        .fail(function (errorCode) {
            var message = common.getErrorMessage(errorCode);
            Vue.set(context.errors, 'password', message);
            cache.remove('login-params');
        }).always(function () {
            context.busy = false;
        });
}

})(RongIM, {
    jQuery: jQuery
}, RongIM.components);
