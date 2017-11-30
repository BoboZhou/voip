'use strict';

(function (RongIM, dependencies) {

var $ = dependencies.jQuery;
var RongIMLib = dependencies.RongIMLib;

function getJSON(url, callback) {
    return jQuery.getJSON('http://localhost:3000' + url, function (data) {
        callback(null, data);
    });
}

var Star = {
    getList: function (callback) {
        getJSON('/all-star', callback);
    },
    star: function (targetId, callback) {
        callback();
    },
    unstar: function (targetId, callback) {
        callback();
    },
    setStatus: function () {
        console.log('改变用户状态', arguments);
    }
};

var Organization = {
    getCompany: function (callback) {
        getJSON('/org-company', callback);
    },
    getDept: function (deptId, callback) {
        getJSON('/org-' + deptId, callback);
    },
    getDeptNames: function (path, callback) {
        callback(null, []);
    },
    search: function (keyword, callback) {
        getJSON('/org-search', callback);
    },
    getMembers: function (deptId, callback) {
        getJSON('/org-' + deptId, function (errorCode, result) {
            callback(errorCode, result.members);
        });
    }
};

var Group = {
    getList: function (callback) {
        getJSON('/group-list', callback);
    },
    create: function (group, callback) {
        console.info('group.create', group);
        callback(null, {
            id: '111'
        });
    },
    addToFav: function (idList, callback) {
        callback();
    },
    removeFromFav: function (idList, callback) {
        callback();
    },
    rename: function (groupId, name, callback) {
        callback();
    },
    getMembers: function (groupId, callback) {
        getJSON('/group-members', callback);
    },
    addMembers: function (groupId, memberIdList, callback) {
        console.info('group.addMembers', groupId, memberIdList);
        callback();
    },
    removeMembers: function (groupId, memberIdList, callback) {
        console.info('group.removeMembers', groupId, memberIdList);
        callback();
    },
    memberWatch: function (handle) {
    },
    quit: function (groupId, callback) {
        callback();
    },
    dismiss: function (groupId, callback) {
        callback();
    }
};

var User = {
    login: function (params, callback) {
        getJSON('/login', callback);
    },
    logout: function (callback) {
    },
    refreshToken: function (callback) {
        console.log('refreshToken');
        callback(null, 'refreshToken');
    },
    changePassword: function (params, callback) {
        callback();
    },
    checkPhone: function (params, callback) {
        callback();
    },
    sendCode: function (params, callback) {
        callback();
    },
    checkCode: function (params, callback) {
        callback(null, {
            token: 'this-is-a-demo-token'
        });
    },
    resetPassword: function (params, callback) {
        callback();
    },
    setAlias: function (targetId, alias, callback) {
        callback();
    },
    subscribe: function (id, duration, callback) {
        callback = callback || $.noop;
        callback();
    },
    unsubscribe: function (id, callback) {
        callback = callback || $.noop;
        callback();
    },
    get: function (id, callback) {
        getJSON('/user', callback);
    },
    getDetail: function (id, callback) {
        getJSON('/user', callback);
    },
    setAvatar: function (src, callback) {
        callback();
    },
    watch: function (listener) {},
    unwatch: function () {}
};

var Status = (function () {
    var handleList = [];
    var CONNECTED = 0;
    var DISCONNECTED = 2;
    return {
        connect: function (token, callback) {
            callback();
            handleList.forEach(function (handle) {
                handle(CONNECTED);
            });
        },
        disconnect: function () {
            handleList.forEach(function (handle) {
                handle(DISCONNECTED);
            });
        },
        watch: function (handle) {
            handleList.push(handle);
        }
    };
})();

var Conversation = {
    getList: function (callback) {
        getJSON('/conversation-list', callback);
    },
    getOne: function (conversationType, targetId, callback) {
        getJSON('/conversation-' + conversationType + '-' + targetId, callback);
    },
    getTotalUnreadCount: function(conversationTypes, callback) {
        callback(null, 9);
    },
    watch: function(handle) {
    },
    top: function (conversationType, targetId, callback) {
        console.log('置顶', arguments);
    },
    unTop: function (conversationType, targetId, callback) {
        console.log('取消置顶', arguments);
    },
    mute: function (conversationType, targetId, callback) {
        console.log('消息免打扰', arguments);
    },
    unMute: function (conversationType, targetId, callback) {
        console.log('恢复消息通知', arguments);
    },
    remove: function (conversationType, targetId, callback) {
        console.log('删除会话', arguments);
    },
    clearUnReadCount: function (conversationType, targetId) {
    },
    setDraft: function (conversationType, targetId, draft) {
    },
    clearDraft: function (conversationType, targetId) {
        Conversation.setDraft(conversationType, targetId, '');
    }
};

var Message = {
    TextMessage: RongIMLib.TextMessage,
    send: function (params, callback) {
        console.info('Message.send', params);
        callback && callback(null, {
            messageUId: 'this-is-a-message-uid'
        });
    },
    get: function (params, callback) {
        getJSON('/conversation-messages', callback);
    },
    watch: function(handle) {
    },
    removeLocal: function () {
        console.log('删除消息', arguments);
    },
    search: function (params, callback) {
        getJSON('/conversation-messages', function (errorCode, list) {
            var total = 200;
            callback(errorCode, list, total);
        });
    }
}

var mocks = {
    Star: Star,
    Organization: Organization,
    Group: Group,
    User: User,
    Status: Status,
    Conversation: Conversation,
    Message: Message
};

$.extend(true, RongIM.dataModel, mocks);

})(RongIM, {
    jQuery: jQuery,
    RongIMLib: RongIMLib
});