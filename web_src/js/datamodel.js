'use strict';

(function (RongIM, dependencies) {

var win = dependencies.win;
var utils = {};
var common = {};
var store = RongIM.utils.cache;
var $ = dependencies.jQuery;
var RongIMClient = dependencies.RongIMClient;
var RongIMLib = dependencies.RongIMLib;
var UploadClient = dependencies.UploadClient;
var QRCode = dependencies.QRCode;
var dataProvider = RongIM.dataProvider;

var config = {
    dataModel: {
        getHistoryMessagesNumber: 10,
        // getUsers 接口合并数据的个数
        requestCount: 50,
        // getUsers 等待合并数据等待时长，单位：毫秒
        waitTime: 50
    }
};

function sync(params){
    utils.console.log(params);
    // sync data
    // emit watch
}

$.extend(true, config, RongIM.config);

var util = {
    sameConversation: function (one, other) {
        var oneId = one.targetId;
        var oneType = +one.conversationType;
        var otherId = other.targetId;
        var otherType = +other.conversationType;
        var sameId = oneId === otherId;
        var sameType = oneType === otherType;
        return sameId && sameType;
    },
    getPrototype: Object.prototype.toString,
    isArray : function(arr){
        return this.getPrototype.call(arr) === '[object Array]';
    },
    isString: function(str){
        return this.getPrototype.call(str) === '[object String]';
    },
    //此方法业务使用场景： 校验 messageUId 是否在 messageUIds 数组中，过滤单个字符 '_' 请注意。
    isInArray: function(node, arr){
        return arr.join('_').indexOf(node) > -1;
    },
    /*
        重置对象的属性值, 支持单个对象，多个对象需再封装
        此方法操作对象引用，不重新创建对象
        var obj1 = { a: 1, b: 2 };
        var obj2 = reset(obj1, {a: 345});
        // obj1 => { a: 345, b: 2}
        // obj1 === obj2 => true
    */
    reset: function(obj, newValues){
        var objs = [obj];
        var keys = function(o){
            var tmp = [];
            $.each(o, function(k){
                tmp.push(k);
            });
            return tmp;
        };

        var func = function(memo){
            keys(newValues).forEach(function(key){
                var memoObj = memo[0];
                memoObj[key] = newValues[key];
            });
            return memo;
        };
        return objs.reduce(func, objs)[0];
    }
};

var storage = {
    set: function(key, value){
        localStorage.setItem(key, JSON.stringify(value));
    },
    get: function(key){
        var item = localStorage.getItem(key);
        var result = null;
        if (util.isString(item)) {
            result = JSON.parse(item);
        }
        return result;
    },
    remove: function(key){
        localStorage.removeItem(key);
    }
};

function ObserverList() {

    var checkIndexOutBound = function(index, bound) {
        return index > -1 && index < bound;
    };

    this.observerList = [];

    this.add = function(observer, force) {
        if (force) {
            this.observerList.length = 0;
        }
        this.observerList.push(observer);
    };

    this.get = function(index) {
        if (checkIndexOutBound(index, this.observerList.length)) {
            return this.observerList[index];
        }
    };

    this.count = function() {
        return this.observerList.length;
    };

    this.removeAt = function(index) {
        checkIndexOutBound(index, this.observerList.length) && this.observerList.splice(index, 1);
    };

    this.remove = function(observer) {
        if(!observer) {
            this.observerList.length = 0;
            return;
        }
        var observerList = Object.prototype.toString.call(observer) === '[object Function]' ? [observer] : observer;
        for (var i = 0, len = this.observerList.length; i < len; i++) {
            for (var j = 0; j < observerList.length; j++) {
                if (this.observerList[i] === observerList[j]) {
                    this.removeAt(i);
                    break;
                }
            }
            // if (this.observerList[i] === observer[i]) {
            //     this.removeAt(i);
            //     break;
            // }
        }
    };

    this.notify = function(val){
        for (var i = 0, len = this.observerList.length; i < len; i++) {
            this.observerList[i](val);
        }
    };

    this.indexOf = function(observer, startIndex) {
        var i = startIndex || 0,
            len = this.observerList.length;
        while (i < len) {
            if (this.observerList[i] === observer) {
                return i;
            }
            i++;
        }
        return -1;
    };
}

var Cache = {
    orgTree: {},
    alias: {},
    auth: {},
    user: {
        _defer:{}
    },
    starList: [],
    group: {
        _defer: {}
    },
    conversation: {
        searchTempList: []
    },
    friendList: [],
    friendRequest: [],
    pin: {
        attach: {}
    },
    clean: function () {
        Cache.ready._done = false;
        Cache.orgTree = {};
        Cache.alias = {};
        Cache.auth = {};
        Cache.user = {
            _defer:{}
        };
        Cache.starList = [];
        Cache.group = {
            _defer: {}
        };
        Cache.conversation = {
            searchTempList: []
        };
        Cache.friendList = [];
        Cache.friendRequest = [];
        Cache.pin = {
            attach: {}
        };
    }
};

var Organization = {

};

var Status = {
    observerList: new ObserverList()
};

var statusObserver = Status.observerList;

var User = {
    observerList: new ObserverList()
};

var userObserverList = User.observerList;

var Star = {
    observerList: new ObserverList()
};

var starObserverList = Star.observerList;

var Group = {
    observerList: new ObserverList()
};

var groupObserverList = Group.observerList;

var Conversation = {
    draft: {},
    observerList: new ObserverList()
};

var converObserverList = Conversation.observerList;

var Friend = {
    observerList: new ObserverList()
    // requestObserverList: new ObserverList()
};

var friendObserverList = Friend.observerList;
// var requestObserverList = Friend.requestObserverList;

var Pin = {
    observerList: new ObserverList()
};

var pinObserverList = Pin.observerList;

var Message = {
    TextMessage: RongIMLib.TextMessage,
    ImageMessage: RongIMLib.ImageMessage,
    FileMessage: RongIMLib.FileMessage,
    observerList: new ObserverList(),
    _cache: {},
    _push: function (message, callback) {
        callback = callback || $.noop;
        var key = getCacheKey(message);
        var cacheList = Message._cache[key] = Message._cache[key] || [];

        if (!messageUnexist(message, cacheList)) {
            return;
        }
        var position = 0;
        if(message.offLineMessage){
            for (var i = cacheList.length - 1; i >= 0; i--) {
                if (cacheList[i].sentTime < message.sentTime) {
                    position = i + 1;
                    break;
                }
            }
            cacheList.splice(position, 0, message);
        } else {
            cacheList.push(message);
        }
        Message.addSendUserInfo(message, function (errorCode, msg) {
            if(errorCode){
                return callback(errorCode);
            }
            callback(null, msg);
        });

    },
    _sendPush: function (message, callback) {
        callback = callback || $.noop;
        var key = getCacheKey(message);
        var cacheList = Message._cache[key] = Message._cache[key] || [];

        var cacheMessage = getCacheMessageById(cacheList, message.messageId);
        if (cacheMessage) {
            cacheMessage.sentStatus = message.sentStatus;
            $.extend(cacheMessage, message);
            utils.console.log('messageId:' + message.messageId, 'messageStatue:' + message.sentStatus);
            callback(null, cacheMessage);
        } else {
            Message.addSendUserInfo(message, function (errorCode, msg) {
                if(errorCode){
                    return callback(errorCode);
                }
                cacheList.push(msg);
                callback(null, msg);
            });
        }
    }
};

function messageUnexist(message, list) {
    var messageUId = message.messageUId;
    // if (!util.isArray(list)) {
    //     return true;
    // }
    if(typeof messageUId === 'undefined'){
        return true;
    }

    var arr = list.filter(function (item) {
        return item.messageUId === messageUId;
    });
    return arr.length === 0;
}

var msgObserverList = Message.observerList;

var UpdateStatusType = {
    favGroup: 1,
    favContact: 2,
    conversationSetting: 3,
    company: 4,
    department: 5,
    duty: 6,
    userSetting: 7,
    staff: 8,
    passwordUpdated: 9,
    beDeleted: 10
};
var UpdateStatus = {
    staff: function () {
        // 目前只同步自己的用户信息
        delete Cache.user[Cache.auth.id];
        User.get(Cache.auth.id, function (errorCode, user) {
            if (errorCode) {
                return;
            }
            $.extend(Cache.auth, user);
            // 清除缓存消息更新消息中用户信息。
            userObserverList.notify(user);
        });
    },
    favContact: function () {
        getStarList().done(function (idList) {
            Cache.starList = idList;
        });
        starObserverList.notify();
    },
    favGroup: function () {
        // 更新我的群组列表, 目前没有缓存我的群组列表
    },
    conversationSetting: function () {
        Cache.conversation.topList = null;
        Conversation.getList(function (errorCode, list) {
            if (errorCode) {
                return;
            }
            converObserverList.notify(list);
        });
    },
    friend: function (message) {
        var targetId = message.content.uid;
        var ConversationType = RongIMLib.ConversationType;
        Friend.delFriend(targetId, function(){});
        Friend.delRequest(targetId, function(){});
        Conversation.remove(ConversationType.PRIVATE, targetId, function(){});
        // 删除好友  删除好友请求  删除会话
    }
};

function init(_config) {
    $.extend(true, config, _config);
    utils = RongIM.utils;
    common = RongIM.common;
    utils.console = {};
    if(config.debug) {
        utils.console = win.console;
    } else {
        for(var fn in win.console) {
            if($.isFunction(win.console[fn])) {
                utils.console[fn] = $.noop;
            }
        }
    }

    var provider = null;
    if (window.Electron) {
        provider = new RongIMLib.VCDataProvider(window.Electron.addon);
    }
    RongIMClient.init(config.appkey, provider, config.sdk);
    setConnectionListener();
    setMessageListener();
    Message.registerMessage();

    store.onchange(function (key, value) {
        if(key === 'local-auth') {
            Cache.auth = value;
        }
    });
    Cache.auth = store.get('auth');
    utils.console.info('dataModel.init');
}

function updateAuth(value) {
    Cache.auth = value;
}

function destroyed(callback) {
    callback = callback || $.noop;
    destroyed.handles.push(callback);
}
destroyed.handles = [];

function setConnectionListener() {
    RongIMClient.setConnectionStatusListener({
        onChanged: function (status) {
            statusObserver.notify(status);
        }
    });
}

function setMessageListener() {

    var notifyConversation = RongIM.utils.debounce(debounceConversation, 500);
    var messageCtrol = {
        // 音视频
        AcceptMessage: function () {
            utils.console.log('TODO: 此消息需要处理', arguments);
        },
        RingingMessage: function () {
            utils.console.log('TODO: 此消息需要处理', arguments);
        },
        SummaryMessage: function () {
            utils.console.log('TODO: 此消息需要处理', arguments);
        },
        HungupMessage: function () {
            $.noop();
        },
        InviteMessage: function (message) {
            Message._push(message);
        },
        MediaModifyMessage: function () {
            utils.console.log('TODO: 此消息需要处理', arguments);
        },
        MemberModifyMessage: function () {
            utils.console.log('TODO: 此消息需要处理', arguments);
        },
        GroupMemChangedNotifyMessage: function (message) {
            updateGroup(message);
        },
        GroupNotifyMessage: function (message) {
            updateGroup(message);
        },
        GroupCmdMessage: function (message) {
            updateGroup(message);
        },
        // RCE Server 订阅状态通知
        PresenceNotificationMessage: function(message){
            var content = message.content;
            User.get(content.targetId, function(errorCode, user){
                if(errorCode){
                    return;
                }
                user.onlineStatus = user.onlineStatus || {};
                user.onlineStatus[content.title] = content;

                var loginUser = RongIM.instance.loginUser;
                if (loginUser && loginUser.id === user.id) {
                    user.mobile = loginUser.mobile;
                }
                userObserverList.notify(user);
            });
        },
        // 资料通知消息
        ProfileNotificationMessage: function (message) {
            utils.console.log('TODO: 此消息需要处理', message);
        },
        // 命令通知
        CommandMessage: function (message) {
            utils.console.log('TODO: 此消息需要处理', message);
        },
        // RCE Server
        RCEUpdateStatusMessage: function (message) {
            // 数据同步不需要处理离线消息
            if (message.offLineMessage) {
                return ;
            }
            switch (message.content.updateType) {
                case UpdateStatusType.staff:
                    UpdateStatus.staff(message);
                    break;
                case UpdateStatusType.favContact:
                    UpdateStatus.favContact(message);
                    break;
                case UpdateStatusType.conversationSetting:
                    Cache.conversation.isSetting = false;
                    UpdateStatus.conversationSetting(message);
                    break;
                case UpdateStatusType.passwordUpdated:
                    destroyed.handles.forEach(function (callback) {
                        callback('password-changed');
                    });
                    break;
                case UpdateStatusType.beDeleted:
                    UpdateStatus.friend(message);
                    break;
                default:
                    utils.console.log('TODO: 此消息需要处理', message);
                    break;
            }
        },
        InactiveCommandMessage: function (message) {
            if (message.offLineMessage) {
                return;
            }
            destroyed.handles.forEach(function (callback) {
                callback(10111);
            });
        },
        TypingStatusMessage: function (message) {
            utils.console.log('TODO: 此消息需要处理', message);
        },
        // 同步已读状态
        SyncReadStatusMessage: function (message) {
            if(window.Electron){
                clearUnreadCountByTimestamp(message.conversationType, message.targetId, message.content.lastMessageSendTime, function () {});
            } else {
                clearUnreadCount(message.conversationType, message.targetId, function () {});
            }
        },
        // 撤回消息
        RecallCommandMessage: function (message) {
            var messageUId = message.content.messageUId;
            Message.getOne(messageUId, function (errorCode, msg) {
                if (errorCode) {
                    return;
                }
                var messageId = msg.messageId || messageUId;

                var direction = RongIMLib.MessageDirection;
                var content = message.messageDirection === direction.SEND ? message.content : message;
                var key = getCacheKey(content);
                var list = Message._cache[key];
                list && spliceMessage(list, messageId, message);
                var objectName = RongIMClient.MessageParams[message.messageType].objectName;
                RongIMClient.getInstance().setMessageContent(messageId, message.content, objectName);

                RongIMClient.getInstance().setMessageReceivedStatus(messageId, RongIMLib.ReceivedStatus.READ, {
                    onSuccess: function(){
                    },
                    onError: function(error){
                        utils.console.log('RecallCommandMessage-setMessageSentStatus', error);
                    }
                });
                msgObserverList.notify(message);
                Conversation.getList(function (errorCode, list) {
                    if (errorCode) {
                        return;
                    }
                    converObserverList.notify(list);
                });
            });
        },
        // 私聊已读回执
        ReadReceiptMessage: function (message) {
            var isReceive = message.messageDirection === RongIMLib.MessageDirection.RECEIVE;
            if (isReceive) {
                Message.setMessageStatus(message);
            } else {
                clearUnreadCount(message.conversationType, message.targetId, function () {});
            }
        },
        ReadReceiptRequestMessage: function(message) {

            var messageUId = message.content.messageUId;
            if (message.messageDirection === RongIMLib.MessageDirection.SEND) {
                // 多端同步的消息
                var key = getStoreKey('res_' + messageUId);
                storage.set(key, []);
                var msg = getCacheMessageByUId(message.conversationType, message.targetId, messageUId);
                if (msg) {
                    msg.receiptResponse = [];
                    msgObserverList.notify(message);
                }
            } else {
                var storeKey = getStoreKey('req'),
                    conversationKey = generatorKey([message.conversationType, message.targetId]);

                var data = storage.get(storeKey) || {},
                    ret = data[conversationKey] || {};
                var uIds = ret.uIds || [];

                uIds.push(messageUId);
                var result = ret[message.senderUserId] || [];
                ret[message.senderUserId] = result.concat(uIds);
                data[conversationKey] = ret;

                storage.set(storeKey, data);

                Conversation.getList(function(error, list) {
                    var type = message.conversationType;
                    var id = message.targetId;
                    for(var i = 0; i < list.length; i++){
                        var conv = list[i];
                        if (+conv.conversationType === +type && conv.targetId === id) {
                            list[i].requestMsgs = ret;
                            if (conv.unreadMessageCount === 0) {
                                Message.sendGroupResponse(type, id, ret);
                            }
                            break;
                        }
                    }
                    converObserverList.notify(list);
                });
            }
        },
        ReadReceiptResponseMessage: function(message){
            var key = getCacheKey(message);
            var cacheList = Message._cache[key] = Message._cache[key] || [];
            bindResponseToMessage(message, cacheList);
        },
        RealTimeLocationJoinMessage: function () {
        },
        RealTimeLocationQuitMessage: function () {
        },
        RealTimeLocationStatusMessage: function () {
        },
        KickoffMsg: function (message) {
            if(message.offLineMessage) {
                return;
            }
            var status = RongIM.utils.status['KICKED_OFFLINE_BY_OTHER_CLIENT'];
            statusObserver.notify(status);
        },
        ContactNotifyMessage: function (message) {
            var actionMap = {
                '1': 'Add',
                '2': 'Accept',
                '3': 'Reject',
                '4': 'Delete'
            };
            var actionType = message.content.actionType;
            var action = actionMap[actionType];
            switch (action) {
                case 'Add':
                    notifyFriendRequest();
                    break;
                case 'Accept':
                    Message._push(message);
                    msgObserverList.notify(message);
                    // notifyConversation();
                    notifyFriendRequest();
                    notifyFriend();
                    Conversation.add({
                        conversationType: message.conversationType,
                        targetId: message.targetId
                    });
                    break;
                default:
                    utils.console.log('TODO ContactNotifyMessage:' + action);
                    break;
            }
        },
        PinNotifyMessage: function(message){
            notifyPin(message);
        },
        PinCommentMessage: function(message) {
            notifyPin(message);
        },
        PinConfirmMessage: function(message) {
            notifyPin(message);
        },
        PinNewReciverMessage: function(message) {
            notifyPin(message);
        },
        otherMessage: function(message){
            /*test*/
            // message.messageType = 'ContactNotifyMessage';
            // message.objectName = 'RCE:ContactNtfy';
            // message.content = {"actionType": 2, "operatorUserId":"aaaaa", "targetUserId":"bbbbb", "data":"xxx"};
            /*test*/
            Message._push(message);
            msgObserverList.notify(message);
            notifyConversation();
        }
    };
    RongIMClient.setOnReceiveMessageListener({
        onReceived: function (message) {
            var notLogin = $.isEmptyObject(Cache.auth) || $.isEmptyObject(Cache.auth.id);
            if(notLogin){
                return;
            }
            var messageType = message.messageType;
            var presence = messageCtrol[messageType];
            presence? presence(message) : messageCtrol['otherMessage'](message);
        }
    });
}
function debounceConversation() {
    Conversation.getList(function (errorCode, list) {
        if(errorCode){
            return;
        }
        converObserverList.notify(list);
        utils.console.log('刷新会话列表', list.length);
    });
}

function updateGroup(message) {
    var requireClear = requireClearGroup(message);

    if (message.offLineMessage && requireClear.conversation) {
        Conversation.remove(RongIMLib.ConversationType.GROUP, message.targetId);
        return;
    }

    if (requireClear.group) {
        Group.removeFromFav([message.targetId]);
    }
    if (requireClear.conversation) {
        Conversation.remove(RongIMLib.ConversationType.GROUP, message.targetId);
    }

    var id = message.targetId;
    delete Cache.group[id];
    delete Cache.group._defer[id];
    Group.getOne(id, function (errorCode, group) {
        !errorCode && groupObserverList.notify(group);
    });

    if (message.messageType !== 'GroupCmdMessage') {
        Message._push(message);
    }
}

function requireClearGroup(message) {
    var actionMap = {
        GroupMemChangedNotifyMessage: {
            '1': 'Invite',
            '2': 'Join',
            '3': 'Kick',
            '4': 'Quit'
        },
        GroupNotifyMessage: {
            '1': 'Create',
            '2': 'Dismiss',
            '4': 'Rename'
        },
        GroupCmdMessage: {
            '1': 'UpdPortrait'
        }
    };
    var action = message.content.action;
    var actionText = actionMap[message.messageType][action];
    var list = ['Kick', 'Quit', 'Dismiss'];
    var targetUsers = message.content.targetUsers;
    var includeMe = false;
    if(targetUsers) {
        includeMe = targetUsers.filter(function (item) {
            return item.id === Cache.auth.id;
        }).length > 0;
    } else {
        includeMe = true;
    }

    var clearGroup = list.indexOf(actionText) >= 0 && includeMe;

    var isOperator = message.content.operatorUser.id === Cache.auth.id;
    var clearConversation = ['Quit', 'Dismiss'].indexOf(actionText) >=0 && isOperator;

    return {
        group: clearGroup,
        conversation: clearConversation
    };
}

var Http = {};

Http.get = function (url, data, callback) {
    return httpRequest('GET', url, data, callback);
};

Http.post = function (url, data, callback) {
    return httpRequest('POST', url, data, callback);
};

function httpRequest(method, url, data, callback) {
    callback = callback || $.noop;
    if(requireAuth(url)) {
        return Cache.ready().then(function () {
            return request(url, method, data, callback);
        });
    }
    return request(url, method, data, callback);
}

Http.put = function (url, data, callback) {
    return request(url, 'PUT', data, callback);
};

Http.del = function (url, data, callback) {
    return request(url, 'DELETE', data, callback);
};

function requireAuth(url) {
    var whiteList = [/^\/user\//];
    var publicAccess = whiteList.filter(function (pattern) {
        return pattern.test(url);
    }).length === 0;
    return publicAccess;
}

function ajax(url, method, data, callback) {
    callback = callback || $.noop;
    data = $.isEmptyObject(data) ? null : JSON.stringify(data);

    var options = {
        url: getFullURL(url),
        method: method,
        data: data,
        xhrFields: {
            withCredentials: true
        },
        dataType: 'json'
    };

    if (method !== 'GET') {
        options.headers = {
            'Content-Type': 'application/json;charset=UTF-8'
        };
    }

    return $.ajax(options).then(function (response) {
        var defer = $.Deferred();
        var errorCode = getErrorCode(response.code);
        if(errorCode) {
            defer.reject(errorCode);
            callback(errorCode);
        } else {
            var result = formatKeys(response.result);
            defer.resolve(result);
            callback(null, result);
        }
        callback.done = true;
        return defer.promise();
    }).fail(function (errorCode) {
        $.Deferred().reject(errorCode);
        !callback.done && callback(errorCode);
    });
}

function getFullURL(path) {
    return config.dataModel.server + path;
}

function formatKeys(object) {
    for (var key in object) {
        if (object.hasOwnProperty(key)) {
            var value = object[key];
            if(typeof value === 'object') {
                formatKeys(value);
            } else {
                var newKey = snakeToCamel(key);
                object[newKey] = value;
                fixKeyTypo(object, key);
            }
        }
    }
    return object;
}

function fixKeyTypo(object) {
    var list = {
        depart_id: 'deptId',
        depart_name: 'deptName'
    };
    for (var key in object) {
        if (object.hasOwnProperty(key)) {
            var newKey = list[key];
            var undef;
            if(newKey !== undef) {
                object[newKey] = object[key];
            }
        }
    }
}

function request(url, method, data, callback) {
    callback = callback || $.noop;
    var defer = $.Deferred();
    /*
    data is optional

    request(url, method, data, callback)
    request(url, method, callback)
    */
    if($.isFunction(data)) {
        callback = data;
        data = null;
    }
    /*
        1、数据存储按 URL 存储
        2、本地获取，数据存在并且非部门相关接口，优先返回本地数据，然后去服务器更新数据
        3、本地获取数据，数据不存在，服务端获取，并写会本地数据库
        POST、GET、PUT、DELETE
    */

    // 根据 method 区分存储、删除、更新
    var set = dataProvider.set;
    var get = dataProvider.get;

    var req = function(){
        ajax(url, method, data, function(errorCode, data){
            callback(errorCode, data);
            if(errorCode) {
                return defer.reject(errorCode);
            }
            defer.resolve(data);
            var params = {
                type: url,
                method: method,
                data: data
            };
            set(params);
        });
    };

    var methodItem = {
        GET: function(){
            var params = {
                type: url
            };
            var dataItem = {
                local: function(errorCode, result){
                    callback(errorCode, result);
                    if(errorCode) {
                        return defer.reject(errorCode);
                    }
                    defer.resolve(result);
                    sync(params);
                },
                remote: function(){
                    req();
                }
            };
            get(params, function(errorCode, result){
                var method = result.data ? 'local' : 'remote';
                dataItem[method](errorCode, result);
            });
        },
        OTHER: function(){
            req();
        }
    };
    var way = method === 'GET' ? 'GET' : 'OTHER';
    methodItem[way]();
    return defer.promise();
}

function compositeUser(user) {
    var path = user.deptId || '';
    var dept = Cache.orgTree[user.deptId] || {};
    if(dept.path) {
        path = dept.path + ',' + path;
    }
    user.path = path;
    user.alias = Cache.alias[user.id];
    user.star = Cache.starList.indexOf(user.id) !== -1;
    return user;
}

function getUsers(idList, callback) {
    /**
     * 实现过程
     * 1. 从`Cache.user` 匹配, 未找到的从服务器批量获取。
     * 2. 从`Cache.alias`里补充字段`alias`
     * 3. 从`Cache.orgTree`里补充字段`path`（所在部门的路径：由`deptId`构成，用逗号分隔）
     * 4. 从`Cache.starList`里补充字段`star`
     */

    callback = callback || $.noop;

    // 检查传入参数 为 null、 undefined、空字符串输出错误信息
    var invalidIdList = idList.filter(function (item) {
        return !item;
    });
    if(invalidIdList.length > 0) {
        // utils.console.error('getUsers parameter contains invalid userId', idList);
    }

    var len = idList.length;

    if(len === 0) {
        return callback(null, []);
    }

    var deferred = $.Deferred();

    var fetchUsers = function(idList){
        var userMap = {};
        var userPromiseList = [];
        var notCacheDeferList = [];

        for (var i = idList.length - 1; i >= 0; i--) {
            var userId = idList[i];
            var user = Cache.user[userId];
            var userPromise = Cache.user._defer[userId];
            if (!$.isEmptyObject(user)) {
                user = compositeUser(user);
                userMap[user.id] = user;
            } else if (!$.isEmptyObject(userPromise)) {
                userPromiseList.push({
                    id: userId,
                    promise: userPromise
                });
            } else {
                var defer = $.Deferred();
                notCacheDeferList.push({
                    id: userId,
                    defer:defer
                });
                var promise = defer.promise();
                Cache.user._defer[userId] = promise;
                userPromiseList.push({
                    id: userId,
                    promise: promise
                });
            }
        }

        if (notCacheDeferList.length !== 0) {
            var notCacheIdList = notCacheDeferList.map(function (item) {
                return item.id;
            });
            var data = {
                ids: notCacheIdList
            };

            Http.post('/staffs/batch', data).done(function (result) {
                result.data.forEach(function (item) {
                    var user = {
                        id: item.id,
                        name: item.name,
                        avatar: item.portraitUrl,
                        deptId: item.departId
                    };
                    Cache.user[item.id] = user;
                });
                for (var i = notCacheDeferList.length - 1; i >= 0; i--) {
                    var deferObj = notCacheDeferList[i];
                    var user = Cache.user[deferObj.id];
                    if (!user) {
                        utils.console.warn('getUsers 用户信息未获取到：', deferObj.id);
                        user = {};
                        Cache.user[deferObj.id] = user;
                    }
                    deferObj.defer.resolve(user);
                }
            }).fail(function (errorCode) {
                for (var i = notCacheDeferList.length - 1; i >= 0; i--) {
                    var deferObj = notCacheDeferList[i];
                    deferObj.defer.reject(errorCode);
                }
            });
        }

        if (userPromiseList.length === 0) {
            var userList = getUserList(idList, userMap);
            callback(null, userList);
            deferred.resolve(userList);
            return deferred.promise();
        }

        var promiseList = userPromiseList.map(function (item) {
            return item.promise;
        });
        $.when.apply(null, promiseList).done(function () {
            for (var i = arguments.length - 1; i >= 0; i--) {
                var user = arguments[i];
                if (!user) {
                    utils.console.log(userPromiseList);
                }
                user = compositeUser(user);
                userMap[user.id] = user;
            }
            var userList = getUserList(idList, userMap);
            deferred.resolve(userList);

            callback(null, userList);
        }).fail(function (errorCode) {
            deferred.reject(errorCode);
            callback(errorCode);
        }).always(function () {
            userPromiseList.forEach(function (item) {
                Cache.user._defer[item.id] = null;
            });
        });
    };

    fetchUsers(idList);

    return deferred.promise();
}

function getUserList(idList, userMap) {
    return idList.map(function (id) {
        return userMap[id];
    });
}

Cache.ready = function (callback) {
    callback = callback || $.noop;
    if(Cache.ready._busy || Cache.ready._done) {
        return $.Deferred().resolve().promise();
    }
    Cache.ready._busy = true;
    return $.when(getTree(), getAlias(), getStarList())
        .then(function (tree, alias, starList) {
            utils.console.log('Cache.ready done');
            Cache.orgTree = tree;
            Cache.alias = alias;
            Cache.starList = starList;
            Cache.ready._done = true;
            callback();
            return $.Deferred().resolve().promise();
        })
        .fail(function (error) {
            callback(error);
            return $.Deferred().reject(error).promise();
        })
        .always(function () {
            Cache.ready._busy = false;
        });
};

function getTree() {
    function callback(result) {
        var depts = result.data;
        var deptMap = {};
        depts.forEach(function (dept) {
            deptMap[dept.id] = dept;
        });

        function getPath(dept) {
            if(!dept){
                return null;
            }
            var path = '';
            var pid = dept.parent_id;
            if(pid) {
                if(!deptMap[pid]){
                    console.log('dept undefined' + dept);
                }
                var parentPath = getPath(deptMap[pid]);
                return parentPath ? (parentPath + ',' + pid) : pid;
            }
            return path;
        }

        var tree = {};
        depts.forEach(function (dept) {
            tree[dept.id] = {
                deptName: dept.name,
                path: getPath(dept)
            };
        });
        return tree;
    }

    return request('/departments/tree', 'GET').then(callback);
}

function getAlias() {
    function callback(result) {
        var alias = {};
        result.data.forEach(function (user) {
            alias[user.id] = user.alias;
        });
        return alias;
    }

    return request('/userrelation/alias', 'GET').then(callback);
}

function getStarList() {
    function callback(result) {
        return result.data.map(function (user) {
            return user.id;
        });
    }

    return request('/userrelation/starcontacts', 'GET').then(callback);
}

Status.connect = function (token, callback) {
    callback = callback || $.noop;
    RongIMClient.connect(token, {
        onSuccess: function (userId) {
            callback(null, userId);
        },
        onTokenIncorrect: function () {
            callback('invalid-token');
        },
        onError: callback
    }, Cache.auth.id);
};

Status.reconnect = function (callback) {
    callback = callback || $.noop;
    RongIMClient.reconnect({
        onSuccess:function () {
            //重连成功
            callback(null);
        },
        onError:function (errorCode) {
            //重连失败
            callback(getLibErrorCode(errorCode));
        }
    });
};

Status.disconnect = function () {
    RongIMClient.getInstance().logout();
};

Status.watch = function(listener) {
    statusObserver.add(listener);
};

Status.unwatch = function(listener){
    statusObserver.remove(listener);
};

var qrcode = {};

qrcode.login = function login(node, callback) {
    callback = callback || $.noop;
    var timeout = false;
    login.timer && clearTimeout(login.timer);

    getQRCodeToken()
        .then(render)
        .then(polling)
        .then(qrcodeLogin)
        .then(function (result) {
            callback(null, result);
        }).fail(callback);

    function render(result) {
        login.timer = setTimeout(function () {
            timeout = true;
        }, result.timeout);

        var token = result.token;
        qrcodeRender(node, token);
        return token;
    }

    function polling(token) {
        return qrcodePolling(node, token).then(function (result) {
            return {
                token: token,
                ticket: result.ticket
            };
        });
    }

    function qrcodePolling(node, token) {
        var url = utils.templateFormat('/user/qrcode/login/polling/{{0}}', token);
        // var POLLING = 0;
        // var VERIFIED = 1;
        var LOGINED = 2;
        var wait = 1000;
        var defer = $.Deferred();

        function loop(node) {
            // // mock
            // $.get('http://localhost:3000/qrcode-polling')
            //     .then(function (data) {
            //         if(data.code === 10000) {
            //             return data.result;
            //         } else {
            //             return $.Deferred().reject(data.code).promise();
            //         }
            //     }).then(function (result) {

            Http.get(url).then(function (result) {
                if(result.state === LOGINED) {
                    return defer.resolve(result);
                }
                var isInPage = document.body.contains(node);
                if(timeout) {
                    var INVALID_TOKEN = 10123;
                    defer.reject(INVALID_TOKEN);
                } else if(isInPage) {
                    login.timer = setTimeout(function () {
                        loop(node);
                    }, wait);
                }
            }).fail(function (errorCode) {
                var INVALID_TOKEN = 10122;
                if(errorCode === INVALID_TOKEN) {
                    return login(node, callback);
                }
                defer.reject(errorCode);
            });
        }

        loop(node);
        return defer.promise();
    }
};

function getQRCodeToken() {
    // // mock
    // return jQuery.getJSON('http://localhost:3000/qrcode-login-create').then(function (data) {
    //     return data.result;
    // });

    var params = {
        agent: {
            platform: utils.getPlatform(),
            device_id: utils.getDeviceId()
        }
    };
    return Http.post('/user/qrcode/login/create', params);
}

function qrcodeRender(node, token) {
    var platform = utils.getPlatform();
    var text = utils.templateFormat('RCE_LOGIN@{{0}}@{{1}}', token, platform);
    $(node).empty();
    new QRCode(node, {
        text: text,
        width: 162,
        height: 162
    });
}

function qrcodeLogin(params) {
    // mock
    // return $.get('http://localhost:3000/login', params)

    return Http.post('/user/qrcode/login', params)
        .then(function (result) {
            var staff = result.staff;
            var auth = {
                token: result.token,
                id: staff.id,
                companyId: staff.companyId,
                deptId: staff.deptId
            };
            Cache.auth = auth;
            return result;
        });
}

User.login = function (params, callback) {
    callback = callback || $.noop;
    var data = {
        username: params.phone,
        password: params.password,
        agent: params.agent,
        status: params.status,
        isRememberMe: params.isRememberMe
    };
    var url = utils.isEmpty(params.password) ? '/user/login_refresh' : '/user/login';
    Http.post(url, data, function (errorCode, result) {
        if(errorCode) {
            return callback(errorCode);
        }
        var staff = result.staff;
        staff.deptId = staff.departId;
        staff.deptName = staff.departName;
        Cache.auth = {
            token: result.token,
            id: staff.id,
            deptId: staff.deptId,
            companyId: staff.companyId
        };
        callback(errorCode, result);
    });
};

User.logout = function () {
    // callback = callback || $.noop;
    Cache.clean();
    Message._cache = {};
    User.setStatus('offline');
    // Http.post('/user/logout', function (errorCode) {
    //     if(!errorCode) {
    //         delete Cache.auth;
    //     }
    //     callback(errorCode);
    // });
};

User.refreshToken = function (callback) {
    Http.post('/user/refresh_token', callback);
};

User.changePassword = function (params, callback) {
    var data = {
        old_password: params.oldPassword,
        new_password: params.newPassword
    };
    Http.post('/user/change_password', data, callback);
};

User.sendCode = function (type, params, callback) {
    // type: 'resetpwd' or 'register'
    var url = utils.templateFormat('/user/{{0}}/send_code/{{1}}', type, params.phone);
    Http.post(url, callback);
};

User.checkCode = function (params, callback) {
    var url = utils.templateFormat('/user/verify_code/{{0}}/{{1}}', params.phone, params.code);
    Http.post(url, callback);
};

//http://gitlab.rongcloud.net/RCE/RCE-Doc/blob/master/docs/design/subsystem/contact_service.md
User.register = function (params, callback) {
    var data = {
        name: params.name,
        zip: params.zip,
        tel: params.tel,
        verify_token: params.verifyToken,
        password: params.password
    };
    var url = '/user/register';
    Http.post(url, data, callback);
};

User.resetPassword = function (params, callback) {
    var data = {
        user_name: params.phone,
        new_password: params.password,
        verify_token: params.verifyToken
    };
    Http.post('/user/reset_password', data, callback);
};

User.setAlias = function (targetId, alias, callback) {
    var data = {
        alias: alias
    };
    Http.put('/userrelation/alias/' + targetId, data).done(function (result) {
        Cache.alias[targetId] = alias;
        User.get(targetId, function (errorCode, user) {
            if (errorCode) {
                return;
            }
            userObserverList.notify(user);
            callback(null, result);
        });
        var friend = Cache.friendList.filter(function (item) {
            return item.id === targetId;
        });
        if (friend.length !== 0) {
            notifyFriend();
        }
        Conversation.getList(function (errorCode, list) {
            if (errorCode) {
                return;
            }
            converObserverList.notify(list);
        });
    }).fail(callback);
};

User.setAvatar = function (src, big_src, callback) {
    var data = {
        portrait_url: src,
        portrait_big_url: big_src
    };
    Http.put('/user/portrait', data).done(function () {
        callback();
    }).fail(callback);
};

User.getBatch = function (idsList, callback) {
    callback = callback || $.noop;
    getUsers(idsList, function (errorCode, list) {
        if(errorCode) {
            return callback(errorCode);
        }
        callback(null, list);
    });
};

User.get = function (id, callback) {
    callback = callback || $.noop;
    var idList = [];
    idList = idList.concat(id);
    getUsers(idList, function (errorCode, list) {
        if(errorCode) {
            return callback(errorCode);
        }
        var result = list;
        if (!$.isArray(id)) {
            result = list[0];
        }
        callback(null, result);
    });
};

User.getDetail = function (id, callback) {
    callback = callback || $.noop;

    Http.get('/staffs/' + id).done(function (result) {
        getUsers([id], function (errorCode, list) {
            if(errorCode) {
                return callback(errorCode);
            }
            var user = result;
            if(user.userType === common.UserType.VISITOR){
                return callback(null, list[0]);
            }
            Organization.getCompany(function (errorCode, company) {
                if(errorCode) {
                    return callback(errorCode);
                }
                result.companyName = company.name;
                var userId = result.id;
                var user = $.extend(result, list[0]);
                Cache.user[userId] = user;
                callback(null, user);
            });
        });

    }).fail(callback);
};

User.getAvatarToken = function (callback) {
    Http.get('/user/get_image_token', callback);
};

var subscribeTitle = ['Login_Status_PC', 'Login_Status_Mobile', 'Login_Status_Web'];

/**
 * @params.userIds
 * @params.duration
 */
User.subscribe = function(userId, duration, callback){
    callback = callback || $.noop;
    Http.post('/presence/subscribe', {
        type: 0,
        target_ids: [userId],
        titles: subscribeTitle,
        duration: duration,
        fetch_data: true
    }).done(function (result) {
        callback(null, result);
        User.get(userId, function (errorCode, user){
            if (errorCode) {
                return callback(errorCode);
            }
            user.onlineStatus = {};
            result.datas.forEach(function (item) {
                user.onlineStatus[item.title] = item;
            });
            userObserverList.notify(user);
        });
    }).fail(callback);

};

// params.userIds
User.unsubscribe = function (userId, callback) {
    callback = callback || $.noop;
    Http.post('/presence/unsubscribe', {
        type: 0,
        target_ids: [userId],
        titles: subscribeTitle
    }).done(function (result) {
        callback(null, result);
    }).fail(callback);
};

User.setStatus = function (status, callback) {
    callback = callback || $.noop;
    var title = RongIM.addon.getUserStatusTitle();
    Http.put('/presence/publish', {
        title: title,
        value: status,
        persist: true
    }).done(function (result) {
        callback(null, result);
    }).fail(callback);
};

User.getAlias = function () {
    return Cache.alias;
};

User.watch = function(listener){
    userObserverList.add(listener);
};

User.unwatch = function(listener){
    userObserverList.remove(listener);
};

Star.getList = function (callback) {
    callback = callback || $.noop;
    Http.get('/userrelation/starcontacts', function (errorCode, result) {
        if(errorCode) {
            return callback(errorCode);
        }
        var idList = result.data.map(function (item) {
            return item.id;
        }).filter(function (id) {
            return id !== Cache.auth.id;
        });
        // 同步本地缓存信息
        Cache.starList = idList;
        getUsers(idList, callback);
    });
};

Star.star = function (targetId, callback) {
    callback = callback || $.noop;
    Http.post('/userrelation/starcontacts', {
        ids: [targetId]
    }, function (errorCode) {
        if (errorCode) {
            return callback(errorCode);
        }
        callback();
        var index = Cache.starList.indexOf(targetId);
        if(index < 0) {
            Cache.starList.push(targetId);
        }
        starObserverList.notify();
    });
};

Star.unstar = function (targetId, callback) {
    callback = callback || $.noop;
    Http.del('/userrelation/starcontacts', {
        ids: [targetId]
    }, function (errorCode) {
        if (errorCode) {
            return callback(errorCode);
        }
        callback();
        var index = Cache.starList.indexOf(targetId);
        if(index >= 0) {
            Cache.starList.splice(index, 1);
        }
        starObserverList.notify();
    });
};

Star.watch = function (listener) {
    starObserverList.add(listener);
};

Star.unwatch = function (listener) {
    starObserverList.remove(listener);
};

function getCacheMessageById(cacheList, messageId) {
    for (var i = 0, len = cacheList.length; i < len; i++) {
        if (cacheList[i].messageId === +messageId) {
            return cacheList[i];
        }
    }
    return null;
}

function getCacheMessageByUId(type, id, uid) {
    var key = type + '_' + id;
    var list = Message._cache[key] || [];
    for (var i = list.length - 1; i >= 0; i--) {
        if (list[i].messageUId === uid) {
            return list[i];
        }
    }
    return null;
}

function getCacheKey(obj) {
    return obj.conversationType + '_' + obj.targetId;
}

function spliceMessage(cacheList, messageId, message) {
    if(!cacheList) {
        return;
    }
    var index = null;
    for (var i = 0, len = cacheList.length; i < len; i++) {
        var cacheMsg = cacheList[i];
        if (cacheMsg.messageId === messageId || cacheMsg.messageUId === messageId) {
            index = i;
        }
    }

    if (index === null) {
        return ;
    }

    if (message) {
        Message.addSendUserInfo(message, function (errorCode, msg) {
            cacheList.splice(index, 1, msg);
        });
    } else {
        cacheList.splice(index, 1);
    }
}

Message.addSendUserInfo = function(message, callback) {
    callback = callback || $.noop;
    var userId = message.senderUserId;
    if ($.isArray(message)) {
        var userList = message.map(function (item) {
            return item.senderUserId;
        });
        getUsers(userList, function () {
            message.forEach(function (item) {
                item.user = Cache.user[item.senderUserId];
            });
            callback(null, message);
        });
    } else {
        getUsers([userId], function (errorCode, list) {
            if(errorCode){
                return callback(errorCode);
            }
            message.user = list[0];
            callback(null, message);
        });
    }
};

/*
params.position 1 从缓存获取 2 从服务器获取
params.timestamp
params.count
params.conversationType
params.targetId
params.type 要获取的消息类型  **仅本地消息支持
params.before true:获取比指定时间戳早发的消息,false: 获取比指定时间戳晚发的消息 **仅本地消息支持 false
*/
Message.get = function (params, callback) {
    callback = callback || $.noop;
    var key = params.conversationType + '_' + params.targetId;
    var cacheList = Message._cache[key] = Message._cache[key] || [];

    if (+params.position === 2 || cacheList.length === 0 ) {

        params.timestamp = Number(params.timestamp) || 0;
        params.count = params.count || config.dataModel.getHistoryMessagesNumber;
        var undef;
        if (params.before === undef) {
            params.before = true;
        }

        getHistoryMessages(params, function (errorCode, messageList, hasMore) {
            if (errorCode) {
                callback(errorCode);
                return;
            }
            //C++ 本地获取不到，需要从服务端获取
            var notSearchMessage = !params.type && params.before;
            if (messageList.length < params.count && notSearchMessage) {
                params.count = params.count - messageList.length;
                // SDK 和服务器不允许获取一条历史消息
                var count = params.count;
                if (params.count === 1) {
                    params.count = 2;
                }
                var earliestMessage = messageList[0];
                if (earliestMessage) {
                    params.timestamp = earliestMessage.sentTime;
                }
                getRemoteHistoryMessages(params, function (errorCode, remoteMessageList, hasMore) {
                    remoteMessageList = remoteMessageList.slice(-count);
                    remoteMessageList = remoteMessageList.concat(messageList);
                    if (cacheList.length === 0 && +params.position === 1) {
                        Message._cache[key] = remoteMessageList;
                    }
                    callback(errorCode, remoteMessageList, hasMore);
                });
            } else {
                if (cacheList.length === 0 && +params.position === 1) {
                    Message._cache[key] = messageList;
                }
                callback(errorCode, messageList, hasMore);
            }
        });

    } else {
        if (cacheList.length > 50 ) {
            var length = cacheList.length - 50;
            cacheList.splice(0, length);
        }
        callback(null, cacheList, true);
    }
};

/**
@param {object}      params
@param {number}      params.conversationType - 会话类型
@param {string}      params.targetId         - 会话Id
@param {number|null} params.timestamp        - 起始时间戳
@param {number}      params.count            - 获取消息条数
@param {string}      params.type             - 获取消息类型
@param {boolean}     params.before           - true: 获取比指定时间戳早的消息，false：获取比指定时间戳晚的消息

@param {function}    callback                - 回调函数
*/
function getHistoryMessages(params, callback) {
    var objectName = '';
    if (params.type) {
        objectName = RongIMClient.MessageParams[params.type].objectName;
    }
    RongIMClient.getInstance().getHistoryMessages(params.conversationType, params.targetId, params.timestamp, params.count, {
        onSuccess: function (list, hasMore) {
            for(var i = 0, len = list.length; i < len; i++){
                bindResponseToMessage(list[i]);
            }
            Message.addSendUserInfo(list, function (errorCode, messageList) {
                callback(null, messageList, hasMore);
            });
        },
        onError: function (errorCode) {
            callback(getLibErrorCode(errorCode));
        }
    }, objectName, params.before);
}

/**
@param {object}      params
@param {number}      params.conversationType - 会话类型
@param {string}      params.targetId         - 会话Id
@param {number|null} params.timestamp        - 起始时间戳
@param {number}      params.count            - 获取消息条数

@param {function}    callback                - 回调函数
*/
function getRemoteHistoryMessages(params, callback) {
    RongIMClient.getInstance().getRemoteHistoryMessages(params.conversationType, params.targetId, params.timestamp, params.count, {
        onSuccess: function (list, hasMore) {
            for(var i = 0, len = list.length; i < len; i++){
                bindResponseToMessage(list[i]);
            }
            Message.addSendUserInfo(list, function (errorCode, messageList) {
                callback(null, messageList, hasMore);
            });
        },
        onError: function (errorCode) {
            callback(getLibErrorCode(errorCode));
        }
    });
}

/*
conversationType
targetId
messageUId
*/
Message.getMessageNearList = function (idOrUId, callback) {
    callback = callback || $.noop;
    Message.getOne(idOrUId, function (errorCode, message) {
        if (errorCode) {
            return callback(getLibErrorCode(errorCode));
        }
        var targetId = message.targetId;
        var conversationType = message.conversationType;
        var timestamp = message.sentTime;
        var params = {
            targetId: targetId,
            conversationType: conversationType,
            timestamp: timestamp,
            position: 2
        };
        messageNearList(params, message, callback);
    });
};
function messageNearList(params, message, callback) {
    var messageList = [];
    Message.get(params, function (errorCode, list) {
        if (errorCode) {
            return callback(getLibErrorCode(errorCode));
        }
        messageList = list;
        Message.addSendUserInfo([message], function (errorCode, list) {
            if (errorCode) {
                return callback(errorCode);
            }
            var msg = list[0];
            messageList.push(msg);
            params.before =  false;
            Message.get(params, function (errorCode, list) {
                if (errorCode) {
                    return callback(getLibErrorCode(errorCode));
                }
                list.reverse();
                messageList = messageList.concat(list);
                callback(null, messageList, message, msg);
            });
        });
    });
}

Message.getOne = function (idOrUId, callback) {
    callback = callback || $.noop;
    RongIMClient.getInstance().getMessage(idOrUId, {
        onSuccess: function (message) {
            callback(null, message);
        },
        onError: function (errorCode) {
            callback(getLibErrorCode(errorCode));
        }
    });
};

function getSentTime() {
    return new Date().getTime() - RongIMClient.getInstance().getDeltaTime();
}

var getLocalMessage = function (params) {
    var msg = new RongIMLib.Message();
    msg.content = params.content;
    msg.conversationType = params.conversationType;
    msg.targetId = params.targetId;
    msg.senderUserId = Cache.auth.id;
    msg.sentStatus = RongIMLib.SentStatus.SENDING;
    msg.messageId = params.messageId;
    msg.messageDirection = RongIMLib.MessageDirection.SEND;
    msg.messageType = params.content.messageName;
    msg.sentTime = getSentTime();
    msg.receivedStatus = RongIMLib.ReceivedStatus.UNREAD;
    return msg;
};

function sendMessage(params, callback) {
    callback = callback || $.noop;
    // 发送消息前将 localPath 删除防止发给其他端
    var content = $.extend({}, params.content);
    delete content.localPath;
    RongIMClient.getInstance().sendMessage(params.conversationType, params.targetId, content, {
        onBefore: function(messageId) {
            params.messageId = messageId;
            callback(null, getLocalMessage(params));
            Conversation.getList(function (errorCode, list) {
                if (errorCode) {
                    return callback(getLibErrorCode(errorCode));
                }
                converObserverList.notify(list);
            });
        },
        onSuccess: function (message) {
            fixSendMessageBug(message);
            callback(null, message);
            Conversation.getList(function (errorCode, list) {
                if (errorCode) {
                    return callback(getLibErrorCode(errorCode));
                }
                converObserverList.notify(list);
            });
        },
        onError: function (errorCode, message) {
            fixSendMessageBug(message);
            message.sentTime = new Date().getTime();
            callback(errorCode, message);
            Conversation.getList(function (errorCode, list) {
                !errorCode && converObserverList.notify(list);
            });
        }
    }, params.mentiondMsg);
}

function fixSendMessageBug(message) {
    if (+message.messageDirection === RongIMLib.MessageDirection.SEND) {
        message.senderUserId = Cache.auth.id;
        // Web SDK 发送消息 receivedStatus 为 undefined
        var undef;
        if (message.receivedStatus === undef) {
            message.receivedStatus = RongIMLib.ReceivedStatus.UNREAD;
        }
    }
    if (!message.sentTime) {
        // c++ error 回调返回 message 没有sentTime
        message.sentTime = getSentTime();
    }
    return message;
}

Message.send = function (params, callback) {
    callback = callback || $.noop;
    sendMessage(params, function (errorCode, message) {
        Message._sendPush(message, function (errorCode2, msg) {
            msgObserverList.notify(msg);
            callback(getLibErrorCode(errorCode), msg);
        });
    });
};

// params.conversationType
// params.targetId
// params.user = {id:'userId', name: 'username', imageUrl:'portaitUri'}
Message.sendCard = function(params, callback){
    params.content = new RongIMClient.RegisterMessage.CardMessage(params.user);
    Message.send(params, callback);
};

Message.sendSyncReadStatusMessage = function (message) {
    var lastMessageSendTime = message.sentTime;
    var msg = new RongIMLib.SyncReadStatusMessage({lastMessageSendTime: lastMessageSendTime});
    var type = Number(message.conversationType);
    var id = message.targetId;
    RongIMClient.getInstance().sendMessage(type, id, msg, {
        onSuccess: function () {

        },
        onError: function () {

        }
    });
};

Message.sendReadStatus = function(lastMessage){
    var content = {
        lastMessageSendTime: lastMessage.sentTime,
        messageUId: lastMessage.messageUId,
        type: 1
    };
    var msg = new RongIMLib.ReadReceiptMessage(content);
    var type = Number(lastMessage.conversationType);
    var id = lastMessage.targetId;
    RongIMClient.getInstance().sendMessage(type, id, msg, {
        onSuccess: function () {

        },
        onError: function () {

        }
    });
};

Message.setMessageSentStatus = function(params, callback){
    callback = callback || $.noop;
    RongIMClient.getInstance().setMessageSentStatus(params.messageId, params.status, {
        onSuccess: function(isUpdate){
            callback(null, isUpdate);
        },
        onError: function(error){
            callback(error);
        }
    });
};

Message.setMessageReceivedStatus = function (params, callback) {
    callback = callback || $.noop;
    RongIMClient.getInstance().setMessageReceivedStatus(params.messageId, params.status, {
        onSuccess: function () {
            callback(null);
        },
        onError: function (errorCode) {
            callback(errorCode);
        }
    });
};

Message.setMessageStatus = function (message) {
    var status = RongIMLib.SentStatus.READ;
    var key = getCacheKey(message);
    var cache = Message._cache[key];
    var timespan = message.content.lastMessageSendTime;
    if (cache) {
        cache.forEach(function (item) {
            var isSend = +item.messageDirection === RongIMLib.MessageDirection.SEND;
            var isBefore = item.sentTime <= timespan;
            var isFailed = +item.sentStatus === RongIMLib.SentStatus.FAILED;
            if (isSend && isBefore && !isFailed) {
                item.sentStatus = status;
            }
        });
    }
    var type = message.conversationType;
    var id = message.targetId;
    RongIMClient.getInstance().setMessageStatus(type, id, timespan, '1', {
        onSuccess: function () {
            Conversation.getList(function (errorCode, list) {
                if(errorCode) {
                    return;
                }
                converObserverList.notify(list);
            });
        },
        onError: function () {

        }
    });
};

Message.sendGroupResponse = function(type, id, req) {
    type = Number(type);
    var msg = new RongIMLib.ReadReceiptResponseMessage({receiptMessageDic:req});
    RongIMClient.getInstance().sendMessage(type, id, msg, {
        onSuccess: function () {
            // 注意:更新会话列表
            // 更新本地会话缓存
            var key = getStoreKey('req'),
                conversationKey = generatorKey([type, id]);
            var request = storage.get(key) || {};
            delete request[conversationKey];
            if (!$.isEmptyObject(request)) {
                storage.set(key, request);
            }else{
                storage.remove(key);
            }
        },
        onError: function () {

        }
    });
};

Message.sendGroupRequest = function(message){
    utils.console.log(' 群聊请求回执', arguments);
    var type = Number(message.conversationType);
    var id = message.targetId;
    var messageUId = message.messageUId;
    var msg = new RongIMLib.ReadReceiptRequestMessage({messageUId:messageUId});
    RongIMClient.getInstance().sendMessage(type, id, msg, {
        onSuccess: function () {
            var key = getStoreKey('res_' + messageUId);
            storage.set(key, []);
        },
        onError: function () {

        }
    });
};

/**
 * @params.conversationType
 * @params.targetId
 * @params.sentTime
 * @params.messageUId
 * @params.sendUserId
 * @params.extra
 * @params.user
 */
Message.recall = function(message, callback){
    callback = callback || $.noop;
    var params = {
        conversationType: message.conversationType,
        targetId: message.targetId,
        messageUId: message.messageUId,
        messageId: message.messageId,
        sentTime: message.sentTime,
        senderUserId: message.senderUserId
    };
    RongIMClient.getInstance().sendRecallMessage(params, {
        onSuccess: function(msg){
            utils.console.log('消息撤回：', msg);
            msg.sentTime = message.sentTime;
            msgObserverList.notify(msg);
            callback(null, msg);
            Message.addSendUserInfo(msg, function (errorCode, msg) {
                if (errorCode) {
                    return callback(errorCode);
                }
                var key = getCacheKey(message);
                var list = Message._cache[key];
                spliceMessage(list, message.messageId, msg);
                var objectName = RongIMClient.MessageParams[msg.messageType].objectName;
                RongIMClient.getInstance().setMessageContent(message.messageId, params, objectName);
                Conversation.getList(function (errorCode, list) {
                    if (errorCode) {
                        return callback(getLibErrorCode(errorCode));
                    }
                    converObserverList.notify(list);
                });
            });
        },
        onError: function(code){
            callback(code);
        }
    });
};

/**
 * @params.conversationType
 * @params.targetId
 * @params.keyword
 * @params.timestamp ： 时间戳，默认 0
 * @params.count : 0-20
 * @params.total ：是否返回总数
 */
Message.search = function(params, callback) {
    callback = callback || $.noop;
    var defer = $.Deferred();
    var _instance = RongIMClient.getInstance();
    var isGetTotle = 1;
    _instance.searchMessageByContent(params.conversationType, params.targetId, params.keyword, params.timestamp, params.count, isGetTotle, {
        onSuccess: function(msgList, matched){
            Message.addSendUserInfo(msgList, function (errorCode, messageList) {
                callback(errorCode, messageList, matched);
                defer.resolve({list: messageList, count: matched});
            });
        },
        onError: function(code){
            callback(code);
        }
    });
    return defer.promise();
};

/**
 * @params.conversationType
 * @params.targetId
 * @params.messageIds // messageId 的数据，不是 messageUId
 */
Message.removeLocal = function (params, callback) {
    callback = callback || $.noop;
    RongIMClient.getInstance().deleteLocalMessages(params.conversationType, params.targetId, params.messageIds, {
        onSuccess:function(isRemove){
            callback(null, isRemove);
            var key = getCacheKey(params);
            var list = Message._cache[key];
            params.messageIds.forEach(function (id) {
                spliceMessage(list, id);
            });
            Conversation.getList(function (errorCode, list) {
                if (errorCode) {
                    return callback(getLibErrorCode(errorCode));
                }
                converObserverList.notify(list);
            });
        },
        onError: function(code){
            callback(code);
        }
    });
};

/*
    向本地插入一条 Message

    params.conversationType
    params.targetId
    params.objectName
    params.content
    params.senderUserId
    params.direction
    params.sentStatus

    // 举例：取消文件消息内容
    params.content = {
        name:'core.js',
        type:'js',
        status: 0 // 0 取消
    }
*/
Message.insertMessage = function(params, callback){
    callback = callback || $.noop;
    if (utils.isEmpty(params.senderUserId)) {
        params.senderUserId = Cache.auth.id;
    }
    if (utils.isEmpty(params.objectName)) {
        params.objectName = RongIMClient.MessageParams[params.messageType].objectName;
    }
    if (isNaN(params.direction)) {
        params.direction = RongIMLib.MessageDirection.SEND;
    }
    if (isNaN(params.sentStatus)) {
        params.sentStatus = RongIMLib.SentStatus.FAILED;
    }
    if (isNaN(params.receivedStatus)) {
        params.receivedStatus = RongIMLib.ReceivedStatus.READ;
    }
    RongIMClient.getInstance().insertMessage(+params.conversationType, params.targetId, params, {
        onSuccess: function(message){
            message.sentTime = +new Date;
            message.messageType = message.content.messageName || params.messageType;
            var arg = {
                messageId: message.messageId
            };
            if (message.messageDirection === RongIMLib.MessageDirection.SEND) {
                var sentStatus = params.sentStatus;
                message.sentStatus = sentStatus;
                arg.status = sentStatus;
                Message.setMessageSentStatus(arg);
            } else {
                var receivedStatus = params.receivedStatus;
                message.receivedStatus = receivedStatus;
                arg.status = receivedStatus;
                Message.setMessageReceivedStatus(arg);
            }
            Message._push(message);
            callback(null, message);
            Conversation.getList(function (errorCode, list) {
                if (errorCode) {
                    return callback(errorCode);
                }
                converObserverList.notify(list);
            });
        },
        onError: function(error){
            callback(error);
        }
    });
};

/*
    messageId: 要替换的原消息Id
    content: 要替换的消息体
    objectName: 修改消息类型为
*/
Message.setContent = function(message) {
    var objectName = message.objectName || '';
    var messageId = Number(message.messageId);
    var content = message.content;
    RongIMClient.getInstance().setMessageContent(messageId, content, objectName);
};

Message.watch = function (listener) {
    msgObserverList.add(listener);
};

Message.unwatch = function(listener){
    msgObserverList.remove(listener);
};

function generatorKey(keys){
    return keys.join('_');
}

function getStoreKey(key){
    var userId = Cache.auth.id;
    var keys = ['rce_g', userId, key];
    return generatorKey(keys);
}

Message.registerMessage = function() {
    var messageName = 'PresenceNotificationMessage';
    var objectName = 'RCE:PresNtf';
    var messageTag = new RongIMLib.MessageTag(false, false);
    // windows, OSX, Web, iOS, Android
   /*
    type : 默认为 0, 0 表示在线状态，没有其他值，待后续扩展
    targetId： 被订阅人 Id
    title: Login_Status_PC 或 Login_Status_Mobile 或 Login_Status_Web
    value: online 或者 offline
    updateDt: 更新时间
    */
    var properties = ['type', 'targetId', 'title', 'value', 'updateDt'];
    RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

    // 群成员变化消息
    messageName = 'GroupMemChangedNotifyMessage';
    objectName = 'RCE:GrpMemChanged';
    messageTag = new RongIMLib.MessageTag(false, true);
    properties = ['action', 'operatorUser', 'targetGroup', 'targetUsers'];
    RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

    // 群信息更新消息
    messageName = 'GroupNotifyMessage';
    objectName = 'RCE:GrpNtfy';
    messageTag = new RongIMLib.MessageTag(false, true);
    properties = ['action', 'data', 'operatorUser', 'targetGroup'];
    RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

    // 群组命令消息
    messageName = 'GroupCmdMessage';
    objectName = 'RCE:GrpCmd';
    messageTag = new RongIMLib.MessageTag(false, false);
    properties = ['action', 'operatorUser', 'targetGroup'];
    RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

    // UpdateStatus
    messageName = 'RCEUpdateStatusMessage';
    objectName = 'RCE:UpdateStatus';
    messageTag = new RongIMLib.MessageTag(false, false);
    properties = ['uid', 'updateType', 'version'];
    RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

    // 帐号被禁用
    messageName = 'InactiveCommandMessage';
    objectName = 'RCE:InactiveCmd';
    messageTag = new RongIMLib.MessageTag(false, false);
    properties = ['userId'];
    RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

    // CardMessage
    messageName = 'CardMessage';
    objectName = 'RC:CardMsg';
    messageTag = new RongIMLib.MessageTag(true, true);
    properties = ['userId', 'name', 'portraitUri', 'sendUserId', 'sendUserName', 'extra'];
    RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

    // LocalFileMessage
    messageName = 'LocalFileMessage';
    objectName = 'LRC:fileMsg';
    messageTag = new RongIMLib.MessageTag(true, true);
    properties = ['type', 'name', 'localPath', 'status'];
    RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

    // LocalImageMessage
    messageName = 'LocalImageMessage';
    objectName = 'LRC:imageMsg';
    messageTag = new RongIMLib.MessageTag(true, true);
    properties = ['localPath', 'status', 'content', 'imageUri'];
    RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

    // 自定义表情
    messageName = 'CustomEmoji';
    objectName = 'RCBQMM:EmojiMsg';
    messageTag = new RongIMLib.MessageTag(true, true);
    properties = ['bqmmContent', 'bqmmExtra'];
    RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

    // 小视频
    messageName = 'SightMessage';
    objectName = 'RC:SightMsg';
    messageTag = new RongIMLib.MessageTag(true, true);
    properties = ['content', 'sightUrl', 'duration', 'localPath', 'name', 'size'];
    RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

    // 位置共享
    messageName = 'RealTimeLocationStartMessage';
    objectName = 'RC:RLStart';
    messageTag = new RongIMLib.MessageTag(false, true);
    properties = ['content', 'extra'];
    RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

    messageName = 'KickoffMsg';
    objectName = 'RCE:KickoffMsg';
    messageTag = new RongIMLib.MessageTag(false, false);
    properties = ['content'];
    RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

    messageName = 'RealTimeLocationQuitMessage';
    objectName = 'RC:RLQuit';
    messageTag = new RongIMLib.MessageTag(false, false);
    properties = ['content', 'extra'];
    RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

    messageName = 'RealTimeLocationJoinMessage';
    objectName = 'RC:RLJoin';
    messageTag = new RongIMLib.MessageTag(false, false);
    properties = ['content', 'extra'];
    RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

    messageName = 'RealTimeLocationStatusMessage';
    objectName = 'RC:RL';
    messageTag = new RongIMLib.MessageTag(false, false);
    properties = ['latitude', 'longitude'];
    RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

    messageName = 'BQMMEmojiMessage';
    objectName = 'RCBQMM:EmojiMsg';
    messageTag = new RongIMLib.MessageTag(true, true);
    properties = ['bqmmContent', 'bqmmExtra'];
    RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

    // 视频会话总结
    messageName = 'VideoMessage';
    objectName = 'RC:VideoMsg';
    messageTag = new RongIMLib.MessageTag(true, true);
    properties = ['content', 'code', 'duration'];
    RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

    // 音频会话总结
    messageName = 'AudioMessage';
    objectName = 'RC:AudioMsg';
    messageTag = new RongIMLib.MessageTag(true, true);
    properties = ['content', 'code', 'duration'];
    RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

    // 屏幕共享会话总结
    messageName = 'ShareScreenMessage';
    objectName = 'RC:ShareScreenMsg';
    messageTag = new RongIMLib.MessageTag(true, true);
    properties = ['content', 'code', 'duration'];
    RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

    // 好友消息
    messageName = 'ContactNotifyMessage';
    objectName = 'RCE:ContactNtfy';
    messageTag = new RongIMLib.MessageTag(false, false);
    properties = ['actionType', 'operator', 'target', 'data'];
    RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

    // Pin消息创建
    messageName = 'PinNotifyMessage';
    objectName = 'RCE:Pin';
    messageTag = new RongIMLib.MessageTag(false, false);
    properties = ['creatorUid', 'pinUid', 'timestamp', 'content'];
    RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

    // Pin被评论
    messageName = 'PinCommentMessage';
    objectName = 'RCE:PinComment';
    messageTag = new RongIMLib.MessageTag(false, false);
    properties = ['publisherUid', 'pinUid', 'timestamp', 'comment'];
    RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

    // Pin被确认
    messageName = 'PinConfirmMessage';
    objectName = 'RCE:PinConfirm';
    messageTag = new RongIMLib.MessageTag(false, false);
    properties = ['operatorUid', 'pinUid', 'timestamp'];
    RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

    // Pin新添加了联系人
    messageName = 'PinNewReciverMessage';
    objectName = 'RCE:PinNewReciver';
    messageTag = new RongIMLib.MessageTag(false, false);
    properties = ['pinUid', 'timestamp', 'receivers'];
    RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);
};

function bindResponseToMessage(message, list) {
    if (list) {
        var userId = Cache.auth.id;
        var messageUIds = message.content.receiptMessageDic[userId] || [];
        for(var i = 0, len = list.length; i < len; i++){
            var cacheMessage = list[i];
            if (messageUIds.indexOf(cacheMessage.messageUId) !== -1) {
                var receipt = cacheMessage.receiptResponse = cacheMessage.receiptResponse || [];
                if (receipt.indexOf(message.senderUserId) === -1) {
                    receipt.push(message.senderUserId);
                }
            }
        }

        messageUIds.forEach(function (uid) {
            var key = getStoreKey('res_' + uid);
            var receipt = storage.get(key) || [];
            if (receipt.indexOf(message.senderUserId) === -1) {
                receipt.push(message.senderUserId);
                storage.set(key, receipt);
            }
        });
    }else{
        var reskey = getStoreKey('res_' + message.messageUId);
        message.receiptResponse = storage.get(reskey);
    }
}

Message.getTypes = function(){
    var type = RongIMClient.MessageType;
    var msgTypes = [
        type.TextMessage,
        type.ImageMessage,
        type.FileMessage,
        type.VoiceMessage,
        type.CardMessage,
        type.LocationMessage,
        type.SightMessage
    ];
    return msgTypes;
};
/*
    params.messageType
    params.content
 */
Message.create = function(params) {
    var messageType = params.messageType;
    var content = params.content;

    var Message = RongIMLib[messageType] || RongIMClient.RegisterMessage[messageType];

    if (!Message) {
        var info = messageType + 'net exist.';
        throw new Error(info);
    }

    return new Message(content);
};

var getTopListFromRemote = function(callback){
    var data = Cache.conversation;
    if (data.isSetting) {
        var error = null;
        var settings = data.settings;
        callback(error, settings);
        return;
    }
    Http.get('/conversation').done(function (result) {
        var settings = result.settings;

        data.settings = settings;
        data.isSetting = true;

        callback(null, settings);
    }).fail(callback);
};

var checkConversation = function(source, target){
    return +source.conversation_type === +target.conversationType && source.target_id === target.targetId;
};

var splitTopConversation = function(list, callback){
    // 1、获取置顶数组 √
    // 2、匹配会话列表 List √
    // 3、按 sentTime 排序置顶 √
    // 4、追加到 list 中，保证操作的是同一个对象 √
    var tempList = [];

    var mergeConversation = function(topList){
        if (util.isArray(topList)) {
            var idxs = [];
            for(var i = 0; i < topList.length; i++){
                var topConversation = topList[i];
                for(var j = 0; j < list.length; j++){
                    var conversation = list[j];
                    if (checkConversation(topConversation, conversation)) {
                        conversation.isTop = topConversation.top;
                        conversation.notificationStatus = topConversation.not_disturb;
                        if (conversation.isTop) {
                            idxs.push(j);
                            tempList.push(conversation);
                        }
                    }
                }
            }

            idxs.sort(function(a, b){
                return b - a;
            });
            for(var k = 0; k<idxs.length; k++){
                list.splice(idxs[k], 1);
            }
        }
    };

    var buildConversationList = function(result){
        mergeConversation(result);
        tempList.sort(function(a, b){
            return b.sentTime - a.sentTime;
        });
        tempList.reverse();
        for(var i = 0, len = tempList.length; i < len; i++){
            list.unshift(tempList[i]);
        }

        callback(toJSON(list));
    };

    var topListFactory = function(){
        return getTopListFromRemote;
    };

    var delDuplicate = function(arr) {
        return arr.reduce(function (p, c) {

            // create an identifying id from the object values
            var id = [c.conversationType, c.targetId].join('|');

            // if the id is not found in the temp array
            // add the object to the output array
            // and add the key to the temp array
            if (p.temp.indexOf(id) === -1) {
                p.out.push(c);
                p.temp.push(id);
            }
            return p;

        // return the deduped array
        }, { temp: [], out: [] }).out;
    };

    topListFactory()(function(errorCode, result){
        if(errorCode) {
            return utils.console.warn(errorCode);
        }
        // utils.console.log(result);
        // 服务端 toplist 有重复,需加入排重
        var list = delDuplicate(result);
        Cache.conversation.topList = list;
        buildConversationList(list);
    });
};

function addConversationUserInfo(list, callback){
    callback = callback || $.noop;
    var ConversationType = RongIMLib.ConversationType;
    var isGroup = function(item){
        return item.conversationType === ConversationType.GROUP;
    };

    var bindInfo = function(){
        list.forEach(function (item) {
            if(isGroup(item)) {
                item.group = {};
                Group.getOne(item.targetId, function (errorCode, group) {
                    if(errorCode) {
                        utils.console.warn('获取群组信息失败, groupId=' + item.targetId +  '（错误码：' + errorCode + '）');
                    } else {
                        item.group = group ;
                    }
                });
            } else {
                item.user = {};
                var userId = item.targetId;
                User.get(userId, function (errorCode, user) {
                    if(errorCode) {
                        utils.console.warn('获取用户信息失败, userId=' + userId + '(错误码：' + errorCode + ')');
                    } else {
                        item.user = user;
                    }
                    if (!user) {
                        Conversation.remove(item.conversationType, item.targetId);
                        list.forEach(function (conv, index) {
                            if(util.sameConversation(item, conv)) {
                                list.splice(index, 1);
                                return false;
                            }
                        });
                    }
                });
            }
            if(item.latestMessage) {
                fixSendMessageBug(item.latestMessage);
                var senderUserId = item.latestMessage.senderUserId;
                User.get(senderUserId, function (errorCode, user) {
                    if(errorCode) {
                        utils.console.warn('获取用户信息失败'+ '（错误码：' + errorCode + '）');
                        item.latestMessage.user = {};
                    } else {
                        item.latestMessage.user = user;
                    }
                });
            }
        });
        var error = null;
        callback(error, list);
    };

    var getIds = function(items){
        return items.map(function(item){
            return item.targetId;
        });
    };

    var groups = list.filter(isGroup);
    var groupIds = getIds(groups);

    var isUser = function(item){
        return item.conversationType === ConversationType.PRIVATE;
    };
    var users = list.filter(isUser);
    var userIds = getIds(users);

    var senderIds = list.map(function(item){
        return item.latestMessage.senderUserId;
    });
    userIds = userIds.concat(senderIds);

    $.when(getBatchGroups(groupIds), getUsers(userIds)).then(function(){
        bindInfo();
    });

}

function getCurrentConnectionStatus() {
    var instance = RongIMClient.getInstance();
    return instance.getCurrentConnectionStatus();
}

var getListFromRemote = function(callback){
    callback = callback || $.noop;
    var status = getCurrentConnectionStatus();
    var CONNECTED = 0;
    if(status !== CONNECTED) {
        var errorCode = getLibErrorCode('status-' + status);
        return callback(errorCode);
    }
    var ConversationType = RongIMLib.ConversationType;
    var isGroup = function(type){
        return type === ConversationType.GROUP;
    };

    var isUser = function(type){
        return type === ConversationType.PRIVATE;
    };

    RongIMClient.getInstance().getConversationList({
        onSuccess: function(list) {
            var searchList = Cache.conversation.searchTempList, searchObj = {}, keys = [];
            searchList.forEach(function(item){
                var key = generatorKey([item.conversationType, item.targetId]);
                searchObj[key] = 1;
            });

            list.forEach(function(item){
                var type = item.conversationType;
                var targetId = item.targetId;
                var key = generatorKey([type, targetId]);
                var has = (key in searchObj);
                if (has) {
                    keys.push(key);
                }
                // 置顶和免打扰置为默认值 false, 然后从缓存中匹配置顶和免打扰设置
                item.isTop = false;
                item.notificationStatus = false;
                if (isUser(type)) {
                    item.user = Cache.user[targetId] || {};
                }
                if (isGroup(type)) {
                    item.group = Cache.group[targetId] || {};
                }
                var message = item.latestMessage;
                var senderUserId = message.senderUserId;
                message.user = Cache.user[senderUserId] || {};
            });
            searchList.forEach(function(item, index){
                item.isTop = false;
                item.notificationStatus = false;
                var type = item.conversationType;
                var targetId = item.targetId;
                keys.forEach(function(key){
                    if (generatorKey([type, targetId]) === key) {
                        searchList.splice(index, 1);
                    }
                });
            });
            list = searchList.concat(list);
            splitTopConversation(list, function(result){
                Cache.conversation.list = result;
                bindConversationRequestMsgs(result);
                callback(null, result);
                addConversationUserInfo(result);
            });
        },
        onError: function (errorCode) {
            callback(getLibErrorCode(errorCode));
        }
    }, null);
};

function bindConversationRequestMsgs(list) {
    var storeKey = getStoreKey('req');
    var data = storage.get(storeKey) || {};
    list.forEach(function (item) {
        var  conversationKey = generatorKey([item.conversationType, item.targetId]);
        item.requestMsgs =  data[conversationKey];
    });
}

var listFactory = function(){
    return getListFromRemote;
};

function getConversationInfo(conversation, callback){
    var conversationType = conversation.conversationType;
    var targetId = conversation.targetId;
    var getInfo = isGroup(conversationType) ? Group.getOne : User.get;
    getInfo(targetId, done);
    function done(errorCode, result) {
        if(errorCode) {
            return callback(errorCode);
        }
        var type = isGroup(conversationType) ? 'group' : 'user';
        conversation[type] = result || {};
        bindConversationRequestMsgs([conversation]);
        Conversation.getExpandInfo(conversation, function (errorCode, topMute) {
            conversation.isTop = topMute.top;
            conversation.notificationStatus = topMute.notDisturb;
            callback(null, conversation);
        });
    }
}

var createConversation = function(params){
    var reset = util.reset;
    var sentTime = +new Date;
    var data = {
        conversationType: 0,
        isTop: false,
        latestMessage: {
            sentTime: sentTime,
            messageType: 'TextMessage',
            content: ''
        },
        notificationStatus: false,
        receivedStatus: 0,
        targetId: '',
        sentTime: sentTime,
        unreadMessageCount: 0
    };
    reset(data, params);
    var conversation = new RongIMLib.Conversation();
    return reset(conversation, data);
};

Conversation.add = function(params, callback){
    callback = callback || $.noop;
    var type = params.conversationType;
    var targetId = params.targetId;
    var isSame = function(item){
        return item.conversationType === type && item.targetId === targetId;
    };
    var filter = function(item){
        return isSame(item);
    };
    var cacheList = Cache.conversation.list || [],
        list = cacheList.filter(filter);
    var isExist = (list.length > 0);
    if (!isExist) {
        var conversation = createConversation(params);
        var getIndex = function(){
            var topList = Cache.conversation.topList || [];
            topList.forEach(function(item){
                if (checkConversation(item, conversation)) {
                    conversation.isTop = item.top;
                    conversation.notificationStatus = item.not_disturb;
                }
            });
            topList = topList.filter(function(item){
                return item.top;
            });
            var getKey = function(item){
                return generatorKey([item.conversationType, item.targetId]);
            };
            var has = function(key, obj){
                return (key in obj);
            };
            var index = 0;
            if (!conversation.isTop) {
                var topObj = {};
                topList.forEach(function(item){
                    var key = getKey(item);
                    topObj[key] = 1;
                });
                cacheList.forEach(function(item){
                    var key = getKey(item);
                    has(key, topObj) && (index++);
                });
            }
            return index;
        };
        var insert = function(){
            var index = getIndex();
            cacheList.splice(index, 0, conversation);
        };
        getConversationInfo(conversation, function(){
            Cache.conversation.searchTempList.unshift(conversation);
            insert();
            RongIMClient.getInstance().addConversation(conversation);
            callback(conversation);
        });
    }
};

Conversation.getList = function (callback) {
    listFactory()(callback);
};

Conversation.getLocalList = function(){
    return Cache.conversation.list || [];
};

Conversation.getOne = function (conversationType, targetId, callback) {
    callback = callback || $.noop;
    RongIMClient.getInstance().getConversation(+conversationType, targetId, {
        onSuccess: function(conversation){
            if (!conversation) {
                // 会话不存在新建一个
                conversation = {
                    targetId: targetId,
                    conversationType: conversationType,
                    unreadMessageCount: 0
                };
            }

            getConversationInfo(conversation, callback);
        },
        onError: function(errorCode){
            callback(errorCode);
        }
    });
};

Conversation.getTotalUnreadCount = function (list, callback) {
    callback = callback || $.noop;
    var conversationTypes = [
        utils.conversationType.PRIVATE,
        utils.conversationType.GROUP
    ];
    var total = 0;
    list.forEach(function (item) {
        if (!item.notificationStatus && conversationTypes.indexOf(item.conversationType) !== -1) {
            total += item.unreadMessageCount;
        }
    });
    callback(null, total);
    // var conversationTypes = [1, 3];
    // RongIMClient.getInstance().getConversationUnreadCount(conversationTypes, {
    //     onSuccess: function (count) {
    //         callback(null, count);
    //     },
    //     onError: function (errorCode) {
    //         callback(getLibErrorCode(errorCode));
    //     }
    // });
};

Conversation.clearUnReadCount = function (conversationType, targetId, callback) {
    callback = callback || $.noop;
    Conversation.getOne(conversationType, targetId, function (errorCode, conversation) {
        if (errorCode) {
            return callback(getLibErrorCode(errorCode));
        }
        var type = +conversation.conversationType;
        var id = conversation.targetId;
        if (conversation.unreadMessageCount > 0) {
            clearUnreadCount(type, id, callback);

            if (type === RongIMLib.ConversationType.PRIVATE) {
                Message.sendReadStatus(conversation.latestMessage);
            } else if (type === RongIMLib.ConversationType.GROUP) {
                Message.sendSyncReadStatusMessage(conversation.latestMessage);
                if (conversation.requestMsgs) {
                    Message.sendGroupResponse(type, id, conversation.requestMsgs);
                }
            }
        }
    });
};

function clearUnreadCount(conversationType, targetId, callback) {
    callback = callback || $.noop;
    var status = getCurrentConnectionStatus();
    var CONNECTED = 0;
    if(status !== CONNECTED) {
        var errorCode = getLibErrorCode('status-' + status);
        return callback(errorCode);
    }

    RongIMClient.getInstance().clearUnreadCount(conversationType, targetId, {
        onSuccess: function () {
            Conversation.getList(function (errorCode, list) {
                if (errorCode === null) {
                    converObserverList.notify(list);
                }
            });
            callback();
        },
        onError: function (errorCode) {
            callback(getLibErrorCode(errorCode));
        }
    });
}

function clearUnreadCountByTimestamp(conversationType, targetId, timestamp, callback) {
    callback = callback || $.noop;
    var status = getCurrentConnectionStatus();
    var CONNECTED = 0;
    if(status !== CONNECTED) {
        var errorCode = getLibErrorCode('status-' + status);
        return callback(errorCode);
    }

    RongIMClient.getInstance().clearUnreadCountByTimestamp(conversationType, targetId, timestamp, {
        onSuccess: function () {
            Conversation.getList(function (errorCode, list) {
                if (errorCode === null) {
                    converObserverList.notify(list);
                }
            });
            callback();
        },
        onError: function (errorCode) {
            callback(getLibErrorCode(errorCode));
        }
    });
}

Conversation.getDraft = function (conversationType, targetId) {
    var path = conversationType + '/' + targetId;
    return Conversation.draft[path] || '';
};

Conversation.setDraft = function (conversationType, targetId, draft) {
    var path = conversationType + '/' + targetId;
    Conversation.draft[path] = draft;
};

Conversation.clearDraft = function (conversationType, targetId) {
    Conversation.setDraft(conversationType, targetId, '');
};

Conversation.remove = function (conversationType, targetId, callback) {
    callback = callback || $.noop;
    var status = getCurrentConnectionStatus();
    var CONNECTED = 0;
    if(status !== CONNECTED) {
        var errorCode = getLibErrorCode('status-' + status);
        return callback(errorCode);
    }
    var isSame = function(item){
        return item.conversationType === conversationType && item.targetId === targetId;
    };
    var searchList = Cache.conversation.searchTempList;
    searchList.forEach(function(item, index){
        if (isSame(item)) {
            searchList.splice(index, 1);
        }
    });
    RongIMClient.getInstance().removeConversation(conversationType, targetId, {
        onSuccess: function(bool) {
            if (bool) {
                Conversation.getList(function (errorCode, list) {
                    if (errorCode === null) {
                        converObserverList.notify(list);
                    }
                });
                callback();
            } else {
                callback(bool);
            }
        },
        onError: function(errorCode) {
            callback(getLibErrorCode(errorCode));
        }
    });
};

var toggleTop = function(conversationType, targetId, isTop, callback){
    callback = callback || $.noop;
    var item = {
        1: function(){
            var topObj = {
                conversation_type: conversationType,
                target_id: targetId,
                top: true,
                not_disturb: false
            }, notHave = true;
            Cache.conversation.topList = Cache.conversation.topList || [];
            var topList = Cache.conversation.topList;
            for(var i =0; i < topList.length; i++){
                var temp = topList[i];
                if (+temp.conversation_type === +conversationType && temp.target_id === targetId) {
                    temp.top = true;
                    notHave = false;
                }
            }
            notHave && topList.push(topObj);
        },
        0: function(){
            var topList = Cache.conversation.topList || [];
            for(var i =0; i < topList.length; i++){
                var temp = topList[i];
                if (+temp.conversation_type === +conversationType && temp.target_id === targetId) {
                    if (temp.top || temp.not_disturb) {
                        temp.top = false;
                    }else{
                        topList.splice(i, 1);
                    }
                }
            }
        }
    };
    Http.put('/conversation/top', {
        conversation_type: conversationType,
        target_id: targetId,
        top: isTop
    }).done(function (result) {
        item[isTop]();
        callback(null, result);
        Conversation.getList(function (errorCode, list) {
            if (errorCode) {
                return callback( errorCode);
            }
            converObserverList.notify(list);
        });
    }).fail(callback);
};

Conversation.top = function(conversationType, targetId, callback){
    toggleTop(conversationType, targetId, 1, callback);
};

Conversation.untop = function(conversationType, targetId, callback){
    toggleTop(conversationType, targetId, 0, callback);
};

Conversation.search = function (keyword, callback) {
    callback = callback || $.noop;
    var status = getCurrentConnectionStatus();
    var CONNECTED = 0;
    if(status !== CONNECTED) {
        var errorCode = getLibErrorCode('status-' + status);
        return callback(errorCode);
    }

    RongIMClient.getInstance().searchConversationByContent(keyword, {
        onSuccess: function(conversationList){
            addConversationUserInfo(conversationList, function (errorCode, list) {
                // 补充搜索到几条消息。TODO: 希望 SDK 可以支持
                if (errorCode) {
                    return callback(getLibErrorCode(errorCode));
                }
                var promiseList = [];
                list.forEach(function (item) {
                    var defer = $.Deferred();
                    promiseList.push(defer.promise());
                    var params = {
                        conversationType: item.conversationType,
                        targetId: item.targetId,
                        timestamp: 0,
                        keyword: keyword,
                        count: 20
                    };
                    Message.search(params, function (errorCode, list, count) {
                        if (errorCode) {
                            return callback(getLibErrorCode(errorCode));
                        }
                        item.search = {
                            list: list,
                            count: count
                        };
                        defer.resolve();
                    });
                });
                $.when.apply(null, promiseList).then(function () {
                    callback(null, list);
                });
            });
        },
        onError: function (code) {
            callback(code);
        }
    });
};

var toggleMute = function (conversationType, targetId, isMute, callback) {
    callback = callback || $.noop;
     var item = {
        1: function(){
            var topObj = {
                conversation_type: conversationType,
                target_id: targetId,
                top: false,
                not_disturb: true
            }, notHave = true;
            Cache.conversation.topList = Cache.conversation.topList || [];
            var topList = Cache.conversation.topList;
            for(var i =0; i < topList.length; i++){
                var temp = topList[i];
                if (+temp.conversation_type === +conversationType && temp.target_id === targetId) {
                    temp.not_disturb = true;
                    notHave = false;
                }
            }
            notHave && topList.push(topObj);
        },
        0: function(){
            var topList = Cache.conversation.topList || [];
            for(var i =0; i < topList.length; i++){
                var temp = topList[i];
                if (+temp.conversation_type === +conversationType && temp.target_id === targetId) {
                    if (temp.top || temp.not_disturb) {
                        temp.not_disturb = false;
                    }else{
                        topList.splice(i, 1);
                    }
                }
            }
        }
    };
    Http.put('/conversation/notdisturb', {
        conversation_type: conversationType,
        target_id: targetId,
        not_disturb: isMute
    }).done(function (result) {
        item[isMute]();
        callback(null, result);
        Conversation.getList(function (errorCode, list) {
            if (errorCode) {
                return callback(errorCode);
            }
            converObserverList.notify(list);
        });
    }).fail(callback);
};

function getExpandInfo(type, id) {
    var result = {};
    Cache.conversation.topList.forEach(function (item) {
        if (+item.conversation_type === +type && item.target_id === id) {
            result = item;
        }
    });
    return result;
}

/*
params.conversationType 会话类型
params.targetId 会话 Id
*/
Conversation.getExpandInfo = function (params, callback) {
    var type = params.conversationType;
    var id = params.targetId;
    callback = callback || $.noop;
    if (Cache.conversation.topList) {
        var result = getExpandInfo(type, id);
        callback(null, result);
    } else {
        getTopListFromRemote(function (errorCode, list) {
            Cache.conversation.topList = list;
            var result = getExpandInfo(type, id);
            callback(null, result);
        });
    }
};

Conversation.mute = function(conversationType, targetId, callback){
    toggleMute(conversationType, targetId, 1, callback);
};

Conversation.unmute = function(conversationType, targetId, callback){
    toggleMute(conversationType, targetId, 0, callback);
};

Conversation.watch = function (handle) {
    converObserverList.add(handle);
};

Conversation.unwatch = function(handle){
    converObserverList.remove(handle);
};

function isGroup(conversationType) {
    return +conversationType === 3;
}

var BrancheType = {
    Dept: 1,
    Member: 0
};

function formatDept(dept) {
    var path = (Cache.orgTree[dept.id] || {}).path || '';
    return {
        id: dept.id,
        deptName: dept.name,
        path: path,
        avatar: '',
        memberCount: dept.member_count
    };
}

function branchesGetMemberId(branches) {
    return branches.filter(function (item) {
        return +item.type === BrancheType.Member;
    }).map(function (item) {
        return item.id;
    });
}

function branchesGetDept(branches) {
    return branches.filter(function (item) {
       return +item.type === BrancheType.Dept;
    }).map(function (item) {
        return formatDept(item);
    });
}

Organization.getCompany = function getCompany(callback) {
    callback = callback || $.noop;
    if (getCompany.cache) {
        return callback(null, getCompany.cache);
    }

    var companyPromise = Http.get('/company');
    var rootPromise = Http.get('/departments/root');

    $.when(companyPromise, rootPromise).done(function (company, rootResult) {
        var memberIds = branchesGetMemberId(rootResult.data);
        getUsers(memberIds, function (errorCode, list) {
            if (errorCode) {
                return callback(errorCode);
            }
            company.members = list;
            company.depts = branchesGetDept(rootResult.data);
            getCompany.cache = company;
            callback(null, company);
        });
    }).fail(callback);
};

Organization.getDept = function (deptId, callback) {
    callback = callback || $.noop;
    var deptPromise = Http.get('/departments/' + deptId);
    var branchesPromise = Http.get('/departments/' + deptId + '/branches');

    $.when(deptPromise, branchesPromise).done(function (deptResult, branchesResult) {

        var dept = formatDept(deptResult);
        var memberIds = branchesGetMemberId(branchesResult.data);
        getUsers(memberIds, function (errorCode, list) {
            if (errorCode) {
                return callback(errorCode);
            }

            dept.members = list;
            dept.depts = branchesGetDept(branchesResult.data);
            callback(null, dept);
        });

    }).fail(callback);
};

Organization.getDeptNames = function (path, callback) {
    var list = path.split(',').map(function (item) {
        var dept = Cache.orgTree[item] || {};
        return {
            id: item,
            deptName: dept.deptName
        };
    });
    callback(null, list);
};

Organization.search = function (keyword, callback) {
    Http.post('/staffs/search', {
        keywords: [keyword]
    }).done(function (result) {
        var ids = result.map(function (item) {
            return item.id;
        });

        getUsers(ids, callback);

    }).fail(callback);
};

Organization.getMembers = function (deptId, callback) {
    Http.get('/departments/' + deptId + '/staffs').done(function (result) {
        var memberIds = branchesGetMemberId(result.data);
        getUsers(memberIds, callback);
    }).fail(callback);
};

Group.create = function (params, callback) {
    callback = callback || $.noop;
    var data = {
        type: params.type,
        name: params.name,
        portrait_url: '',
        member_ids: params.member_ids
    };
    Http.post('/groups', data).done(function (result) {
        Group.getOne(result.id, function (errorCode, group) {
            if(errorCode) {
                return callback(errorCode);
            }
            var params = {
                conversationType: RongIMLib.ConversationType.GROUP,
                targetId: group.id
            };
            Conversation.add(params);
            callback(null, group);
        });
    }).fail(callback);
};

Group.addToFav = function (idList, callback) {
    var data = {
        ids: idList
    };
    Http.post('/favgroups', data, callback);
};

Group.removeFromFav = function (idList, callback) {
    var data = {
        ids: idList
    };
    Http.del('/favgroups', data, callback);
};

Group.rename = function (groupId, name, callback) {
    var data = {
        name: name
    };
    Http.put('/groups/' + groupId + '/name', data, callback);
};

Group.getMembers = function (groupId, callback) {
    callback = callback || $.noop;
    getGroups([groupId], function (errorCode, list) {
        if (errorCode) {
            callback(errorCode);
            return;
        }
        var memberIdList = list[0].memberIdList;
        getUsers(memberIdList, function (errorCode, members) {
            if (errorCode) {
                callback(errorCode);
                return;
            }
            callback(null, members);
        });
    });
};

Group.addMembers = function (groupId, memberIdList, callback) {
    var data = {
        ids: memberIdList
    };
    Http.post('/groups/' + groupId + '/invite', data, callback);
};

Group.removeMembers = function (groupId, memberIdList, callback) {
    var data = {
        ids: memberIdList
    };
    Http.post('/groups/' + groupId + '/remove', data, callback);
};

Group.watch = function (handle) {
    groupObserverList.add(handle);
};

Group.unwatch = function(handle){
    groupObserverList.remove(handle);
};

Group.quit = function (groupId, callback) {
    Http.post('/groups/' + groupId + '/quit').done(function (result) {
        callback(null, result);
    }).fail(callback);
};

Group.dismiss = function (groupId, callback) {
    Http.del('/groups/' + groupId).done(function (result) {
        callback(null, result);
    }).fail(callback);
};

Group.getOne =  function (groupId, callback) {
    callback = callback || $.noop;
    var error = null;
    var group = Cache.group[groupId];
    if (group) {
        callback(error, group);
        return;
    }
    getGroups([groupId], function (errorCode, list) {
        if(errorCode) {
            return callback(errorCode);
        }
        callback(error, list[0]);
    });
};

Group.getList = function (callback) {
    callback = callback || $.noop;
    /**
     * 实现过程
     * 1. 获取收藏群组列表
     * 2. 从`Cache.group`中获取群组信息
     * 3. 缓存中没有从服务器获取群组信息，群成员信息，更新缓存`Cache.group`
     * 4. 根据 memberId 获取群成员信息 getUsers([userId], callback)
     */
    Http.get('/favgroups', function (errorCode, result) {
        if(errorCode) {
            return callback(errorCode);
        }
        var idList = result.data.map(function (group) {
            return group.id;
        });
        getGroups(idList, callback);
    });
};

var File = {};

function getToken(callback, type) {
    RongIMClient.getInstance().getFileToken(type, {
        onSuccess: function(data) {
            callback(data.token);
        },
        onError: function() {
            utils.console.log('获取上传 token 失败');
        }
    });
}

function expendUploadMessage(uploadMessage, uploadFile, uploadCallback){
    uploadMessage.cancel = function(callback) {
        callback = callback || $.noop;
        uploadMessage.uploadStatus = RongIM.utils.uploadStatus.FAIL;
        uploadFile.cancel();
        callback();
    };
    uploadMessage.upload = function() {
        if (uploadMessage.uploadStatus === RongIM.utils.uploadStatus.READY || uploadMessage.uploadStatus === RongIM.utils.uploadStatus.FAIL){
            uploadMessage.uploadStatus = RongIM.utils.uploadStatus.UPLOADING;
            uploadFile.upload(uploadMessage.data, uploadCallback);
        }
    };
}

function getDataType(data) {
    var fileType = RongIMLib.FileType.FILE;
    var isBase64 = (typeof data === 'string');
    var isImage =  (/^image/i.test(data.type));
    var configSize = config.upload.file.imageSize / 1024 / 1024 * 1000 * 1000;
    var isNormalSize = (data.size < configSize);
    if(isImage && isNormalSize || isBase64){
        fileType = RongIMLib.FileType.IMAGE;
    }
    return fileType;
}

/*
params.targetId
params.conversationType
params.data 上传的数据
params.data.localPath 为了兼容复制的本地文件,File 的 path 属性只读
*/
File.createUploadMessage = function (params) {
    var message = {
        senderUserId: Cache.auth.id,
        targetId: params.targetId,
        conversationType: params.conversationType,
        messageDirection: RongIM.utils.messageDirection.SEND,
        uploadStatus: RongIM.utils.uploadStatus.READY,
        sentStatus: RongIM.utils.sentStatus.SENDING,
        sentTime: new Date().getTime(),
        messageType: '',

        progress: 0,
        dataType: getDataType(params.data),
        localPath: params.localPath,
        data: params.data
    };

    if (message.dataType === RongIMLib.FileType.IMAGE) {
        message.messageType = RongIMClient.MessageType.ImageMessage;
        message.content = {
            content: '',
            imageUri: '',
            messageName: message.messageType
        };
    } else {
        message.messageType = RongIMClient.MessageType.FileMessage;
        var type = RongIM.utils.getFilenameExtension(params.data.name);
        message.content = {
            name: params.data.name,
            size: params.data.size,
            type: type,
            fileUrl: '',
            localPath: params.data.path || params.data.localPath,
            messageName: message.messageType
        };
    }

    return message;
};

File.upload = function (uploadMessage, uploadConfig, callback) {
    callback = callback || $.noop;
    var uploadCallback = {
        onBeforeUpload: function(data) {
            if (uploadMessage.dataType === RongIMLib.FileType.IMAGE) {
                uploadMessage.content.content = data;
            }
            var key = getCacheKey(uploadMessage);
            var cacheList = Message._cache[key] = Message._cache[key] || [];
            Message.addSendUserInfo(uploadMessage, function (errorCode, msg) {
                if(errorCode){
                    return callback(errorCode);
                }
                cacheList.push(msg);
            });
        },
        onProgress : function (loaded, total) {
            var percent = Math.floor(loaded / total * 100);
            uploadMessage.progress = percent;
        },
        onCompleted : function (data) {
            // name 非空表示上传成功（取消上传为空）
            var undef;
            var condition = data.name;
            if(config.upload.type === 'RongCloud'){
                condition = data.rc_url;
            }
            if (condition !== undef) {
                uploadMessage.uploadStatus = RongIM.utils.uploadStatus.SUCCESS;
                callback(null, uploadMessage, data);
            }
        },
        onError: function (errorCode) {
            uploadMessage.uploadStatus = RongIM.utils.uploadStatus.FAIL;
            // 上传失败同发送失败显示效果
            uploadMessage.sentStatus = RongIM.utils.sentStatus.FAILED;
            callback(errorCode, uploadMessage);
        }
    };

    uploadConfig.getToken = function(callback) {
        getToken(callback, uploadMessage.dataType);
    };

    if (uploadMessage.dataType === RongIMLib.FileType.FILE) {
        uploadConfig.chunk_size = config.upload.file.fileSize;
        UploadClient.initFile(uploadConfig, function (uploadFile) {
            expendUploadMessage(uploadMessage, uploadFile, uploadCallback);
            uploadMessage.upload();
        });
    } else if (typeof uploadMessage.data === 'string') {
        uploadConfig.base64_size = config.upload.base64.size;
        UploadClient.initImgBase64(uploadConfig, function (uploadFile) {
            expendUploadMessage(uploadMessage, uploadFile, uploadCallback);
            uploadMessage.upload();
        });
    } else {
        UploadClient.initImage(uploadConfig, function (uploadFile) {
            expendUploadMessage(uploadMessage, uploadFile, uploadCallback);
            uploadMessage.upload();
        });
    }
};

File.addFileUrl = function (uploadMessage, data, callback) {
    // 获取下载路径
    if(config.upload.type === 'RongCloud'){
        var imageUrl = data.rc_url.path;
        if (data.rc_url.type === 0) {
            imageUrl = RongIM.config.upload.file.domain + data.rc_url.path;
        }
        //// var fileUrl = imageUrl + '?attname=' + uploadMessage.content.name;
        var fileUrl = imageUrl;
        dealFileUrl(imageUrl, fileUrl, uploadMessage, callback);
        return;
    }
    RongIMClient.getInstance().getFileUrl(uploadMessage.dataType, data.filename, data.name, {
        onSuccess: function(url) {
            var imageUrl = fileUrl = url.downloadUrl;
            dealFileUrl(imageUrl, fileUrl, uploadMessage, callback);
        },
        onError: function() {
            uploadMessage.uploadStatus = RongIM.utils.uploadStatus.FAIL;
            utils.console.log('获取URL失败');
        }
    });
};

function dealFileUrl(imageUrl, fileUrl, uploadMessage, callback) {
    uploadMessage.sentStatus = RongIM.utils.sentStatus.SENDING;
    var content = uploadMessage.content;
    if (uploadMessage.dataType === RongIMLib.FileType.IMAGE) {
        content.imageUri = imageUrl;
    } else {
        content.fileUrl = fileUrl;
    }
    callback(null, uploadMessage);
}

File.send = function (uploadMessage, callback) {
    callback = callback || $.noop;
    var conversationType = Number(uploadMessage.conversationType);
    var targetId = uploadMessage.targetId;
    var message;
    if (uploadMessage.dataType === RongIMLib.FileType.IMAGE) {
        message = new RongIMLib.ImageMessage(uploadMessage.content);
    } else {
        message = new RongIMLib.FileMessage(uploadMessage.content);
    }

    RongIMClient.getInstance().sendMessage(conversationType, targetId, message, {
        onBefore: function (messageId) {
            uploadMessage.messageId = messageId;
        },
        onSuccess: function(serverMessage) {
            uploadMessage.sentStatus = RongIM.utils.sentStatus.SENT;
            uploadMessage.messageUId = serverMessage.messageUId;
            var im = RongIM.instance;
            im.$emit('messagechange');
            callback(null, uploadMessage);
            if(serverMessage.content){
                serverMessage.content.localPath = uploadMessage.content.localPath;
            }
            RongIMClient.getInstance().setMessageContent(serverMessage.messageId, serverMessage.content, '');

        },
        onError: function(errorCode) {
            uploadMessage.sentStatus = RongIM.utils.sentStatus.FAILED;
            callback(errorCode, uploadMessage);
        }
    });
};

// Friend 文档地址  http://gitlab.rongcloud.net/RCE/RCE-Doc/blob/master/docs/design/subsystem/contact_service.md
// 根据号码搜索联系人
Friend.search = function (mobile, callback) {
    callback = callback || $.noop;
    var params = {
        'keywords': mobile
    };
    // $.getJSON('http://localhost:3000/friend-search')
    Http.post('/staffs/search/mobile', params)
        .then(function (result) {
            if(result && result[0]){
                result[0].avatar = result[0].portraitUrl;
            }
            callback(null, result);
        }).fail(callback);
};

// 邀请好友
Friend.invite = function (id, content, callback) {
    callback = callback || $.noop;
    var params = {
        'id': id,
        'content': content
    };
    Http.post('/friends/invite/', params)
        .then(function() {
            notifyFriendRequest();
            callback();
        }).fail(callback);
};

//接受请求
Friend.accept = function (request, callback) {
    callback = callback || $.noop;
    Cache.friendList = Cache.friendList || [];
    Http.post('/friends/accept/' + request.requestId)
        .then(function(result) {
            notifyFriend();
            notifyFriendRequest();
            callback(result);
        }).fail(callback);
};

// 获取好友信息
Friend.getFriend = function (friendId, callback) {
    callback = callback || $.noop;
    // mock
    Http.get('/friends/' + friendId)
    // $.getJSON('http://localhost:3000/friend-123')
      .then(function (friend) {
            friend.avatar = friend.portraitUrl;
            friend.mobile = friend.tel;
            callback(null, friend);
        }).fail(callback);
};

// 从缓存获取单个好友信息
Friend.getCacheFriend = function (userId) {
    var cacheList = Cache.friendList;
    if(!cacheList){
        return null;
    }
    for (var i = 0, len = cacheList.length; i < len; i++) {
        if (cacheList[i].id === userId) {
            return cacheList[i];
        }
    }
    return null;
};

//获取好友列表
Friend.getList = function (callback) {
    callback = callback || $.noop;
    // mock
    // $.getJSON('http://localhost:3000/friend-list')
    Http.get('/friends')
        .then(function (result) {
            result.data.forEach(function (item) {
                // TODO: 如果item是企业成员，字段要与Cache.user里的项一致
                item.avatar = item.portraitUrl;
                item.alias = Cache.alias[item.id];
                // if(item.user_type === common.UserType.STAFF){
                //     item.alias
                //     item.deptId
                //     item.path
                //     item.star
                // }
            });
            // 同步本地缓存信息
            Cache.friendList = result.data;
            return callback(null, result.data);
        }).fail(callback);
};

Friend.getCacheList = function () {
    var cacheList = Cache.friendList || [];
    return cacheList;
};

// 删除好友
Friend.delFriend = function (friendId, callback) {
    callback = callback || $.noop;
    Http.del('/friends/' + friendId).then(function (result) {
        var idList = Cache.friendList.map(function (item) {
            return item.id;
        });
        var index = idList.indexOf(friendId);
        if(index >= 0) {
            Cache.friendList.splice(index, 1);
        }
        var requestList = Cache.friendRequest;
        var request = requestList.filter(function(req){
            return req.uid === friendId;
        })[0];
        Friend.delRequest(request.requestId);
        notifyFriend();
        // notifyFriendRequest();
        callback(null, result);
    }).fail(callback);
};

// 删除所有好友
Friend.delAllFriend = function (callback) {
    callback = callback || $.noop;
    Http.del('/friends/all')
        .then(function () {
            callback();
            Cache.friendList = {};
            notifyFriend();
        }).fail(callback);
};

//获取请求列表
Friend.getRequestList = function (callback) {
    callback = callback || $.noop;
    // var cacheList = Cache.friendRequest;
    // if(!$.isEmptyObject(cacheList)){
    //     return callback(null, cacheList);
    // }
    // mock
    // $.getJSON('http://localhost:3000/friend-request-list')
    Http.get('/friends/request_list')
        .then(function(result) {
            var list = result.data;
            list = list.filter(function(item){
                item.user = {
                    id: item.uid,
                    name: item.name,
                    avatar: item.portraitUrl
                };
                return item.state > 0;
            });
            Cache.friendRequest = list;
            callback(null, list);
        }).fail(callback);
};

// 从缓存获取好友请求信息
Friend.getCacheRequest = function () {
    var cacheList = Cache.friendRequest || [];
    // for (var i = 0, len = cacheList.length; i < len; i++) {
    //     if (cacheList[i].id === userId) {
    //         return cacheList[i];
    //     }
    // }
    return cacheList;
};

// 删除请求记录
Friend.delRequest = function (requestId, callback) {
    callback = callback || $.noop;
    Http.del('/friends/request_list/' + requestId).then(function (result) {
        var idList = Cache.friendRequest.map(function (item) {
            return item.requestId;
        });
        var index = idList.indexOf(requestId);
        if(index >= 0) {
            Cache.friendRequest.splice(index, 1);
        }
        // requestObserverList.notify();
        callback(result);
    }).fail(callback);
};

// 删除所有请求记录
Friend.delAllRequest = function (callback) {
    callback = callback || $.noop;
    Http.del('/friends/request_list/all')
        .then(function (result) {
            callback(result);
            Cache.friendRequest = {};
            // requestObserverList.notify();
        }).fail(callback);
};

// 清除邀请记录未读数
Friend.clearUnread = function (callback) {
    callback = callback || $.noop;
    Http.put('/friends/clear_unread')
        .then(function () {
            notifyFriendRequest();
            callback();
        }).fail(callback);
};
// 获取用户申请记录
Friend.getRequest = function (id) {
    var requestInfo = null;
    var cacheList = Cache.friendRequest;
    for (var i = 0, len = cacheList.length; i < len; i++) {
        if (cacheList[i].uid === id) {
            requestInfo = cacheList[i];
            break;
        }
    }
    return requestInfo;
};

Friend.watch = function (listener) {
    friendObserverList.add(listener);
};

Friend.unwatch = function (listener) {
    friendObserverList.remove(listener);
};

// Friend.watchRequest = function (listener) {
//     requestObserverList.add(listener);
// };

// Friend.unwatchRequest = function (listener) {
//     requestObserverList.remove(listener);
// };

function notifyFriend() {
    Friend.getList(function (errorCode, list) {
        if(errorCode){
            return;
        }
        list = list || [];
        var result = {
            type: 'Friend',
            list: list
        };
        friendObserverList.notify(result);
        utils.console.log('刷新好友', list.length);
    });
}

function notifyFriendRequest() {
    Friend.getRequestList(function (errorCode, list) {
        if(errorCode){
            return;
        }
        list = list || [];
        var result = {
            type: 'Request',
            list: list
        };
        friendObserverList.notify(result);
    });
}

function addUserToList(list, key) {
    var def = $.Deferred();
    var count = 0;
    list.length === 0 && def.resolve();
    var ids = list.map(function(item) {
        return item[key];
    });
    User.get(ids, function(errorCode, userList) {
        userList = [].concat(userList);
        userList.forEach(function(user) {
            count++;
            list.forEach(function(data) {
                if  (user.id === data[key]) {
                    data.user = user;
                }
            });
            count === userList.length && def.resolve();
        });
    });
    return def;
}

Pin.create = function(params, callback) {
    Http.post('/pins', params)
        .then(function(result) {
            callback(null, result);
        }).fail(callback);
};

Pin.getInbox = function(callback) {
    Http.get('/pins/inbox')
        .then(function(result) {
            $.when(addUserToList(result.data, 'creatorUid'))
                .done(function() {
                    callback(null, result);
                });
        }).fail(callback);
};

Pin.getOutbox = function(callback) {
    Http.get('/pins/outbox')
        .then(function(result) {
            $.when(addUserToList(result.data, 'creatorUid'))
                .done(function() {
                    callback(null, result);
                });
        }).fail(callback);
};

Pin.getInboxUnRead = function(callback) {
    var url = '/pins/inbox/unread';
    Http.get(url)
        .then(function(result) {
            $.when(addUserToList(result, 'creatorUid'))
                .done(function() {
                    callback(null, result);
                });
        }).fail(callback);
};

Pin.getOutboxUnRead = function(callback) {
    var url = '/pins/outbox/unread';
    Http.get(url)
        .then(function(result) {
            $.when(addUserToList(result, 'creatorUid'))
                .done(function() {
                    callback(null, result);
                });
        }).fail(callback);
};

Pin.getPinDetail = function(id, callback) {
    var url = '/pins/' + id;
    Http.get(url)
        .then(function(result) {
            callback(null, result);
        }).fail(callback);
};
Pin.getReceiverList = function(uid, callback) {
    var url = '/pins/' + uid + '/receivers';
    Http.get(url)
        .then(function(result) {
            $.when(addUserToList(result, 'receiverUid'))
                .done(function() {
                    callback(null, result);
                });
        }).fail(callback);
};
Pin.getCommentList = function(uid, callback) {
    var url = '/pins/' + uid + '/comments';
    Http.get(url)
        .then(function(result) {
            $.when(addUserToList(result, 'publisherUid'))
                .done(function() {
                    callback(null, result);
                });
        }).fail(callback);
};

Pin.deletePin = function(uid, callback) {
    var url = '/pins/' + uid;
    Http.del(url)
        .then(function(result) {
            callback(null, result);
        }).fail(callback);
};

Pin.comment = function(uid, comment, parentCommentUid, callback) {
    var params = { comment: comment };
    if (parentCommentUid) {
        params['parent_comment_uid'] = parentCommentUid;
    }
    var url = '/pins/' + uid + '/comments';
    Http.post(url, params)
        .then(function(result) {
            callback(null, result);
        }).fail(callback);
};

Pin.confirm = function(uid, callback) {
    var url = '/pins/' + uid + '/confirm';
    Http.post(url)
        .then(function(result) {
            callback(null, result);
        }).fail(callback);
};

Pin.getUnReadCount = function(callback) {
    var url = '/pins/unreadcommentcount';
    Http.get(url)
        .then(function(result) {
            callback(null, result);
        }).fail(callback);
};

Pin.getUnConfirmCount = function(callback) {
    var url = '/pins/unconfirmedcount';
    Http.get(url)
        .then(function(result) {
            callback(null, result);
        }).fail(callback);
};

Pin.getAttachments = function(uid, callback) {
    var url = '/pins/' + uid + '/attachments';
    Http.get(url)
        .then(function(result) {
            callback(null, result);
        }).fail(callback);
};

Pin.addReceivers = function(uid, ids, callback) {
    var url = '/pins/' + uid + '/receivers';
    var params = {
        ids: ids
    };
    Http.post(url, params)
        .then(function(result) {
            callback(null, result);
        });
};

Pin.notifyUnReadCount = function(pinUid) {
    pinUid = pinUid || '';
    var message = {
        messageType: Pin.MessageType.PinUnReadCountMessage,
        content: {
            pinUid: pinUid
        }
    };
    pinObserverList.notify(message);
};

Pin.addRemovePins = function(pinIds) {
    if (typeof pinIds === 'string') {
        pinIds = [ pinIds ];
    }
    var key = 'remove-pins';
    var loginUser = RongIM.instance.loginUser || {};
    var local = store.get(key) || {};
    var removePinList = local[loginUser.id] || [];
    local[loginUser.id] = removePinList.concat(pinIds);
    store.set(key, local);
};

Pin.getRemovePins = function() {
    var key = 'remove-pins';
    var loginUser = RongIM.instance.loginUser || {};
    var local = store.get(key) || {};
    return local[loginUser.id];
};

Pin.watch = function(listener) {
    pinObserverList.add(listener);
};

Pin.unwatch = function(listener) {
    pinObserverList.remove(listener);
};

Pin.MessageType = {
    PinNotifyMessage: 'PinNotifyMessage',
    PinCommentMessage: 'PinCommentMessage',
    PinConfirmMessage: 'PinConfirmMessage',
    PinNewReciverMessage: 'PinNewReciverMessage',
    PinUnReadCountMessage: 'PinUnReadCountMessage'
};

function notifyPin(message) {
    Pin.observerList.notify(message);
}

function getGroups(idList, callback) {
    callback = callback || $.noop;
    if(idList.length <= 0) {
        return callback(null, []);
    }

    var newIdList = filterCache(Cache.group, idList);
    if(newIdList <= 0) {
        var groups = idList.map(function (id) {
            return Cache.group[id];
        });
        return callback(null, groups);
    }
    var promiseList = newIdList.map(function (id) {
        return getOneGroup(id);
    });
    return $.when.apply(null, promiseList).then(function () {
        var groups = idList.map(function (id) {
            return Cache.group[id];
        });
        callback(null, groups);
        return groups;
    });
}
// 不提供回调，获取后直接在缓存中获取
function getBatchGroups(idList){
    var groupDefer = $.Deferred();

    var ids = [];
    var promiseList = [];

    idList.forEach(function(id){
        // var group = Cache.group[id];
        var defer = Cache.group._defer[id];
        if (defer) {
           promiseList.push(defer.promise());
        }else{
            defer = $.Deferred();
            var promise = defer.promise();
            promiseList.push(promise);
            ids.push(id);
            Cache.group._defer[id] = defer;
        }
    });

    if (ids.length > 0) {
        var url = '/groups/batch';
        var data = {
            ids: ids
        };
        Http.post(url, data).done(function(groups){
            var userIds = [];
            groups.forEach(function(group){
                var members = group.members;
                userIds = userIds.concat(members);
                group.avatar = group.portraitUrl;
            });
            userIds = userIds.map(function(user){
                return user.id;
            });
            var bindMembers = function(group){
                var members = group.members;
                members = members.map(function(member){
                    var id = member.id;
                    var alias = member.alias;
                    var createDt = member.createDt;
                    var cacheMember = Cache.user[id];
                    cacheMember.alias = alias;
                    cacheMember.createDt = createDt;
                   return cacheMember || {};
                });

                var memberIdList = [], memberBrief = [], memberNames = [], memberAvatars = [];

                members.forEach(function(member){
                    memberIdList.push(member.id);
                    memberBrief.push({
                        id: member.id,
                        createDt: member.createDt,
                        updateDt: member.updateDt
                    });
                    memberNames.push(member.alias || member.name);
                    memberAvatars.push(member.avatar);
                });

                group.memberIdList = memberIdList;
                group.memberBrief = memberBrief;
                group.memberNames = memberNames;
                group.memberAvatars = memberAvatars;
                var id = group.id;
                Cache.group[id] = group;
                var defer = Cache.group._defer[id];
                defer.resolve();
            };
            getUsers(userIds).then(function(){
                groups.forEach(bindMembers);
                groupDefer.resolve();
            }).fail(function(errorCode){
                var noLoginCodeList = [10102, 10108];
                var noLogin = noLoginCodeList.indexOf(errorCode);
                if (noLogin) {
                    groupDefer.reject(errorCode);
                }
            });
        }).fail(groupDefer.reject);
    }

    $.when.apply(null, promiseList).then(function () {
        groupDefer.resolve();
    }).fail(function(errorCode){
        groupDefer.reject(errorCode);
    });
    return groupDefer.promise();
}

function getOneGroup(id) {
    if(Cache.group._defer[id]) {
        return Cache.group._defer[id].promise();
    }

    var defer = $.Deferred();
    Cache.group._defer[id] = defer;
    var url = '/groups/' + id;
    Http.get(url).then(function (group) {
        group.avatar = group.portraitUrl;
        group.adminId = group.managerId;
        Http.get(url + '/members').then(function (result) {
            var members = result.data;
            group.memberIdList = members.map(function (member) {
                return member.id;
            });
            group.memberBrief = members.map(function (member) {
                return {
                    id: member.id,
                    createDt: member.createDt,
                    updateDt: member.updateDt
                };
            });
            group.memberNames = members.map(function (userItem) {
                return userItem.alias || userItem.name;
            });
            group.memberAvatars = members.map(function (userItem) {
                return userItem.portraitUrl;
            });
            Cache.group[id] = group;
            defer.resolve(group);
        });
    }).fail(function () {
        utils.console.warn('getGroup', id);
        var group = {
            id: id,
            memberCount: 0,
            memberAvatars: [],
            memberNames: [],
            memberIdList: []
        };
        Cache.group[id] = group;
        defer.resolve(group);
    }).always(function () {
        delete Cache.group._defer[id];
    });
    return defer.promise();
}

function getErrorCode(code) {
    var SUCCESS_CODE = 10000;
    return (code === SUCCESS_CODE) ? null : code;
}

// 返回不在缓存里的keys
function filterCache(cache, keys) {
    var list = [];
    keys.forEach(function (key) {
        !cache[key] && list.push(key);
    });
    return list;
}

function toJSON(data) {
    return JSON.parse(JSON.stringify(data));
}

function snakeToCamel(string) {
    var firstLetter = string[0] || '';
    return firstLetter + string.slice(1).replace(/_\w/g, function(match) {
        return match[1].toUpperCase();
    });
}

function getLibErrorCode(errorCode) {
    var prefix = 'lib-';
    if(errorCode){
        var existed = String(errorCode).indexOf(prefix) >= 0;
        if(!existed) {
            errorCode = prefix + errorCode;
        }
    }
    return errorCode;
}

RongIM.dataModel = {
    init: init,
    updateAuth: updateAuth,
    destroyed: destroyed,
    _Cache: Cache,
    _Http: Http,
    Status: Status,
    QRCode: qrcode,
    User: User,
    Star: Star,
    Message: Message,
    File: File,
    Conversation: Conversation,
    Organization: Organization,
    Group: Group,
    Friend: Friend,
    Pin: Pin
};

})(RongIM, {
    win: window,
    jQuery: jQuery,
    RongIMClient: RongIMClient,
    UploadClient: UploadClient,
    QRCode: QRCode,
    RongIMLib: RongIMLib
});
