'use strict';
(function(RongIM, dependencies, components) {

var utils = RongIM.utils;
var dialog = RongIM.dialog;
var common = RongIM.common;
var FriendState = common.FriendState;
// var $ = dependencies.jQuery;

function getRequestFriend(resolve, reject) {
    var im = RongIM.instance;
    var friendApi = im.dataModel.Friend;
    var options = {
        name: 'request-friend',
        template: 'templates/contact/request-friend.html',
        data: function() {
            return {
                list: []
            };
        },
        computed: {
            unreadCount: function () {
                return im.requestUnReadCount;
            }
        },
        mounted: function() {
            initList(this, friendApi);
        },
        methods: {
            getUsername: common.getUsername,
            userProfile: dialog.userRequest,
            showAccept: function (item) {
                return showAccept(this, item);
            },
            showAdded: function (item) {
                return showAdded(this, item);
            },
            showOverDate: function (item) {
                return showOverDate(this, item);
            },
            showRequest: function (item) {
                return showRequest(this, item);
            },
            acceptFriend: function (request) {
                acceptFriend(this, friendApi, request);
            }
        },
        components: {
            'avatar': components.getAvatar
        },
        destroyed: function () {
            cleanup(this, friendApi);
        }
    };
    utils.asyncComponent(options, resolve, reject);
}

function clearUnread(context, friendApi) {
    if(context.unreadCount === 0){
        return;
    }
    friendApi.clearUnread(function(errorCode){
        if(errorCode){
            return;
        }
        utils.console.log('清除好友申请未读数成功');
    });
}

function getRequestList(context, friendApi) {
    var list = friendApi.getCacheRequest();
    if($.isEmptyObject(list)){
        friendApi.getRequestList(function(errorCode, list){
            context.list = list;
        });
    } else {
        context.list = list;
    }
}

function addRequestWatch (context, friendApi) {
    context.requestWatch = function (result) {
        if(result.type === 'Friend'){
            return;
        }
        context.list = result.list;
        // clearUnread(context, friendApi);
    };
    friendApi.watch(context.requestWatch);
}

function initList(context, friendApi) {
    clearUnread(context, friendApi);
    getRequestList(context, friendApi);
    addRequestWatch(context, friendApi);
}

function showAccept(context, item) {
    return item.state === common.FriendState.INVITEE;
}

function showAdded(context, item) {
    // console.log('TODO 需要跟产品确认显示细节');
    var state = item.state;
    var isAccept = (state === FriendState.ACCEPT);
    var isAcceptee = (state === FriendState.ACCEPTEE);
    return isAccept || isAcceptee;
}
function showRequest(context, item) {
    var state = item.state;
    return state === FriendState.INVITE;
}
function showOverDate(context, item) {
    var state = item.state;
    return state === -1;
}

function acceptFriend(context, friendApi, request) {
    friendApi.accept(request, function(errorCode){
        var RCEC_FRIEND_REQUEST_TIMEOUT =  10403;
        if(errorCode){
            if(errorCode === RCEC_FRIEND_REQUEST_TIMEOUT){
                request.state = -1;
                utils.console.log('TODO 已过期');
            }
            return common.handleError(errorCode);
        }
        request.state =  common.FriendState.ACCEPT;
    });
}

function cleanup(context, friendApi) {
    friendApi.unwatch(context.requestWatch);
}

/*

function delRequest(context, friendApi, requestId) {
    friendApi.delRequest(requestId, function(result){
        if(result.success){
            console.log(result);
        }
    });
}

function delAllRequest(context, friendApi) {
    friendApi.delAllRequest(function(result){
        if(result.success){
            console.log(result);
        }
    });
}
*/

$.extend(true, components, {
    contact: {
        getRequestFriend: getRequestFriend
    }
});

})(RongIM, {
    // jQuery: jQuery
}, RongIM.components);
