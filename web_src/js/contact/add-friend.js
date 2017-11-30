'use strict';
(function(RongIM, dependencies, components) {

var common = RongIM.common;
var utils = RongIM.utils;
var KEYCODE = utils.keyCode;
var dialog = RongIM.dialog;
// var $ = dependencies.jQuery;

RongIM.dialog.addFriend = function () {
    var im = RongIM.instance;
    var friendApi = im.dataModel.Friend;
    var options = {
        name: 'add-friend',
        template: 'templates/contact/add-friend.html',
        data: function () {
            return {
                show: true,
                mobile: '',
                user: null,
                searchDone: false,
                isAuthStaff: im.auth.isStaff,
                isLoginUser: false,
                isFriend: false,
                isStaff: false
            };
        },
        components: {
            avatar: components.getAvatar
        },
        mixins: [
            components.getValidate()
        ],
        computed: {
            // *规则只针对外部人员登录搜索内部非好友
            userName: function () {
                var name = this.user.name;
                if(!this.isAuthStaff && this.isStaff && !this.isFriend && !this.isLoginUser){
                    // name = name.replace(/.(?=.)/g, '*');  //只显示最后一个字
                    name = name.replace(/.$/g, '*');
                }
                return name;
            }
        },
        methods: getMethods(friendApi, im.auth)
    };

    common.mountDialog(options, function (instance) {
        RongIM.debug.addFriend = instance;
    });
};

function getMethods(friendApi, auth) {
    return {
        userProfile: dialog.userRequest,
        getUsername: common.getUsername,
        close: function () {
            this.show = false;
        },
        search: function() {
            search(this, friendApi, auth);
        },
        addFriend: function() {
            var requestInfo = friendApi.getRequest(this.user.id);
            var isRequesting = requestInfo && requestInfo.state === common.FriendState.INVITEE;
            if(isRequesting){
                acceptFriend(this, friendApi, requestInfo);
                return;
            }
            RongIM.dialog.verifyFriend(this.user);
            this.close();
        },
        keydown: function(event) {
            var context = this;
            var isEnter = (event.keyCode === KEYCODE.enter);
            if (isEnter) {
                search(context, friendApi, auth);
            }
            context.searchDone = false;
            context.user = null;
            context.isLoginUser = false;
            context.isFriend = false;
        }
    };
}

function search(context, friendApi, auth){
    if (!context.valid()) {
        return;
    }
    context.searchDone = false;
    friendApi.search(context.mobile, function(errorCode, list){
        context.searchDone = true;
        if(errorCode){
            return;
        }
        var user = list[0];
        if (utils.isEmpty(user)) {
            return;
        }
        if(user.id === auth.id){
            context.isLoginUser = true;
        }
        var cacheFriend = friendApi.getCacheFriend(user.id);
        if(cacheFriend){
            context.isFriend = true;
        }
        context.isStaff = (user.user_type === common.UserType.STAFF);
        context.user = user;
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
    // jQuery: jQuery
}, RongIM.components);
