'use strict';
(function(RongIM, components) {

var common = RongIM.common;
var utils = RongIM.utils;

components.getTextMessage = function (resolve, reject) {
    var options = {
        name: 'text-message',
        props: ['message', 'keyword'],
        template: '#rong-template-text',
        data: function () {
            return {
                sentStatus: utils.sentStatus
            };
        },
        computed: {
            content: function () {
                var content = this.message.content.content;
                content = common.textMessageFormat(content);
                return common.highlight(content, this.keyword);
            }
        }
    };
    utils.asyncComponent(options, resolve, reject);
};

})(RongIM, RongIM.components);
