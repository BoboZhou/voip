'use strict';
(function(RongIM, components) {

var utils = RongIM.utils;
var Base64Util = utils.Base64;

components.getLocationMessage = function (resolve, reject) {
    var options = {
        name: 'location-message',
        props: ['message'],
        template: '#rong-template-location',
        computed: {
            url: function () {
                var url = 'http://ditu.amap.com/search?query={{0}}&zoom=17';
                return utils.templateFormat(url, this.location.poi || '');
            },
            location: function () {
                return this.message.content;
            },
            base64: function () {
                var base64 = this.location.content;
                return Base64Util.concat(base64);
            }
        }
    };
    utils.asyncComponent(options, resolve, reject);
};

})(RongIM, RongIM.components);
