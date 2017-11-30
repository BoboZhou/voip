'use strict';
(function (RongIM, dependencies, components) {

var utils = RongIM.utils;
var dialog = RongIM.dialog;
var $ = dependencies.jQuery;

function getSent(resolve, reject) {
    var im = RongIM.instance;
    var dataModel = im.dataModel;
    var pinApi = dataModel.Pin;
    var options = {
        name: 'pin-sent',
        template: 'templates/pin/sent.html',
        data: function() {
            return {
                pinList: [],
                selectedPin: null,
                isClicking: false
            };
        },
        components: {
            avatar: components.getAvatar,
            pinDetail: components.getPinDetail
        },
        mixins: [getContextMenu()],
        methods: getMethods(im),
        mounted: function() {
            mounted(this, pinApi);
            var that = this;
            im.$on('deletePin', function(pin) {
                that.pinList = that.pinList.filter(function(pinDetail) {
                    return pinDetail.uid !== pin.uid;
                });
            });
        },
        destroyed: function() {
            unwatch(this, pinApi);
        }
    };
    utils.asyncComponent(options, resolve, reject);
}

function mounted(context, pinApi) {
    pinCreateWatch(context, pinApi);
    pinChangeWatch(context, pinApi);
    setupPinOutbox(context, pinApi);
}

function getMethods(im) {
    return {
        userProfile: function(userId) {
            var that = this;
            that.isClicking = true;
            dialog.user(userId, function() {
                that.isClicking = false;
            });
        },
        showDetail: function(pin, isReply) {
            if (!this.isClicking) {
                this.selectedPin = pin;
                this.selectedPin.isReply = isReply;
                pin.unReadCommentCount = 0;
            }
        },
        replyPin: function(pin) {
            this.isClicking = true;
            this.selectedPin = pin;
            this.selectedPin.isReply = true;
            pin.unReadCommentCount = 0;
        },
        getUsername: function(user) {
            return user ? user.alias || user.name : '';
        },
        dateFormat: function(pin) {
            var timestamp = pin.delayed ? pin.delayedSendDt : pin.createDt;
            var dateFormat = utils.dateFormat;
            var options = {
                alwaysShowTime: true
            };
            return dateFormat(timestamp, options);
        },
        getUnConfirmStr: function(pin) {
            var localeReceived = im.locale.components.sendPin;
            var unConfirmedPrompt = this.localeFormat(localeReceived.unConfirmed, pin.unConfirmCount);
            return unConfirmedPrompt;
        },
        getReplyStr:function(pin) {
            var localeReceived = im.locale.components.receivedPin;
            var replyPrompt = this.localeFormat(localeReceived.reply, pin.commentCount);
            replyPrompt = pin.commentCount ? replyPrompt : localeReceived.replyNone;
            return replyPrompt;
        },
        hasUnReadComment: function(pin) {
            var isSelected = this.selectedPin === pin;
            return pin.unReadCommentCount && !isSelected;
        },
        enterCancelled: function() {
            this.isClicking = false;
        },
        afterEnter: function() {
            this.isClicking = false;
            im.$emit('pinDetailLoadDone');
        }
    };
}

function getContextMenu() {
    var im = RongIM.instance;
    var dataModel = im.dataModel;
    var pinApi = dataModel.Pin;
    var options = {
        template: 'templates/pin/deletepin-contextmenu.html',
        methods: {
            deletePin: function() {
                var pin = this.context.pin;
                pinApi.deletePin(pin.uid, function() {});
                this.$emit('close');
                im.$emit('deletePin', pin);
                pinApi.notifyUnReadCount();
            }
        }
    };
    return components.getContextMenu(options);
}

function pinCreateWatch(context, pinApi) {
    context.pinCreateWatch = function(message) {
        message.messageType === pinApi.MessageType.PinNotifyMessage && setupPinOutbox(context, pinApi);
    };
    pinApi.watch(context.pinCreateWatch);
}

function pinChangeWatch(context, pinApi) {
    context.pinChangeWatch = function(message) {
        var isCommentMessage = message.messageType === pinApi.MessageType.PinCommentMessage;
        var isConfirmed = message.messageType === pinApi.MessageType.PinConfirmMessage;
        var isNewReciver = message.messageType === pinApi.MessageType.PinNewReciverMessage;
        if (isCommentMessage || isConfirmed || isNewReciver) {
            context.pinList.forEach(function(pin) {
                pin.uid === message.content.pinUid && pinChange(context, pinApi, pin);
            });
        }
    };
    pinApi.watch(context.pinChangeWatch);
}

function unwatch(context, pinApi) {
    pinApi.unwatch(context.pinCreateWatch);
    pinApi.unwatch(context.pinChangeWatch);
}

function pinChange(context, pinApi, pin) {
    pinApi.getPinDetail(pin.uid, function(errorCode, detail) {
        $.extend(pin, detail);
    });
}

function setupPinOutbox(context, pinApi) {
    pinApi.getOutbox(function(errorCode, response){
        context.pinList = response.data;
    });
}

$.extend(true, components, {
    pin: {
        getSent: getSent
    }
});

})(RongIM, {
    jQuery: jQuery
}, RongIM.components);
