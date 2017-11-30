'use strict';
(function(RongIM, dependencies, components) {

var common = RongIM.common;
var utils = RongIM.utils;
var KEYCODE = utils.keyCode;
// var $ = dependencies.jQuery;

RongIM.dialog.verifyFriend = function (user) {
    var im = RongIM.instance;
    var friendApi = im.dataModel.Friend;
    var options = {
        name: 'verify-friend',
        template: 'templates/contact/verify-friend.html',
        data: function () {
            return {
                show: true,
                applyContent: ''
            };
        },
        components: {
            avatar: components.getAvatar
        },
        mounted: function () {
            this.applyContent = this.locale.iam + ' ' + im.loginUser.name;
        },
        methods: getMethods(user, friendApi)
    };

    common.mountDialog(options, function (instance) {
        RongIM.debug.friendVerify = instance;
    });
};

function getMethods(user, friendApi) {
    return {
        close: function () {
            this.show = false;
        },
        inviteFriend: function () {
            inviteFriend(this, friendApi, user);
        },
        keydown: function(event){
            var isEnter = (event.keyCode === KEYCODE.enter);
            if (isEnter) {
                inviteFriend(this, friendApi, user);
            }
        }
    };
}

function inviteFriend(context, friendApi, user) {
    utils.console.log('此处需要改,获取 placeholder 值');
    var content = context.applyContent;
    friendApi.invite(user.id, content, function(errorCode, result){
        if(errorCode){
            return common.handleError(errorCode);
        }
        utils.console.log('inviteFriend', result);
        context.close();
    });
}

})(RongIM, {
    // jQuery: jQuery
}, RongIM.components);
