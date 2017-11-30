'use strict';
(function (RongIM, dependencies, components) {

var common = RongIM.common;
var utils = RongIM.utils;
var $ = dependencies.jQuery;

components.getLatestMessage = function (resolve, reject) {
    var im = RongIM.instance;
    var convertLatestMessage = getConvertLatestMessage(im, utils.templateFormat);
    var options = {
        name: 'latest-message',
        template: '#rong-template-latest-message',
        props: ['message'],
        computed: {
            authId: function (){
                return im.auth.id;
            },
            isSupport: function () {
                var message = this.message;
                var content = !utils.isEmpty(convertLatestMessage[message.messageType]);
                var prefix = !utils.isEmpty(this.prefix);
                return prefix || content;
            },
            prefix: function () {
                var message = this.message;
                return this.locale.message.prefix[message.messageType] || '';
            },
            content: function () {
                var message = this.message;
                var convert = convertLatestMessage[message.messageType] || $.noop;
                var content = convert(message, this.authId) || '';
                return this.prefix + content;
            }
        }
    };
    utils.asyncComponent(options, resolve, reject);
};

function getConvertLatestMessage(im, localeFormat) {
    var locale = im.locale;
    return {
        TextMessage: function (message) {
            var textMessage = message.content;
            var content = textMessage.content;
            return common.convertMessage(content);
        },
        FileMessage: function (message) {
            return message.content.name;
        },
        LocalFileMessage: function (message) {
            return message.content.name;
        },
        CardMessage: function (message) {
            var fromMe = message.messageDirection === 1;
            var name = message.content.name;
            var text = locale.message.cardOther;
            if (fromMe) {
                text = locale.message.cardSelf;
            }
            return localeFormat(text, name);
        },
        GroupMemChangedNotifyMessage: function (message, authId) {
            return common.getGroupNotification(message, authId);
        },
        GroupNotifyMessage: function (message, authId) {
            return common.getGroupNotification(message, authId);
        },
        GroupCmdMessage: function (message, authId) {
            return common.getGroupNotification(message, authId);
        },
        InformationNotificationMessage: function (message) {
            var content = message.content.message;
            if(content.messageName === 'ContactNotifyMessage'){
                return common.getContactNotification(content, im.auth.id);
            }
            return content;
        },
        RecallCommandMessage: function (message, authId) {
            var isMe = message.senderUserId === authId;
            var name = message.user.name;
            var result = localeFormat(locale.message.recallOther, name);
            if (isMe) {
                result = locale.message.recallSelf;
            }
            return result;
        },
        BQMMEmojiMessage: function (message) {
            return message.content.bqmmContent;
        }
        // ContactNotifyMessage: function (message, authId) {
        //     return common.getContactNotification(message, im.auth.id);
        // }
    };
}

})(RongIM, {
    jQuery: jQuery,
    RongIMLib: RongIMLib
}, RongIM.components);
