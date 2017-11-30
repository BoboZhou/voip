'use strict';
(function (RongIM, dependencies, components) {

var utils = RongIM.utils;
var $ = dependencies.jQuery;

function getNav(resolve, reject) {
    var im = RongIM.instance;
    var dataModel = im.dataModel;
    var options = {
        name: 'pin-nav',
        template: 'templates/pin/nav.html',
        data: function() {
            return {
                receiverUnReadCount: {
                    unConfirm: 0,
                    unComment: 0
                },
                sendUnReadCount: 0
            };
        },
        computed: {
            receiverCount: function() {
                var unConfirm = this.receiverUnReadCount.unConfirm;
                return unConfirm ? unConfirm : '';
            }
        },
        components: {
            search: components.getSearch
        },
        mounted: function() {
            mounted(this, dataModel.Pin, im);
        },
        destroyed: function() {
            dataModel.Pin.unwatch(this.unReadWatch);
        }
    };
    utils.asyncComponent(options, resolve, reject);
}

function mounted(context, pinApi, im) {
    context.unReadWatch = function(message) {
        var isCommentMessage = pinApi.MessageType.PinCommentMessage === message.messageType;
        var isSelfComment = isCommentMessage && message.content.publisherUid === im.loginUser.id;
        !isSelfComment && setupUnReadCount(context, pinApi);
    };
    pinApi.watch(context.unReadWatch);
    setupUnReadCount(context, pinApi);
}

function setupUnReadCount(context, pinApi) {
    setupReceiverUnReadCount(context, pinApi);
    setupSendUnReadCount(context, pinApi);
}

function setupReceiverUnReadCount(context, pinApi) {
    pinApi.getInboxUnRead(function(errorCode, unread) {
        context.receiverUnReadCount.unComment = unread.length;
        pinApi.getUnConfirmCount(function(errorCode, unconfirm) {
            context.receiverUnReadCount.unConfirm = unconfirm.cnt;
        });
    });
}

function setupSendUnReadCount(context, pinApi) {
    pinApi.getOutboxUnRead(function(errorCode, response) {
        context.sendUnReadCount = response.length;
    });
}

$.extend(true, components, {
    pin: {
        getNav: getNav
    }
});

})(RongIM, {
    jQuery: jQuery
}, RongIM.components);
