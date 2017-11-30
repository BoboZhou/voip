'use strict';
(function (RongIM, dependencies, components) {

var common = RongIM.common;
var utils = RongIM.utils;
var dialog = RongIM.dialog;
var $ = dependencies.jQuery;
var CallType = common.CallType;
var RongIMLib = dependencies.RongIMLib;

components.getConversation = function (resolve, reject) {
    var im = RongIM.instance;
    var support = im.config.support;
    var dataModel = im.dataModel;
    var userApi = dataModel.User;
    var addon = RongIM.addon;
    var options = {
        name: 'conversation',
        template: 'templates/conversation/conversation.html',
        data: function() {
            return {
                busy: false,

                /*
                panel可选值：
                conversation-setting: 单聊设置
                group-setting: 群聊设置
                history: 历史消息
                */
                panel: null,
                conversation: {
                    conversationType: this.conversationType,
                    targetId: this.targetId
                },
                newMessage: null,
                userStatus: 'offline',
                autoFocus: true,
                inGroup: true
            };
        },
        computed: getComputed(im),
        components: {
            'status': components.getStatus,
            'avatar': components.getAvatar,
            'message-list': components.getMessageList,
            'message-input': components.getMessageInput,
            'history': components.getHistory,
            'conversation-setting': components.getConversationSetting,
            'group-setting': components.getGroupSetting
        },
        mounted: function () {
            var api = {
                status: dataModel.Status,
                conversation: dataModel.Conversation,
                group: dataModel.Group,
                user: dataModel.User
            };
            mounted(this, api, im);
            userChanged(this, dataModel.User, this.$route.params);
        },
        created: function() {
            var context = this;
            im.$on('conversationchange', function (conversation) {
                context.conversation = conversation;
            });

            if(support.screenshot) {
                addon.regScreeshot(function() {
                    if(context.$refs.editor) {
                        context.$refs.editor.focus();
                        document.execCommand('Paste');
                    }
                });
            }
        },
        destroyed: function () {
            im.$off('conversationchange');
            cleanup(dataModel.Group);
            addon.unregScreeshot();
        },
        watch: {
            $route: function (newValue, oldValue) {
                if (newValue.query.messageUId && !newValue.params.focus) {
                    this.autoFocus = false;
                } else {
                    this.autoFocus = true;
                }
                routeChanged(this, newValue, oldValue);
                userChanged(this, userApi, newValue.params, oldValue.params);
            },
            'conversation.group': function (group) {
                if(this.validGroup) {
                    groupChanged(this, dataModel.User, group, im);
                }
            }
        },
        methods: getMethods(im)
    };
    utils.asyncComponent(options, resolve, reject);
};

function getComputed(im) {
    return {
        status: function () {
            return im.status;
        },
        isConversationView: function () {
            return !utils.isEmpty(this.conversationType) && !utils.isEmpty(this.targetId);
        },
        conversationType: function () {
            return +this.$route.params.conversationType;
        },
        targetId: function () {
            return this.$route.params.targetId;
        },
        isGroup: function () {
            return this.conversationType === utils.conversationType.GROUP;
        },
        validGroup: function () {
            var group = this.conversation.group;
            return group && group.memberIdList && group.memberIdList.indexOf(im.auth.id) >= 0;
        },
        isPrivate: function () {
            return this.conversationType === utils.conversationType.PRIVATE;
        },
        members: function () {
            return this.isGroup ? (this.conversation.group || {}).members : [];
        },
        disabled: function () {
            return !this.inGroup;
        },
        voipTip: function () {
            var isAudio = im.voip.type === 1;
            if (isAudio) {
                return this.locale.voip.audioTip;
            }
            if (im.voip.sharing) {
                return this.locale.voip.shareScreenTip;
            }
            return this.locale.voip.videoTip;
        }
    };
}

function mounted(context, api, im) {
    if(context.status === utils.status.CONNECTED) {
        context.conversationChanged();
    } else {
        var unwatch = context.$watch('status', function (newValue) {
            if(newValue === utils.status.CONNECTED) {
                context.conversationChanged();
                unwatch();
            }
        });
    }

    api.conversation.watch(function (list) {
        var params = context.$route.params;
        var conversation = list.filter(function (item) {
            return sameConversaton(item, params);
        })[0];
        if(conversation) {
            var unreadMessageCount = conversation.unreadMessageCount;
            context.conversation.unreadMessageCount = unreadMessageCount;
        }
    });

    api.group.watch(function (group) {
        im.$emit('messagechange');
        var currentGroup = context.conversation.group;
        if(currentGroup && group.id === currentGroup.id) {
            context.conversation.group = group;
        }
    });

    api.user.watch(function (user) {
        var currentUser = context.conversation.user;
        if (currentUser && currentUser.id === user.id) {
            $.extend(context.conversation.user, user);
            context.userStatus = getUserOnlineStatus(context.conversation.user);
        }
    });

    var query = context.$route.query;
    if(!utils.isEmpty(query.keyword)) {
        context.panel = 'history';
    }
}

function sameConversaton(one, another) {
    var sameConversationType = one.conversationType === another.conversationType;
    var sameTargetId = one.targetId === another.targetId;
    return sameConversationType && sameTargetId;
}

function cleanup(groupApi) {
    groupApi.unwatch();
}

function routeChanged(context) {
    context.conversationChanged();
    if(context.isGroup) {
        context.inGroup = true;
    }
}

function groupChanged(context, userApi, group, im) {
    userApi.get(group.adminId, function (errorCode, user) {
        if(errorCode) {
            return common.handleError(errorCode);
        }
        var thisGroup = context.conversation.group;
        context.$set(thisGroup, 'creatorName', common.getUsername(user));
        context.$set(thisGroup, 'isCreator', group.adminId === im.auth.id);
    });
}

function getUserOnlineStatus(user) {
    var time = 0;
    var status = 'offline';
    for (var title in user.onlineStatus) {
        if(user.onlineStatus.hasOwnProperty(title)) {
            var item = user.onlineStatus[title];
            if (time < item.updateDt && item.value !== 'offline') {
                time = item.updateDt;
                var isMobile = (item.title === 'Login_Status_Mobile');
                status = isMobile ? 'mobile' : item.value;
            }
        }
    }
    return status;
}

function userChanged(context, userApi, newValue, oldValue) {
    var newUserId = getUserId(newValue);
    var oldUserId = getUserId(oldValue);
    watchUserStatus(newUserId, userApi);
    unwatchUserStatus(oldUserId, userApi);
}

function getUserId(params){
    params = params || {};
    var userId = '';
    if(+params.conversationType === utils.conversationType.PRIVATE) {
        userId = params.targetId;
    }
    return userId;
}

var userStatusInterval = null;
function watchUserStatus(userId, userApi) {
    clearInterval(userStatusInterval);
    if(utils.isEmpty(userId)) {
        return;
    }
    var duration = 1800;
    userApi.subscribe(userId, duration);
    userStatusInterval = setInterval(function () {
        userApi.subscribe(userId, duration);
    }, duration * 1000);
}
function unwatchUserStatus(userId, userApi) {
    if(utils.isEmpty(userId)) {
        return;
    }
    userApi.unsubscribe(userId);
}

function getMethods(im) {
    var dataModel = im.dataModel;
    return {
        getUsername: common.getUsername,
        getGroupName: common.getGroupName,
        getGroupType: common.getGroupType,
        userProfile: dialog.user,
        getStatusText: function () {
            var localeStatus = this.locale.components.onlineStatus;
            // var map = {
            //     online: localeStatus.online,
            //     mobile: localeStatus.mobile,
            //     leave: localeStatus.leav,
            //     busy: localeStatus.busy,
            //     offline: localeStatus.offline
            // };
            return localeStatus[this.userStatus];
        },
        reset: function () {
            this.conversation = {
                conversationType: this.conversationType,
                targetId: this.targetId
            };
            this.messageList = [];
            this.panel = null;
        },
        conversationChanged: function () {
            if(utils.isEmpty(this.conversationType) || utils.isEmpty(this.targetId)) {
                return;
            }
            var api = {
                conversation: dataModel.Conversation,
                group: dataModel.Group
            };
            conversationChanged(this, api, im);
        },
        setProperty: function (key, value) {
            // key可能是个路径，例如'group.save'
            var keys = key.split('.');
            var lastKey = keys.slice(-1)[0];
            keys = keys.slice(0, -1);
            var obj = this.conversation;
            keys.forEach(function (item) {
                obj = obj[item];
            });
            this.$set(obj, lastKey, value);
        },
        clearUnReadCount: function () {
            dataModel.Conversation.clearUnReadCount(this.conversationType, this.targetId);
        },
        // appendToMessageList: function (list) {
        //     this.messageList.unshift.apply(this.messageList, list);
        // },
        sendTextMessage: function(message) {
            var api = {
                conversation: dataModel.Conversation,
                message: dataModel.Message
            };
            sendTextMessage(this, api, message);
        },
        hidePanel: function () {
            this.panel = null;
        },
        append: function(message) {
            this.newMessage = message;
        },
        sendCopyMessage: function (message) {
            var context = this;
            var conversationType = context.conversationType;
            var targetId = context.conversation.targetId;
            dataModel.Message.send({
                conversationType: conversationType,
                targetId: targetId,
                content: message
            });
        },
        prepareinput: function () {
            var context = this;
            var query = context.$route.query;
            if (query.messageUId) {
                context.$router.push({
                    name: 'conversation',
                    params: {
                        conversationType: context.conversationType,
                        targetId: context.targetId
                    }
                });
            }
        },
        setInGroup: function (boolean) {
            this.inGroup = boolean;
        },
        sendVideo: function () {
            if (im.voip.busy) {
                common.messagebox({ message: this.voipTip});
            } else {
                var params = {
                    conversation: this.conversation,
                    type: CallType.MEDIA_VEDIO
                };
                RongIM.voip.invite(params, dataModel.User);
            }
        },
        sendAudio: function () {
            if (im.voip.busy) {
                common.messagebox({ message: this.voipTip});
            } else {
                var params = {
                    conversation: this.conversation,
                    type: CallType.MEDIA_AUDIO
                };
                RongIM.voip.invite(params, dataModel.User);
            }
        },
        shareScreen: function () {
            if (!RongIM.config.support.voip) {
                return;
            }
            if (im.voip.busy) {
                common.messagebox({ message: this.voipTip});
            } else {
                var params = {
                    conversation: this.conversation,
                    type: CallType.MEDIA_VEDIO,
                    isShareScreen: true
                };
                RongIM.voip.invite(params, dataModel.User);
            }
        }
    };
}

function conversationChanged(context, api, im) {
    var conversationApi = api.conversation;
    var conversationType = context.conversationType;
    var targetId = context.targetId;
    if(context.$refs.list) {
        context.$refs.list.reset();
    }
    conversationApi.getOne(conversationType, targetId, function (errorCode, conversation) {
        var isGroup = conversationType === utils.conversationType.GROUP;
        if(errorCode && !isGroup) {
            return common.handleError(errorCode);
        }

        context.reset();
        conversation = conversation || {
            conversationType: conversationType,
            targetId: targetId
        };

        var currentConversation = {
            conversationType: context.conversationType,
            targetId: context.targetId
        };
        if(!sameConversaton(conversation, currentConversation)) {
            return;
        }

        var draft = conversationApi.getDraft(conversationType, targetId);
        if(context.$refs.editor) {
            context.$refs.editor.reset();
        }
        conversation.draft = draft;
        context.conversation = conversation;

        if(context.isPrivate) {
            context.userStatus = getUserOnlineStatus(context.conversation.user);
        }
        api.group.watch(function () {
            im.$emit('messagechange');
            getMembers(context, api.group, targetId);
        });
        context.isGroup && getMembers(context, api.group, targetId);
    });
}

function getMembers(context, groupApi, groupId) {
    groupApi.getMembers(groupId, function (errorCode, members) {
        if(errorCode) {
            return common.handleError(errorCode);
        }
        var isGroup = context.conversationType === utils.conversationType.GROUP;
        if(isGroup && context.targetId === groupId) {
            context.$set(context.conversation.group, 'members', members);
        }
    });
}

function sendTextMessage(context, api, message) {
    if (!message.text) {
        return false;
    }
    var conversationType = context.conversationType;
    var targetId = context.targetId;
    message.text = RongIMLib.RongIMEmoji.symbolToEmoji(message.text);
    var textMsg = api.message.TextMessage.obtain(message.text);

    var mentiondMsg = false;
    if(message.at && message.at.length > 0) {
        var mentioneds = new RongIMLib.MentionedInfo();
        var userIdList = message.at.map(function(item){
            return item.id;
        });
        var isAtAll = userIdList.indexOf(0) !== -1;
        if (isAtAll) {
            mentioneds.type = utils.mentionedType.ALL;
            mentioneds.userIdList = [];
        } else {
            mentioneds.type = utils.mentionedType.PART;
            mentioneds.userIdList = userIdList;
        }

        textMsg.mentionedInfo = mentioneds;
        mentiondMsg = true;
    }

    api.message.send({
        conversationType: conversationType,
        targetId: targetId,
        content: textMsg,
        mentiondMsg: mentiondMsg
    }, function (errorCode){
        if(errorCode) {
            var ignoreErrorCodeMap = [
                'lib--1',
                'lib-30001',
                'lib-30003'
            ];
            var existed = ignoreErrorCodeMap.indexOf(errorCode) >= 0;
            if (existed) {
                return;
            }
            var errMsg = common.getErrorMessage(errorCode);
            if(errorCode !== 'lib-' + RongIMLib.ErrorCode.NOT_IN_GROUP){
                return common.handleError(errorCode);
            }
            var params = common.createNotificationMessage(conversationType, targetId, errMsg);
            api.message.insertMessage(params);
            context.inGroup = false;
        }
    });
    api.conversation.clearDraft(conversationType, targetId);
    context.clearUnReadCount();
}

})(RongIM, {
    RongIMLib: RongIMLib,
    jQuery: jQuery
}, RongIM.components);
