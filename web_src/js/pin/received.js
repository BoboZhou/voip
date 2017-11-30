'use strict';
(function (RongIM, dependencies, components) {

var common = RongIM.common;
var utils = RongIM.utils;
var dialog = RongIM.dialog;
var $ = dependencies.jQuery;

function getReceived(resolve, reject) {
    var im = RongIM.instance;
    var dataModel = im.dataModel;
    var pinApi = dataModel.Pin;
    var options = {
        name: 'pin-received',
        template: 'templates/pin/received.html',
        data: function () {
            return {
                confirmExpand: false,
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
        methods: getMethods(im, dataModel),
        mounted: function() {
            mounted(this, dataModel);
            var that = this;
            im.$on('deletePin', function(pin) {
                that.pinList = that.pinList.filter(function(pinDetail) {
                    return pinDetail.uid !== pin.uid;
                });
            });
        },
        destroyed: function() {
            pinApi.unwatch(this.pinCreateWatch);
            pinApi.unwatch(this.pinChangeWatch);
            pinApi.notifyUnReadCount();
        }
    };
    utils.asyncComponent(options, resolve, reject);
}

function mounted(context, dataModel) {
    var pinApi = dataModel.Pin;
    pinCreateWatch(context, pinApi);
    pinChangeWatch(context, pinApi);
    setupPinInBox(context, pinApi);
}

function getMethods(im, dataModel) {
    var pinApi = dataModel.Pin;
    return {
        userProfile: function(userId) {
            var that = this;
            that.isClicking = true;
            dialog.user(userId, function() {
                that.isClicking = false;
            });
        },
        getUsername: function(user) {
            return user ? user.alias || user.name : ' ';
        },
        getConfirmStr: function(pin) {
            var localeReceived = im.locale.components.receivedPin;
            return pin.confirmed ? localeReceived.confirmed : localeReceived.unConfirmed;
        },
        getReplyDetail: function(pin) {
            var localeReceived = im.locale.components.receivedPin;
            var replyPrompt = this.localeFormat(localeReceived.reply, pin.commentCount);
            replyPrompt = pin.commentCount ? replyPrompt : localeReceived.replyNone;
            return pin.confirmed ? replyPrompt : localeReceived.confirmReceived;
        },
        dateFormat: function(timestamp) {
            var dateFormat = utils.dateFormat;
            var options = {
                alwaysShowTime: true
            };
            return dateFormat(timestamp, options);
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
        receiveConfirm: function(pin) {
            if (pin.confirmed) {
                this.replyPin(pin);
                return;
            }
            var that = this;
            that.isClicking = true;
            $.when(setPinConfirm(pin, pinApi))
                .then(function() {
                    that.isClicking = false;
                    pinApi.notifyUnReadCount(pin.pinUid);
                });
        },
        hasUnReadComment: function(pin) {
            var isConfirmed = pin.confirmed;
            var isSelected = this.selectedPin === pin;
            return pin.unReadCommentCount && !isSelected && isConfirmed;
        },
        afterEnter: function() {
            this.isClicking = false;
            im.$emit('pinDetailLoadDone');
        },
        enterCancelled: function() {
            this.isClicking = false;
        },
        beforeLeave: function() {
            var pinList = this.pinList;
            setupPinInBox(this, pinApi, function(list) {
                var newListIds = list.map(function(pin) {
                    return pin.uid;
                });
                var deletePinList = pinList.filter(function(pin) {
                    return newListIds.indexOf(pin.uid) === -1;
                });
                deletePinList.length && common.messagebox({
                    message: '该Pin已经被删除'
                });
            });
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
        message.messageType === pinApi.MessageType.PinNotifyMessage && setupPinInBox(context, pinApi);
    };
    pinApi.watch(context.pinCreateWatch);
}

function pinChangeWatch(context, pinApi) {
    context.pinChangeWatch = function(message) {
        var isCommentMessage = message.messageType === pinApi.MessageType.PinCommentMessage;
        var isUnReadMessage = message.messageType === pinApi.MessageType.PinUnReadCountMessage;
        if (isCommentMessage || isUnReadMessage) {
            context.pinList.forEach(function(pin) {
                pin.uid === message.content.pinUid && pinChange(context, pinApi, pin);
            });
        }
    };
    pinApi.watch(context.pinChangeWatch);
}

function setupPinInBox(context, pinApi, callback) {
    pinApi.getInbox(function(errorCode, result) {
        callback && callback(result.data);
        context.pinList = result.data;
    });
}

function setPinConfirm(pin, pinApi) {
    var $def = $.Deferred();
    pinApi.confirm(pin.uid, function() {
        pin.confirmed = true;
        $def.resolve();
    });

    return $def;
}

function pinChange(context, pinApi, pin) {
    pinApi.getPinDetail(pin.uid, function(errorCode, detail) {
        $.extend(pin, detail);
    });
}

$.extend(true, components, {
    pin: {
        getReceived: getReceived
    }
});

})(RongIM, {
    jQuery: jQuery
}, RongIM.components);
