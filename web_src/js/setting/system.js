'use strict';
(function (RongIM, components) {

var utils = RongIM.utils;
var cache = utils.cache;

components.getSettingSystem = function (resolve, reject) {
    var im = RongIM.instance;
    var messageKey = 'sysMessage';
    var options = {
        name: 'setting-system',
        template: 'templates/setting/system.html',
        data: function () {
            return {
                playSound: !!cache.get(messageKey),
                // shortCut: !!cache.get('sysShortcut'),
                language: im.config.locale,
                supportLocales: im.config.supportLocales,
                product: im.locale.product || {}
            };
        },
        watch: {
            playSound: function(newVal){
                cache.set(messageKey, newVal);
            },
            language: function (newVal) {
                cache.set('locale', newVal);
                utils.loadLocale([newVal], function () {
                    im.locale.product.productName = im.config.product.name[newVal];
                    im.config.locale = newVal;
                    document.title = im.locale.product.productName;
                });
            }
            // shortCut: function(newVal){
            //     cache.set('sysShortcut', newVal);
            // }
        },
        methods: {
            checkAppUpdate: function () {
            },
            sysMessage: function () {
                cache.set(messageKey, this.playSound);
            }
        }
    };
    utils.asyncComponent(options, resolve, reject);
};

})(RongIM, RongIM.components);
