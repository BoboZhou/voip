'use strict';
(function (RongIM, dependencies, components){

var utils = RongIM.utils;
var common = RongIM.common;
var RongIMVoice = dependencies.RongIMLib.RongIMVoice;

components.getVoiceMessage = function (resolve, reject) {
    var im = RongIM.instance;
    var options = {
        name: 'voice-message',
        props: ['message', 'messageList'],
        template: '#rong-template-voice',
        data: function () {
            return {
                sentStatus: utils.sentStatus,
                isPlaying:false
            };
        },
        mounted: function () {
            mounted(this, im);
        },
        computed:{
            widthStyle: function () {
                return widthStyle(this);
            },
            isUnread: function () {
                var receivedStatus = this.message.receivedStatus;
                return receivedStatus !== utils.receivedStatus.LISTENED;
            },
            isReceiver: function (){
                var messageDirection = this.message.messageDirection;
                return messageDirection === utils.messageDirection.RECEIVE;
            }
        },
        beforeDestroy: function() {
            RongIMVoice.stop();
        },
        methods:{
            play: function () {
                play(this, im);
            }
        }
    };
    utils.asyncComponent(options, resolve, reject);
};

function mounted(context, im) {
    im.$on('voicemessage.stopother', function (message) {
        var equalMessage = common.equalMessage(message, context.message);
        if (!equalMessage && context.isPlaying) {
            context.isPlaying = false;
            var selfBase64 = context.message.content.content;
            RongIMVoice.stop(selfBase64);
        }
    });
    im.$on('voicemessage.autoplay', function (message) {
        var equalMessage = common.equalMessage(message, context.message);
        if (equalMessage) {
            play(context, im);
        }
    });
}

function widthStyle(context) {
    var duration = context.message.content.duration;
    var MIN_WIDTH = 36;
    var MAX_WIDTH = 200;
    var FIX = 164;
    var width = duration / 60 * FIX + MIN_WIDTH;
    return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width)) + 'px';
}

function play(context, im) {
    var isSupportAudio = utils.isSupportAudio;
    var messageApi = im.dataModel.Message;
    var base64 = context.message.content.content;
    im.$emit('voicemessage.stopother', context.message);
    if(isSupportAudio) {
        RongIMVoice.preLoaded(base64, function () {
            startPlay(context, messageApi, im);
        });
    } else {
        startPlay(context, messageApi, im);
    }
}

function startPlay(context, messageApi, im) {
    var second = context.message.content.duration;
    var base64 = context.message.content.content;
    if(context.isPlaying) {
        context.isPlaying = false;
        try {
            RongIMVoice.stop(base64);
        } catch(e) {
            utils.console.log('RongIMVoice.stop', e);
        }
    } else {
        context.isPlaying = true;
        var receivedStatus = context.message.receivedStatus;
        var LISTENED = utils.receivedStatus.LISTENED;
        var messageId = context.message.messageId;
        var unListened = receivedStatus !== LISTENED;
        if (messageId && unListened) {
            context.message.receivedStatus = LISTENED;
            messageApi.setMessageReceivedStatus(messageId, LISTENED);
        }
        try {
            setTimeout(function () {
                RongIMVoice.play(base64, second, function () {
                    context.isPlaying = false;
                    var msg = getNextUnreadVoice(context);
                    im.$emit('voicemessage.autoplay', msg);
                });
            }, 0);
        } catch(e) {
            utils.console.log('RongIMVoice.play', e);
        }
    }
}

function getNextUnreadVoice(context) {
    var list = context.messageList;
    var message = context.message;

    var result = null;
    var after = false;
    for (var i = 0, len = list.length; i < len; i++) {
        var item = list[i];
        if (after) {
            var RECEIVE = utils.messageDirection.RECEIVE;
            var LISTENED = utils.receivedStatus.LISTENED;
            var isReceiver = item.messageDirection === RECEIVE;
            var isVoice = item.messageType === 'VoiceMessage';
            var unListened = item.receivedStatus !== LISTENED;
            if (isReceiver && isVoice && unListened) {
                result = item;
                break;
            }
        } else if (common.equalMessage(item, message)) {
            after = true;
        }
    }
    return result;
}

})(RongIM, {
    jQuery: jQuery,
    RongIMLib: RongIMLib
}, RongIM.components);
