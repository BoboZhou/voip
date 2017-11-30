'use strict';
(function(RongIM, dependencies, components) {

var utils = RongIM.utils;
var dialog = RongIM.dialog;
var common = RongIM.common;
// var $ = dependencies.jQuery;

function getFriends(resolve, reject) {
    var im = RongIM.instance;
    var friendApi = im.dataModel.Friend;
    var options = {
        name: 'friends',
        template: 'templates/contact/friends.html',
        data: function() {
            return {
                letter: '',
                list: []
            };
        },
        computed: {
            orderFriend: function () {
                return this.list;
            },
            navFriend: function () {
                var context = this;
                var friends = {};
                context.orderFriend.forEach(function(item) {
                    var firstLetter = context.getFirstLetter(item.name);
                    if (utils.isEmpty(friends[firstLetter])) {
                        friends[firstLetter] = item;
                    }
                });
                return friends;
            }
        },
        directives: {
            scrollToLetter: function (el, binding) {
                var letter = $(el).data('letter');
                if (letter === binding.value) {
                    el.scrollIntoView();
                }
            }
        },
        mounted: function() {
            initList(this, friendApi);
        },
        methods: {
            getUsername: common.getUsername,
            userProfile: dialog.user,
            getFirstLetter: function (name) {
                name = name && name.charAt(0);
                var pinyinObj = utils.convertToABC(name);
                var firstLetter = pinyinObj.first.toUpperCase();
                return firstLetter;
            },
            isNavFriend: function (friend) {
                var firstLetter = this.getFirstLetter(friend.name);
                var friendNav = this.navFriend[firstLetter];
                if(friendNav && friendNav.id === friend.id){
                    return true;
                }
                return false;
            },
            scrollToFriend: function (letter) {
                this.letter = letter;
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

function getFriendList(context, friendApi) {
    var list = friendApi.getCacheList();
    if($.isEmptyObject(list)){
        friendApi.getList(function(errorCode, list){
            context.list = list;
        });
    } else {
        context.list = list;
    }

}

function addFriendWatch (context, friendApi) {
    context.friendWatch = function (result) {
        if(result.type === 'Request'){
            return;
        }
        context.list = result.list;
    };
    friendApi.watch(context.friendWatch);
}

function initList(context, friendApi) {
    getFriendList(context, friendApi);
    addFriendWatch(context, friendApi);
}

function cleanup(context, friendApi) {
    friendApi.unwatch(context.friendWatch);
}

/*function delFriend(context, friendApi, friendId) {
    friendApi.delFriend(friendId, function(errorCode){
        if(errorCode){
            return;
        }
        console.log('TODO 删除聊天记录');
    });
}*/

/*

function delAllFriend(context, friendApi) {
    friendApi.delAllFriend(function(result){
        //TODO 删除聊天记录
        if(result.success){
            console.log(result);
        }
    });
}

*/

$.extend(true, components, {
    contact: {
        getFriends: getFriends
    }
});

})(RongIM, {
    // jQuery: jQuery
}, RongIM.components);
