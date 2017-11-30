'use strict';
(function(RongIM, dependencies, components) {

var utils = RongIM.utils;
var common = RongIM.common;
var $ = dependencies.jQuery;

RongIM.dialog.userRequest = function (userId) {
    var im = RongIM.instance;
    var options = {
        name: 'user-request',
        template: '#rong-template-user-request',
        data: function() {
            return {
                avatarEditable: false,
                aliasEditable: false,
                user: null,
                alias: '',
                //用户是否是当前登录用户
                isLoginUser: false,
                //用户是否是内部员工
                isStaff: false,
                //是否好友
                isFriend: false,
                //是否有好友请求
                isRequesting: true
            };
        },
        components: {
            avatar: components.getAvatar,
            'edit-avatar': components.editAvatar
        },
        directives: {
            focus: {
                inserted: function (el) {
                    el.focus();
                }
            }
        },
        computed: {
            showStar: function () {
                return this.isStaff && !this.isLoginUser || this.isFriend;
            },
            showEditAlias: function () {
                if(im.auth.isStaff){
                    if((this.isStaff || this.isFriend) && !this.isLoginUser){
                        return true;
                    }
                } else {
                    if(this.isFriend){
                        return true;
                    }
                }
                return false;
            },
            userName: function () {
                var name = this.user.name;
                if(!this.isStaff && !this.isFriend && !this.isLoginUser && !this.isRequesting){
                    // name = name.replace(/.(?=.)/g, '*');  //只显示最后一个字
                    name = name.replace(/.$/g, '*');
                }
                return name;
            }
        },
        created: function() {
            var api = {
                user: im.dataModel.User,
                friend: im.dataModel.Friend
            };
            created(this, api, userId, im);
        },
        destroyed: function () {
            im.dataModel.User.unwatch(this.userwatch);
        },
        methods: getMethods(im, userId)
    };

    common.mountDialog(options, function (instance) {
        RongIM._user = instance;
    });
};

function created(context, api, userId, im) {
    var auth = im.auth;
    if(userId === auth.id){
        context.isLoginUser = true;
    }
    if(auth.isStaff){
        api.user.getDetail(userId, function(errorCode, user) {
            if(errorCode) {
                return common.handleError(errorCode);
            }
            context.isStaff = (user.user_type === common.UserType.STAFF);
            getFriendInfo(context, api.friend, user);
        });
    } else {
        api.user.get(userId, function(errorCode, user) {
            if(errorCode) {
                return common.handleError(errorCode);
            }
            context.isStaff = false;
            getFriendInfo(context, api.friend, user);
        });
    }
    context.userwatch = function (user) {
        if (context.user && user.id === context.user.id) {
            $.extend(context.user, user);
        }
    };
    api.user.watch(context.userwatch);
}

function getFriendInfo(context, friendApi, user) {
    var userId = user.id;
    delete user.tel;
    context.user = user;
    var cacheFriend = friendApi.getCacheFriend(userId);
    if(cacheFriend){
        context.isFriend = true;
        context.user.mobile = cacheFriend.tel;
    } else {
        friendApi.getFriend(userId, function(errorCode, friend){
            if(errorCode){
                context.isFriend = false;
                return;
            }
            context.isFriend = true;
            context.user.mobile = friend.tel;
        });
    }

    var requestInfo = friendApi.getRequest(userId);
    user.requestInfo = requestInfo;
    context.isRequesting = requestInfo && requestInfo.state === common.FriendState.INVITEE;
}

function getMethods(im, userId) {
    var dataModel = im.dataModel;
    var friendApi = im.dataModel.Friend;
    var conversationApi = im.dataModel.Conversation;
    return {
        setAliasEditable: function() {
            setAliasEditable(this);
        },
        setAvatarEditable: function() {
            this.avatarEditable = true;
        },
        setAlias: function() {
            setAlias(this, dataModel.User, this.user.id, this.alias);
        },
        cancelAlias: function () {
            this.alias = this.user.alias;
            this.aliasEditable = false;
        },
        setStar: function() {
            setStar(this, dataModel.Star, userId);
        },
        unsetStar: function() {
            unsetStar(this, dataModel.Star, userId);
        },
        startConversation: function() {
            startConversation(this, im.$router);
        },
        srcChanged: function (src) {
            this.user.avatar = src;
        },
        addFriend: function () {
            addFriend(this);
        },
        removeFriend: function () {
            var context = this;
            common.messagebox({
                type: 'confirm',
                message: context.locale.removeFriendBefore,
                submitText: context.locale.btns.remove,
                callback: function () {
                    utils.console.info('TODO 删除好友');
                    var api = {
                        friend: friendApi,
                        conversation: conversationApi
                    };
                    removeFriend(context, api, userId, im);
                }
            });
        },
        acceptFriend: function() {
            acceptFriend(this, friendApi, this.user.requestInfo);
        },
        close: function() {
            this.user = null;
        }
    };
}

function setAliasEditable(context) {
    context.alias = context.user.alias;
    context.aliasEditable = true;
}

function setAlias(context, userApi, userId, alias) {
    userApi.setAlias(userId, alias, function (errorCode) {
        if(errorCode) {
            return common.handleError(errorCode);
        }
        context.user.alias = context.alias;
        context.aliasEditable = false;
    });
}

function setStar(context, starApi, userId) {
    starApi.star(userId, function(errorCode) {
        if(errorCode) {
            return common.handleError(errorCode);
        }
        context.user.star = true;
    });
}

function unsetStar(context, starApi, userId) {
    starApi.unstar(userId, function(errorCode) {
        if(errorCode) {
            return common.handleError(errorCode);
        }
        context.user.star = false;
    });
}

function startConversation(context, router) {
    var path = {
        name: 'conversation',
        params: {
            targetId: context.user.id,
            conversationType: utils.conversationType.PRIVATE
        }
    };
    context.close();
    router.push(path);
}

function addFriend(context) {
    RongIM.dialog.verifyFriend(context.user);
    context.close();
}

function removeFriend(context, api, friendId, im) {
    api.friend.delFriend(friendId, function(errorCode, list){
        utils.console.log('TODO 删除聊天记录', list);
        // 删除组织外人员同时删除会话列表
        if (!context.isStaff) {
            api.conversation.remove(utils.conversationType.PRIVATE, friendId);
            var params = im.$route.params;
            var conversation = {
                conversationType: utils.conversationType.PRIVATE,
                targetId: friendId
            };
            if (common.sameConversaton(params, conversation)) {
                im.$router.push({
                    name: 'conversation',
                    query: {
                        force: 1
                    }
                });
            }
        }
        context.close();
    });
}

function acceptFriend(context, friendApi, request) {
    friendApi.accept(request, function(errorCode, result){
        var RCEC_FRIEND_REQUEST_TIMEOUT =  10403;
        if(errorCode){
            if(errorCode === RCEC_FRIEND_REQUEST_TIMEOUT){
                request.state = -1;
                utils.console.log('TODO 已过期');
            }
            return common.handleError(errorCode);
        }
        utils.console.log('acceptFriend', result);
        request.state =  common.FriendState.ACCEPT;
        context.close();
    });
}

})(RongIM, {
    jQuery: jQuery
}, RongIM.components);
