'use strict';
(function (RongIM, dependencies, components) {

var common = RongIM.common;
var utils = RongIM.utils;
var dialog = RongIM.dialog;
var $ = dependencies.jQuery;
var copyToClipboard = utils.copyToClipboard;
var config = RongIM.config;
var supportMessageTypeList = [
    'TextMessage',
    'ImageMessage',
    'FileMessage',
    'VoiceMessage',
    'GroupMemChangedNotifyMessage',
    'GroupNotifyMessage',
    'GroupCmdMessage',
    'LocationMessage',
    'NotificationMessage',
    'RecallCommandMessage',
    'LocalFileMessage',
    'LocalImageMessage',
    'InformationNotificationMessage',
    'CardMessage',
    'SightMessage',
    'ContactNotifyMessage',
    'VideoMessage',
    'AudioMessage',
    'ShareScreenMessage'
];

components.getMessageList = function (resolve, reject) {
    if (utils.isEmpty(config.bqmm.support)) {
        config.bqmm.support = true;
    }
    if (config.bqmm.support) {
        supportMessageTypeList.push('BQMMEmojiMessage');
    }

    var im = RongIM.instance;
    var options = {
        name: 'message-list',
        template: '#rong-template-message-list',
        props: ['conversation', 'append-message', 'status', 'group', 'in-group'],
        data: function () {
            var titleBarHeight = 55;
            return {
                busy: false,
                autoScroll: true,
                fixOffset: {
                    top: titleBarHeight
                },
                messageList: [],
                lastMessage: {}
            };
        },
        components: {
            avatar: components.getAvatar,
            TextMessage: components.getTextMessage,
            ImageMessage: components.getImageMessage,
            LocalImageMessage: components.getImageMessage,
            FileMessage: components.getFileMessage,
            LocalFileMessage: components.getFileMessage,
            VoiceMessage: components.getVoiceMessage,
            LocationMessage: components.getLocationMessage,
            CardMessage: components.getCardMessage,
            SightMessage: components.getSightMessage,
            VideoMessage: components.getVideoMessage,
            AudioMessage: components.getAudioMessage,
            ShareScreenMessage: components.getShareScreenMessage,
            BQMMEmojiMessage: components.getBQMMEmojiMessage,
            UnknownMessage: components.getUnknownMessage
        },
        computed: {
            conversationType: function () {
                return +this.$route.params.conversationType;
            },
            targetId: function () {
                return this.$route.params.targetId;
            },
            hasNewMessageTip: function () {
                return (!this.autoScroll) && (this.conversation.unreadMessageCount > 0);
            },
            disabled: function () {
                return !this.inGroup;
            }
        },
        mixins: [getContextMenu()],
        watch: {
            $route: function () {
                this.busy = false;
                this.getMessage();
            },
            messageList: function () {
                messageListChanged(this, im);
            },
            appendMessage: function (newMessage, oldMessage) {
                var changValid = utils.isEmpty(oldMessage) || (newMessage.messageUId !== oldMessage.messageUId);
                if (changValid) {
                    this.messageList.push(newMessage);
                }
            }
        },
        created: function () {
            created(this);
        },
        filters: {
            dateFormat: function (timestamp) {
                return utils.dateFormat(timestamp, {
                    alwaysShowTime: true
                });
            }
        }
    };
    options.methods = getMethods(im, options.components);
    utils.asyncComponent(options, resolve, reject);
};

function getContextMenu() {
    var options = {
        template: 'templates/conversation/message-contextmenu.html',
        computed: {
            message: function () {
                return this.context.message;
            },
            messageContent: function () {
                return this.message.content;
            },
            imageURL: function () {
                return this.messageContent.imageUri;
            },
            fileURL: function () {
                return this.messageContent.fileUrl;
            },
            filename: function () {
                return this.messageContent.name;
            },
            isSuccess: function () {
                var sentStatus = this.message.sentStatus;
                var read = sentStatus === utils.sentStatus.READ;
                var unread = sentStatus === utils.sentStatus.SENT;
                return utils.isEmpty(sentStatus) || read || unread;
            },
            showSave: function () {
                var isImageMessage = this.message.messageType === 'ImageMessage';
                return this.isSuccess && isImageMessage;
            },
            showDownload: function () {
                var isFileMessage = this.message.messageType === 'FileMessage';
                return this.isSuccess && isFileMessage;
            },
            showCopy: function () {
                var excludeList = [
                    'VoiceMessage',
                    'SightMessage',
                    'CardMessage',
                    'BQMMEmojiMessage',
                    'AudioMessage',
                    'VideoMessage',
                    'ShareScreenMessage'
                ];
                var show = excludeList.indexOf(this.message.messageType) < 0;
                return this.isSuccess && show;
            },
            showForward: function () {
                var excludeList = [
                    'VoiceMessage',
                    'BQMMEmojiMessage',
                    'AudioMessage',
                    'VideoMessage',
                    'ShareScreenMessage'
                ];
                var show = excludeList.indexOf(this.message.messageType) < 0;
                return this.isSuccess && show;
            },
            showRecall: function () {
                var excludeList = [
                    'AudioMessage',
                    'VideoMessage'
                ];
                var show = excludeList.indexOf(this.message.messageType) < 0;
                var isSent = this.message.messageDirection === 1;
                var time = (new Date().getTime() - this.message.sentTime);
                var isValidTime = time < RongIM.config.recallMessageTimeout;
                return this.isSuccess && isSent && isValidTime && show;
            }
        },
        methods: {
            close: function () {
                this.$emit('close');
            },
            recall: function () {
                this.$emit('recall', this.context.message);
            },
            copy: function () {
                this.$emit('copy', this.context.message);
            },
            forward: function () {
                this.$emit('forward', this.context.message);
            },
            remove: function () {
                this.$emit('remove', this.context.message);
            }
        }
    };
    return components.getContextMenu(options);
}

function messageListChanged(context, im) {
    var newMessage = context.messageList.slice(-1)[0] || {};
    newMessage.messageUId = newMessage.messageUId || (new Date).getTime();
    var hasNewMessage = context.lastMessage.messageUId !== newMessage.messageUId;
    var fromMe = newMessage.messageDirection === 1;
    if(hasNewMessage && fromMe) {
        context.autoScroll = true;
        context.lastMessage = newMessage;
    }

    // 接收到新消息并且新消息在最底部并且会话窗口处于激活状态，清除未读
    if(hasNewMessage && !fromMe && context.autoScroll && !im.hidden) {
        var conversationApi = im.dataModel.Conversation;
        conversationApi.clearUnReadCount(context.conversationType, context.targetId);
    }

    var otherInterval = 3 * 60 * 1000;
    var myInterval = 5 * 60 * 1000;
    var myAccountId = im.auth.id;
    var oldSentTime;
    context.messageList.forEach(function (item, index) {

        var support = supportMessageTypeList.indexOf(item.messageType) >= 0;
        if(!support) {
            item.messageType = 'UnknownMessage';
        }
        if(index === 0) {
            oldSentTime = item.sentTime;
            context.$set(item, '_showTime', true);
            return;
        }

        var interval = item.senderUserId === myAccountId ? myInterval : otherInterval;
        var sentTime = item.sentTime || (new Date).getTime();
        if(sentTime - oldSentTime > interval) {
            oldSentTime = item.sentTime;
            context.$set(item, '_showTime', true);
        } else {
            context.$set(item, '_showTime', false);
        }
    });

    context.autoScroll && context.scrollToMessage('bottom', false);
}

function created(context) {
    var unwatch = context.$watch('status', function (status) {
        if(status === utils.status.CONNECTED) {
            unwatch();
            context.getMessage();
        }
    });
    context.getMessage();
}

function getMethods(im, childComponents) {
    var dataModel = im.dataModel;
    return {
        reset: function () {
            this.messageList = [];
        },
        getMessage: function () {
            getMessage(this, dataModel.Message);
        },
        getUsername: common.getUsername,
        getMessageType: function (item) {
            var supported = childComponents[item.messageType];
            return supported ? item.messageType : 'UnknownMessage';
        },
        isGroupNotificationMessage: function (message) {
            var NOTICE_ACTION = 3;
            var content = message.content || {};
            var isNotice = content.action === NOTICE_ACTION;
            var isGroupNotification = message.messageType === 'GroupNotifyMessage';
            if(isGroupNotification && isNotice) {
                return false;
            }
            var list = [
                'GroupMemChangedNotifyMessage',
                'GroupNotifyMessage'
            ];
            return list.indexOf(message.messageType) >= 0;
        },
        getNotification: function (item) {
            return item.content.content;
        },
        getGroupNotification: function (item){
            return common.getGroupNotification(item, im.auth.id);
        },
        getRecallCommand: function (item) {
            return getRecallCommand(item, im.auth, this);
        },
        getContactNotification: function (item){
            return common.getContactNotification(item.content, im.auth.id);
        },
        getInformationNotificationMessage: function (item){
            var content = item.content.message;
            if(content.messageName === 'ContactNotifyMessage'){
                return common.getContactNotification(content, im.auth.id);
            }
            return content;
        },
        getMessageStatus: function (message) {
            if(utils.isEmpty(message.sentStatus)) {
                // 接收消息的 sentStatus 为空
                return ;
            }
            var status = utils.sentStatus[message.sentStatus];
            if(common.isCanceled(message)){
                status = 'SENT';
            }
            return status.toLowerCase();
        },
        isImageMessage: function (item) {
            return item.messageType === 'ImageMessage';
        },
        recall: function (message) {
            recall(this, message, dataModel.Message);
        },
        copy: function (message) {
            copy(this, message);
        },
        forward: function (message) {
            forward(this, message);
        },
        remove: function (message) {
            remove(this, message, dataModel.Message);
        },
        userProfile: dialog.user,
        scrollToMessage: function (messageId, alignToTop) {
            var $content = $(this.$refs.content);
            function waitImageLoad() {
                var el = document.getElementById('rong-message-' + messageId);
                el && el.scrollIntoView(alignToTop);
                $content && $content.css('visibility', '');
            }
            setTimeout(waitImageLoad, 200);
        },
        scrollToNewMessage: function (unreadMessageCount) {
            scrollToNewMessage(this, unreadMessageCount);
        },
        scroll: utils.throttle(function (event) {
            if(im.status === utils.status.CONNECTED) {
                scroll(this, event);
            }
        }, 500),
        getHistory: utils.debounce(function () {
            getHistory(this, dataModel.Message);
        }, 500, true),
        clearUnReadCount: function () {
            clearUnReadCount(this, dataModel.Conversation, this.conversation, im);
        },
        reSendMessage: function (message) {
            if(message.sentStatus === utils.sentStatus.FAILED && this.inGroup) {
                var api = {
                    message: dataModel.Message,
                    file: dataModel.File
                };
                reSendMessage(api, message, this.messageList, this);
            }
        },
        uploadCancel: function(message, messageList) {
            var _messageList = messageList || this.messageList;
            var index = _messageList.indexOf(message);
            _messageList.splice(index, 1);
        },
        isValidMessage: function (message) {
            return message.messageType !== 'UnknownMessage';
        },
        isLastMessage: function (message) {
            var lastMessage = this.messageList.slice(-1)[0] || message;
            return message.messageUId === lastMessage.messageUId;
        },
        showGroupResp: function (message) {
            var send = message.messageDirection === utils.messageDirection.SEND;
            var isGroup = message.conversationType === utils.conversationType.GROUP;
            return this.isValidMessage(message) && send && isGroup;
        },
        showPrivateResp: function (message) {
            var excludeList = [
                'AudioMessage',
                'VideoMessage',
                'ShareScreenMessage'
            ];
            var show = excludeList.indexOf(message.messageType) === -1;
            var send = message.messageDirection === utils.messageDirection.SEND;
            var isPrivate = message.conversationType === utils.conversationType.PRIVATE;
            return this.isValidMessage(message) && send && isPrivate && show;
        },
        fromMe: function (message) {
            return message.messageDirection === 1;
        },
        isUnRead: function (message) {
            return message.sentStatus === utils.sentStatus.SENT;
        },
        isRead: function (message) {
            return message.sentStatus === utils.sentStatus.READ;
        },
        ableSendGroupReq: function (message) {
            // 30 发送成功 40 对方已接收 50 对方已读 60 对方已销毁。 大于 30 都记为发送成功
            var isSendSuccess =  message.sentStatus >= utils.sentStatus.SENT;
            var isSendLastMessage = isLatestSentMessage(message, this);
            return utils.isEmpty(message.receiptResponse) && isSendSuccess && isSendLastMessage;
        },
        sendGroupReq: function (message) {
            Vue.set(message, 'receiptResponse', []);
            dataModel.Message.sendGroupRequest(message);
        },
        hasGroupResp: function (message) {
            return $.isArray(message.receiptResponse);
        },
        getUnreadCount: function (message) {
            var unreadMember = getUnreadMember(this, message, im);
            var unreadCount = unreadMember ? unreadMember.length : -1;
            return unreadCount;
        },
        showUnreadMember: function (message) {
            var userApi = dataModel.User;
            var readMember = message.receiptResponse;
            var unreadMember = getUnreadMember(this, message, im).map(function (item) {
                return item.id;
            });
            var arr = unreadMember.concat(readMember);
            userApi.getBatch(arr, function (errorCode, userList) {
                dialog.ack(userList, readMember);
            });
            // userApi.get(arr, function (errorCode, userList) {
            //     dialog.ack(userList, readMember);
            // });
        }
    };
}

function isLatestSentMessage(message, context) {
    if (context.$route.query.messageUId) {
        return false;
    }
    var latestSentMessage = getLatestSentMessage(context.messageList);
    if (!latestSentMessage) {
        return false;
    }
    return common.equalMessage(latestSentMessage, message);
}
function getLatestSentMessage(list) {
    var sentList = list.filter(function (item) {
        return item.messageDirection === utils.messageDirection.SEND;
    });
    return sentList[sentList.length - 1];
}

function getUnreadMember(context, message, im) {
    var unreadMember = null;
    var group = context.conversation.group;
    if (group) {
        var readMember = message.receiptResponse || [];
        var timestamp = message.sentTime;
        unreadMember = group.memberBrief.filter(function (item) {
            var valid = item.createDt < timestamp;
            var unread = readMember.indexOf(item.id) === -1;
            var notSelf = im.auth.id !== item.id;
            return valid && unread && notSelf;
        });
    }
    return unreadMember;
}

function getMessage(context, messageApi) {
    if(context.status !== utils.status.CONNECTED || context.busy) {
        return;
    }
    context.messageList = [];
    context.autoScroll = true;
    context.busy = true;

    // 切换会话后加载消息列表，等消息列表滚动后再显示，避免视觉上的抖动
    var $content = $(context.$refs.content);
    $content.css('visibility', 'hidden');

    var query = context.$route.query;
    if (utils.isEmpty(query.messageUId)) {
        messageApi.get({
            conversationType: context.conversationType,
            targetId: context.targetId,
            position: 1,
            timestamp: 0
        }, function(errorCode, list) {
            context.busy = false;
            if(errorCode) {
                return common.handleError(errorCode);
            }
            context.$nextTick(function () {
                context.messageList = list;
                context.scrollToMessage('bottom');
            });
        });
    } else {
        messageApi.getMessageNearList(query.messageUId, function (errorCode, list, msg) {
            context.busy = false;
            if (errorCode) {
                return common.handleError(errorCode);
            }
            context.messageList = list;
            context.autoScroll = false;
            context.scrollToMessage(msg.messageId);
        });
    }
}

function scroll(context, event) {
    var up = event.deltaY < 0;
    var $content = $(context.$refs.content);
    if(up && $content.scrollTop() <= 0) {
        context.getHistory();
    } else {
        var DISTANCE_TO_BOTTOM = 50;
        var autoScroll = $content[0].scrollHeight - $content.height() - $content.scrollTop() < DISTANCE_TO_BOTTOM;
        autoScroll && context.clearUnReadCount();
        context.autoScroll = autoScroll;
    }
}

function getHistory(context, messageApi) {
    var disconnected = context.status !== utils.status.CONNECTED;
    if(context.busy || disconnected) {
        return;
    }

    context.busy = true;
    context.autoScroll = false;
    var firstMessage = context.messageList[0];
    var sentTime = context.messageList.length > 0 ? context.messageList[0].sentTime : 0;
    var params = {
        conversationType: context.conversationType,
        targetId: context.targetId,
        position: 2,
        timestamp: sentTime
    };
    messageApi.get(params, function (errorCode, list) {
        context.busy = false;
        list.reverse().forEach(function (item) {
            context.messageList.unshift(item);
        });
        firstMessage && context.scrollToMessage(firstMessage.messageId);
    });
}

function getRecallCommand(message, auth, context) {
    var locale = context.locale;
    var isMe = message.senderUserId === auth.id;
    var name = message.user.name;
    var result = context.localeFormat(locale.message.recallOther, name);
    if (isMe) {
        result = locale.message.recallSelf;
    }
    return result;
}

function recall(context, message, messageApi) {
    var time = new Date().getTime() - message.sentTime;
    var isValidTime = time < RongIM.config.recallMessageTimeout;
    if (isValidTime) {
        messageApi.recall(message, function () {
            // 撤回成功
        });
    } else {
        common.messagebox(common.getErrorMessage('message-recall-timeout'));
    }
    context.closeContextmenu();
}

function copy(context, message) {
    message.content.messageName = message.messageType;
    var str = JSON.stringify(message.content);
    if (message.messageType === 'TextMessage') {
        str = message.content.content;
    }
    copyToClipboard(str);
    context.closeContextmenu();
}

function forward(context, message) {
    RongIM.dialog.forward(message.content);
    context.closeContextmenu();
}

function remove(context, message, messageApi) {
    if (message.messageId) {
        var params = {
            conversationType: message.conversationType,
            targetId: message.targetId,
            messageIds: [message.messageId]
        };
        messageApi.removeLocal(params, function () {
            // 删除成功
        });
    } else {
        utils.console.log('没有 messageId web 端不支持删除');
    }
    context.closeContextmenu();
}

function clearUnReadCount(context, conversationApi, conversation) {
    if(conversation.unreadMessageCount > 0) {
        conversationApi.clearUnReadCount(context.conversationType, context.targetId);
    }
}

function scrollToNewMessage(context, unreadMessageCount) {
    context.clearUnReadCount();
    var index = context.messageList.length - unreadMessageCount;
    var messageId = context.messageList[index].messageId;
    context.scrollToMessage(messageId);
    context.autoScroll = true;
}

function reSendMessage(api, message, messageList, context) {
    var messageApi = api.message;
    var content = reMessage(message, api, context);
    if (utils.isEmpty(content)) {
        utils.console.log('此消息暂不支持重发:', message);
        return;
    }

    var params = {
        targetId: message.targetId,
        conversationType: message.conversationType
    };
    params.messageIds = [message.messageId];
    messageApi.removeLocal(params);
    messageApi.send({
        conversationType: message.conversationType,
        targetId: message.targetId,
        content: content,
        mentiondMsg: !utils.isEmpty(content.mentionedInfo)
    }, function(errcode){
        if(errcode){
            var errMsg = common.getErrorMessage(errcode);
            if(errcode === 'lib-' + RongIMLib.ErrorCode.NOT_IN_GROUP){
                var params = common.createNotificationMessage(message.conversationType, message.targetId, errMsg);
                messageApi.insertMessage(params);
                context.$emit('setInGroup', false);
            }
        }
    });
}

function reMessage(message, api, context) {
    var msg = null;
    switch (message.messageType) {
        case 'TextMessage':
            msg = new RongIM.dataModel.Message.TextMessage(message.content);
            break;
        case 'ImageMessage':
            msg = new RongIM.dataModel.Message.ImageMessage(message.content);
            break;
        case 'LocalImageMessage':
            reSendLocalFile(context, message, api);
            break;
        case 'FileMessage':
            msg = new RongIM.dataModel.Message.FileMessage(message.content);
            break;
        case 'LocalFileMessage':
            reSendLocalFile(context, message, api);
            break;
        default:
            $.noop();
            break;
    }
    return msg;
}

function reSendLocalFile(context, message, api) {
    var path = message.content.localPath;
    var file = RongIM.file;
    var uploadFile = file.getBlobByPath(path);
    var messageApi = api.message;
    var params = {};
    if (uploadFile) {
        // 删除原来消息
        params = {
            targetId: message.targetId,
            conversationType: message.conversationType
        };
        params.messageIds = [message.messageId];
        messageApi.removeLocal(params);

        // 重新上传
        params = {
            targetId: message.targetId,
            conversationType: message.conversationType,
            data: uploadFile,
            localPath: path
        };
        var config = RongIM.config.upload.file;
        var uploadMessage = api.file.createUploadMessage(params);
        uploadMessage.content.localPath = path;
        upload(context, uploadMessage, config, api);
    } else {
        var type = message.conversationType;
        var id = message.targetId;
        var fileUnexist = context.locale.tips.fileUnexist;
        params = common.createNotificationMessage(type, id, fileUnexist);
        messageApi.insertMessage(params);
    }
}

function upload(context, uploadMessage, config, api) {
    var fileApi = api.file;
    var messageApi = api.message;
    fileApi.upload(uploadMessage, config, function (errorCode, uploadMessage, data) {
        if (errorCode) {
            return ;
        }
        fileApi.addFileUrl(uploadMessage, data, function (errorCode, uploadMessage) {
            fileApi.send(uploadMessage, function (errorCode, uploadMessage) {
                if (errorCode) {
                    var errMsg = common.getErrorMessage(errorCode);
                    if(errorCode === RongIMLib.ErrorCode.NOT_IN_GROUP){
                        var params = common.createNotificationMessage(uploadMessage.conversationType, uploadMessage.targetId, errMsg);
                        messageApi.insertMessage(params);
                        context.$emit('setInGroup', false);
                    }
                } else {
                    var im = RongIM.instance;
                    im.$emit('messagechange');
                }
            });
        });
    });
}

})(RongIM, {
    jQuery: jQuery
}, RongIM.components);
