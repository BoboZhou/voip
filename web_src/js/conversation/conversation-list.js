'use strict';
(function (RongIM, dependencies, components) {

var common = RongIM.common;
var utils = RongIM.utils;
var $ = dependencies.jQuery;
var RongIMClient = dependencies.RongIMClient;

components.getConversationList = function (resolve, reject) {
    var im = RongIM.instance;
    var dataModel = im.dataModel;
    var options = {
        name: 'conversation-list',
        template: '#rong-template-conversation-list',
        data: function () {
            var params = im.$route.params;
            return {
                busy: true,
                auth: im.auth,
                conversation: {
                    conversationType: params.conversationType,
                    targetId: params.targetId
                },
                conversationList: [],
                contextBusy: {}
            };
        },
        mounted: function () {
            mounted(this, dataModel.Conversation, im);
        },
        created: function() {
            var context = this;
            im.addon.regSearch(function(){
                if(context.$refs.searchBox) {
                    context.$refs.searchBox.focus();
                }
            });
        },
        destroyed: function () {
            cleanup(this, dataModel.Conversation, dataModel.Message);
            im.addon.unregSearch();
        },
        computed: {
            status: function () {
                return im.status;
            }
        },
        watch: {
            status: function () {
                this.getConversationList();
            },
            $route: function (route) {
                routeChanged(this, route, dataModel.Conversation);
            }
        },
        mixins: [getContextMenu(), common.smoothScroll],
        components: {
            'search': components.getSearch,
            'latest-message': components.getLatestMessage,
            'avatar': components.getAvatar
        },
        methods: getMethods(im),
        activated: function () {
            this.getConversationList();
        }
    };
    utils.asyncComponent(options, resolve, reject);
};

function mounted(context, conversationApi, im) {
    var messagechanged = utils.debounce(context.getConversationList, 500);
    im.$on('messagechange', messagechanged);
    context.conversationWatch = function (list) {
        context.conversationList = list;
        scrollToTop(list, im);
    };
    conversationApi.watch(context.conversationWatch);
    context.getConversationList();
}

function cleanup(context, conversationApi, messageApi) {
    conversationApi.unwatch(context.conversationWatch);
    messageApi.unwatch();
}

function routeChanged(context, route, conversationApi) {
    var params = route.params;
    context.conversation = {
        conversationType: params.conversationType,
        targetId: params.targetId
    };

    function showDraft(item) {
        var path = item.conversationType + '/' + item.targetId;
        var draft = conversationApi.draft[path];
        context.$set(item, 'draft', draft);
    }
    context.conversationList.forEach(showDraft);
}

function getContextMenu() {
    var options = {
        template: '#rong-template-conversation-contextmenu',
        computed: {
            isTop: function () {
                return this.context.conversation.isTop;
            },
            isMute: function () {
                return this.context.conversation.notificationStatus;
            }
        },
        methods: {
            top: function () {
                this.$emit('top', this.context.conversation);
            },
            untop: function () {
                this.$emit('untop', this.context.conversation);
            },
            mute: function () {
                this.$emit('mute', this.context.conversation);
            },
            unmute: function () {
                this.$emit('unmute', this.context.conversation);
            },
            remove: function () {
                this.$emit('remove', this.context.conversation);
            },
            close: function () {
                this.$emit('close');
            }
        }
    };
    return components.getContextMenu(options);
}

function getMethods(im) {
    var dataModel = im.dataModel;
    var conversationApi = dataModel.Conversation;
    return {
        getUsername: common.getUsername,
        getGroupName: common.getGroupName,
        getGroupType: common.getGroupType,
        dateFormat: utils.dateFormat,
        getConversationList: function () {
            getConversationList(this, dataModel.Conversation, im);
        },
        isRichText: function (message) {
            if(message.messageType !== 'TextMessage') {
                return false;
            }
            var textContent = message.content.content;
            var content = common.convertMessage(textContent);
            return textContent !== content;
        },
        isFailed: function (message) {
            return message.sentStatus === utils.sentStatus.FAILED;
        },
        isCanceled: function (message) {
            return common.isCanceled(message);
        },
        isPrivate: function (item) {
            return item.conversationType === 1;
        },
        isGroup: function (item) {
            return item.conversationType === 3;
        },
        isEqual: sameConversaton,
        showGroupType: function (group) {
            return group && group.type > 0;
        },
        getMessageType: function (message) {
            return (message.messageType || '').toLowerCase();
        },
        fromMe: function (message) {
            return message.messageDirection === 1;
        },
        getSentStatus: function (message) {
            var sentStatus = utils.sentStatus[message.sentStatus] || '';
            return sentStatus.toLowerCase();
        },
        getRecievedStatus: function (message) {
            var status = utils.receivedStatus[message.receivedStatus] || '';
            return status.toLowerCase();
        },
        isOtherRead: function (message) {
            if (utils.isEmpty(message.sentStatus)) {
                // web 不支持存储消息状态默认置为已读
                message.sentStatus = utils.sentStatus.READ;
            }
            return message.sentStatus === utils.sentStatus.READ;
        },
        showSentStatus: function (message) {
            var isPrivate = this.isPrivate(message);
            var fromMe = this.fromMe(message);
            var messageTypes = [
                RongIMClient.MessageType.TextMessage,
                RongIMClient.MessageType.ImageMessage,
                RongIMClient.MessageType.FileMessage,
                RongIMClient.MessageType.VoiceMessage,
                RongIMClient.MessageType.CardMessage,
                RongIMClient.MessageType.LocationMessage
            ];
            var existed = messageTypes.indexOf(message.messageType) >= 0;
            return isPrivate && fromMe && existed;
        },
        getUnreadMessageCount: function (item) {
            var count = item.unreadMessageCount;
            return count > 99 ? '...' : count;
        },
        top: function (conversation) {
            var context = this;
            var conversationType = conversation.conversationType;
            var targetId = conversation.targetId;
            var key = conversationType + '_' + targetId;
            if(context.contextBusy[key]){
                context.closeContextmenu();
                return;
            }
            context.contextBusy[key] = true;
            conversationApi.top(conversationType, targetId, function(){
                context.contextBusy[key] = false;
            });
            context.closeContextmenu();
        },
        untop: function (conversation) {
            var conversationType = conversation.conversationType;
            var targetId = conversation.targetId;
            conversationApi.untop(conversationType, targetId);
            this.closeContextmenu();
        },
        mute: function (conversation) {
            var conversationType = conversation.conversationType;
            var targetId = conversation.targetId;
            conversationApi.mute(conversationType, targetId);
            this.closeContextmenu();
        },
        unmute: function (conversation) {
            var conversationType = conversation.conversationType;
            var targetId = conversation.targetId;
            conversationApi.unmute(conversationType, targetId);
            this.closeContextmenu();
        },
        remove: function (conversation) {
            var context = this;
            var conversationType = conversation.conversationType;
            var targetId = conversation.targetId;
            conversationApi.remove(conversationType, targetId);
            context.closeContextmenu();
            // 删除的是当前会话则跳转到"主页"
            var params = context.$route.params;
            if (common.sameConversaton(params, conversation)) {
                context.$router.push({
                    name: 'conversation',
                    query: {
                        force: 1
                    }
                });
            }
        },
        showConversaton: function (conversation) {
            showConversaton(this, conversationApi, conversation, im);
        },
        convertMessage: common.convertMessage,
        showName: function (conversation) {
            return showName(this, conversation);
        },
        mentionMsgHasSelf: function (conversation) {
            var mentionMsg = conversation.mentionedMsg;

            // 判读这条@消息是谁发的如果是自己发的则不显示，暂用有无未读消息
            var hasUnRead = conversation.unreadMessageCount !== 0;
            if ($.isEmptyObject(mentionMsg)) {
                return false;
            }

            if (mentionMsg.mentionedInfo.type === utils.mentionedType.ALL) {
                return hasUnRead;
            }
            var userIdList = mentionMsg.mentionedInfo.userIdList;
            return userIdList.indexOf(im.auth.id) !== -1 && hasUnRead;
        },
        getId: function(conversation){
            var items = ['conversation', conversation.conversationType, conversation.targetId];
            return items.join('-');
        }
    };
}

function getConversationList(context, conversationApi, im) {
    if(context.status === utils.status.CONNECTED) {
        context.busy = true;
        conversationApi.getList(function (errorCode, list) {
            if(errorCode) {
                return common.handleError(errorCode);
            }

            // 有时候会话列表有数据的，接口却未能取到，所以仅当有数据时再更新会话列表
            if(list.length > 0) {
                context.conversationList = list;
                scrollToTop(context.conversationList, im);
            }
            context.busy = false;
            im.updateTotalUnreadCount(list);
        });
    }
}

function sameConversaton(one, another) {
    var oneConversationType = +one.conversationType;
    var anotherConversationType = +another.conversationType;
    var sameConversationType = oneConversationType === anotherConversationType;
    var sameTargetId = one.targetId === another.targetId;
    return sameConversationType && sameTargetId;
}

function showConversaton(context, conversationApi, conversation, im) {
    var conversationType = conversation.conversationType;
    var targetId = conversation.targetId;
    if(conversation.unreadMessageCount > 0) {
        conversationApi.clearUnReadCount(conversationType, targetId);
    }
    im.$emit('conversationchange', conversation);
    context.$router.push({
        name: 'conversation',
        params: {
            targetId: targetId,
            conversationType: conversationType
        }
    });
    context.conversation = conversation;
}

function showName(context, conversation) {
    var groupType = utils.conversationType.GROUP;
    var isGroup = conversation.conversationType === groupType;

    // SDK消息未解析 messageType 为 undefined 此处要判断
    var notGroupNotification = false;
    var messageType = conversation.latestMessage.messageType;
    if (!utils.isEmpty(messageType)) {
        notGroupNotification = messageType.indexOf('Group') !== 0 && messageType != "InformationNotificationMessage";
    }
    var user = conversation.latestMessage.user || {};
    var isOther = context.auth.id !== user.id;
    var username = !utils.isEmpty(common.getUsername(user));
    var notReCall = messageType !== 'RecallCommandMessage';
    return isGroup && notGroupNotification && isOther && username && notReCall;
}

function scrollToTop(conversationList, im) {
    conversationList = conversationList.filter(function(conversation) {
        return !conversation.isTop;
    });
    if(!conversationList[0]){
        return;
    }
    var lastMessage = conversationList[0]['latestMessage'];
    var senderUserId = lastMessage ? lastMessage.senderUserId : '';
    var loginUserId = im.loginUser ? im.loginUser.id : null;
    var isSelfSend = senderUserId === loginUserId;
    var conversationListContent = document.getElementById('conversationListContent');
    if (isSelfSend && conversationListContent) {
        conversationListContent.scrollTop = 0;
    }
}

})(RongIM, {
    jQuery: jQuery,
    RongIMClient: RongIMClient
}, RongIM.components);
