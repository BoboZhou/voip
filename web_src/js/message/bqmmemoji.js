'use strict';
(function(RongIM, dependencies, components) {

var utils = RongIM.utils;
var BQMM = dependencies.BQMM;

components.getBQMMEmojiMessage = function (resolve, reject) {
    var options = {
        name: 'bqmmemoji-message',
        props: ['message'],
        template: '#rong-template-bqmmemoji',
        computed: {
            content: function () {
                var code = JSON.parse(this.message.content.bqmmExtra).msg_data;
                return BQMM.renderMessage(code);
            }
        }
    };
    utils.asyncComponent(options, resolve, reject);
};

})(RongIM, {
    BQMM: BQMM
}, RongIM.components);
