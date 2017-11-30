'use strict';
(function (RongIM, dependencies, components) {

var Vue = dependencies.Vue;
var VueRouter = dependencies.VueRouter;
var $ = dependencies.jQuery;
var routes = RongIM.routes;
var common = RongIM.common;
var utils = RongIM.utils;
var cache = utils.cache;
var dialog = RongIM.dialog;
var win = dependencies.win;
var createFav = RongIM.createFav;
var CallType = common.CallType;
var MessageCtrl = dependencies.MessageCtrl;

function init(config) {
    if(!config.appkey || !config.dataModel.server) {
        return common.handleError('invalid-config');
    }

    if(!config.debug) {
        Vue.config.silent = true;
        Vue.config.productionTip = false;
        Vue.config.errorHandler = $.noop;
    }

    var dataModel = RongIM.dataModel;
    var pcWin = RongIM.pcWin;
    var addon = RongIM.addon;
    var im = new Vue({
        el: config.el,
        router: getRouter(dataModel),
        data: {
            isMaxWindow: false,
            config: config,
            auth: null,
            status: utils.status.CONNECTING,
            unReadCount: 0,
            hidden: false,
            voip: {
                loading: false,
                messageCache: [],
                busy: false,
                sharing: false,
                type: 0
            },
            loginUser: null,
            requestUnReadCount: 0,
            pinUnReadCount: {
                unComment: 0,
                unConfirm: 0
            }
        },
        computed: {
            locale: function () {
                RongIM.locale[this.config.locale].product = this.config.product;
                return RongIM.locale[this.config.locale];
            },
            os: function () {
                return addon.getPlatform();
            },
            showWelcomePage: function () {
                var list = ['/conversation', '/contact', '/pin'];
                return list.indexOf(this.$route.path) >= 0;
            },
            pinNavCount: function() {
                var unConfirm = this.pinUnReadCount.unConfirm;
                return unConfirm ? unConfirm : '';
            }
        },
        watch: {
            auth: function (newValue, oldValue) {
                var api = {
                    user: dataModel.User,
                    status: dataModel.Status
                };
                var same = $.isEmptyObject(newValue) && $.isEmptyObject(oldValue);
                !same && authChanged(this, api, newValue);
            },
            unReadCount: function() {
                updateFav();
            },
            pinUnReadCount: function() {
                updateFav();
            },
            $route: function (route) {
                if(config.support.screenshot) {
                    toggleScreenShortcut(route);
                }
            }
        },
        created: function() {
            var  api = {
                conversation: dataModel.Conversation,
                message: RongIM.dataModel.Message,
                user: RongIM.dataModel.User
            };
            created(this, addon, api);
        },
        components: {
            'online-status': components.getOnlineStatus,
            avatar: components.getAvatar
        },
        methods: {
            routePathStartWith: function (path) {
                var currentPath = this.$route.path;
                return currentPath.indexOf(path) === 0;
            },
            showSetting: dialog.setting,
            userProfile: function () {
                dialog.user(im.auth.id);
            },
            updateTotalUnreadCount: function (list) {
                updateTotalUnreadCount(dataModel.Conversation, im, list);
            },
            min: function () {
                pcWin.min();
            },
            max: function () {
                pcWin.max();
                this.isMaxWindow = true;
            },
            restore: function () {
                pcWin.restore();
                this.isMaxWindow = false;
            },
            close: function () {
                pcWin.close();
            },
            login: function (params) {
                var api = {
                    user: dataModel.User,
                    status: dataModel.Status
                };
                return login(this, api, params);
            },
            logout: function () {
                logout(this, dataModel.Status, dataModel.User);
            },
            mousedown: function (event) {
                if (event.which === 3) {
                    event.preventDefault();
                    this.$emit('imrightclick', event);
                }
            }
        },
        destroyed: function () {
            cleanup(dataModel.Status, dataModel.Message, dataModel.Friend);
            unRegListeners(this, pcWin);
        }
    });
    dataModel.init(config);
    dataModel.destroyed(function (errorCode) {
        common.handleError(errorCode);
        im.logout();
    });
    im.dataModel = dataModel;
    watchConnectionStatus(dataModel.Status, im);
    watchMessage(dataModel.Message, dataModel.Conversation, im);
    watchConversation(dataModel.Conversation, im);
    watchLoginUser(dataModel.User, im);
    watchFriendRequest(dataModel.Friend, im);
    // getRequestList(dataModel.Friend, im);
    turnOffCapsLockWarning();
    watchPinUnreadCount(dataModel.Pin, im);
    im.auth = cache.get('auth');
    im.addon = addon;

    RongIM.instance = im;
}

function getRequestList(friendApi, im) {
    friendApi.getRequestList(function(errorCode, list){
        if($.isEmptyObject(list)){
            return;
        }
        im.requestUnReadCount = getRequestUnreadCount(list);
    });
}

function updateFav(fav) {
    var im = RongIM.instance;
    var value = fav ? fav : im.unReadCount + im.pinUnReadCount.unConfirm;
    var $fav = $('#rong-favicon');
    var href = value > 0 ? createFav(value) : $fav.attr('_src');
    $fav.attr('href', href);
}

function getRouter(dataModel) {
    var loginRedirect = {
        path: '',
        clear: function() {
            this.path = '';
        }
    };

    var router = new VueRouter({
        linkActiveClass: routes.linkActiveClass,
        routes: routes.maps
    });

    router.beforeEach(function (to, from, next) {
        var im = router.app;
        var publicAccess = to.matched.some(function (record) {
            return record.meta.pulicAccess;
        });
        Vue.nextTick(function () {
            if(publicAccess || im.auth) {
                var path = loginRedirect.path;
                if (to.name === 'conversation' && path) {
                    loginRedirect.clear();
                    next(path);
                } else if(to.name === 'login') {
                    im.auth = null;
                    next();
                } else {
                    next(recordPrimarypath(to, from));
                }
                return;
            }

            var params = cache.get('login-params');
            if(utils.isEmpty(params)) {
                return next({name: 'login'});
            }

            // 自动登录
            dataModel.User.login(params, function (errorCode, result) {
                if(errorCode) {
                    loginRedirect.path = to.fullPath;
                    return next({name: 'login'});
                }
                var user = result.staff;
                var auth = {
                    id: result.staff.id,
                    token: result.token,
                    companyId: user.companyId,
                    deptId: user.deptId,
                    isStaff: user.userType === common.UserType.STAFF
                };
                im.auth = auth;
                cache.set('local-auth', auth);
                next();
            });
        });
    });

    return router;
}

// 进入一级路径跳转到对应记录路径
var cachePrimarypath = {};
// undefined
var undef;
function recordPrimarypath(to, from) {
    var toPath = to.path.split('/');
    var fromPath = from.path.split('/');
    if (fromPath.length > 2) {
        cachePrimarypath[fromPath[1]] = from.path;
    } else {
        cachePrimarypath[fromPath[1]] = undef;
    }
    var query = to.query;
    var useCache = (!query.force && toPath.length === 2);
    if (useCache) {
        return cachePrimarypath[toPath[1]];
    }
}

// 新版里只向sessionStorage里保存auth，
// 旧版本里向localStorage里保存auth，会影响到新版本里的cache.get('auth')取值，
// 需要清理下
function fixCache(keyNS) {
    localStorage.removeItem(keyNS + 'auth');
}

function created(context, addon, api) {
    var messageApi = api.message;
    var userApi = api.user;
    var conversationApi = api.conversation;
    cache.onchange(function (key, value) {
        if(key !== 'local-auth') {
            return;
        }
        context.auth = value;
        var isTemp = true;
        cache.set('auth', value, isTemp);
        context.dataModel.updateAuth(value);
        if(value) {
            context.$router.push({name: 'conversation'});
        }
    });

    addon.regLogout(function(){
        context.logout();
    });

    addon.regAccount(function(){
        context.showSetting();
    });

    if(context.config.support.balloonClick) {
        addon.regBalloon(function(event, opt){
            var path = {
                name: 'conversation',
                params: {
                    targetId: opt.data.targetId,
                    conversationType: opt.data.targetType
                }
            };
            context.$router.push(path);
        });
    }

    $(win).on('focus', function () {
        context.hidden = false;
        var targetId = context.$route.params.targetId;
        var conversationType = context.$route.params.conversationType;
        if (!utils.isEmpty(targetId)) {
            conversationApi.clearUnReadCount(conversationType, targetId);
        }
    });
    $(win).on('blur', function () {
        context.hidden = true;
    });
    if(context.config.support.voip) {
        initVoip(context, messageApi, userApi);
    }
}

var voipCommandHandler = {
    addMember: function(params) {
        var req = {
            type: 'commandCallback',
            data: {
                command: params.command
            }
        };
        RongIM.pcWin.focus();
        if (voipCommandHandler.busy) {
            return ;
        }
        voipCommandHandler.busy = true;
        dialog.voipInviteMember(params.targetId, params.memberIdList).done(function (list) {
            req.data.error = null;
            req.data.result = list;
            RongIM.voip.IMRequest(req);
        }).fail(function () {
            req.data.error = 'no choose';
            RongIM.voip.IMRequest(req);
        }).always(function () {
            voipCommandHandler.busy = false;
        });
    },
    summary: function (params, messageApi) {
        var message = params.message;
        insertSummaryMessage(message, messageApi);
    },
    other: function (params) {
        MessageCtrl.sendCommand(params, function (error, result) {
            var req = {
                type: 'commandCallback',
                data: {
                    command: params.command,
                    error: error,
                    result: result
                }
            };
            RongIM.voip.IMRequest(req);
        });
    }
};

var voipMessageHandler = {
    InviteMessage: function(req, context, userApi) {
        var message = req.data;
        if (message.messageDirection === utils.messageDirection.SEND) {
            // 多端同步自己发的邀请不做处理
            return;
        }
        if (context.voip.busy) {
            RongIM.voip.IMRequest(req);
            return;
        }
        var senderUserId = message.senderUserId;
        var ids = message.content.inviteUserIds.concat(senderUserId);
        userApi.get(ids, function (errorCode, list) {
            var senderUser = list.pop();
            message.senderUser = senderUser;
            message.inviteUserList = list;
            message.self = context.loginUser;
            var inviteIds = list.map(function(invite) {
                return invite.id;
            });
            var hasSelf = inviteIds.indexOf(context.loginUser.id) !== -1;
            if (!hasSelf) {
                return;
            }

            context.voip.loading = true;
            RongIM.voip.openWin(function () {
                openCallback(req, context);
            });
        });
    },
    MemberModifyMessage: function (req, context, userApi) {
        var message = req.data;
        if (message.messageDirection === utils.messageDirection.SEND) {
            // 多端同步自己发的成员添加不做处理
            return;
        }
        var inviteIdList = message.content.inviteUserIds;
        // fix: 移动端与 PC 端属性名称不一致
        if (message.content.existedUserPofiles) {
            message.content.existedMemberStatusList = message.content.existedUserPofiles;
        }
        var existedIdList = message.content.existedMemberStatusList.filter(function (item) {
            return item.callStatus !== common.RCCallStatus.RCCallHangup;
        }).map(function (item) {
            return item.userId;
        });
        req.data.self = context.loginUser;
        userApi.get(inviteIdList.concat(existedIdList), function (errorCode, list) {
            if (errorCode) {
                return ;
            }
            req.data.inviteUserList = list.splice(0, inviteIdList.length);
            req.data.existedUserList = list;

            var beInvited  = inviteIdList.indexOf(context.loginUser.id) !== -1;
            if (beInvited  && !context.voip.busy) {
                context.voip.loading = true;
                RongIM.voip.openWin(function () {
                    openCallback(req, context);
                });
            } else {
                RongIM.voip.IMRequest(req);
            }
        });
    },
    other: function (req) {
        RongIM.voip.IMRequest(req);
    }
};

function openCallback(req, context) {
    RongIM.voip.IMRequest(req);

    context.voip.loading = false;
    context.voip.busy = true;
    context.voip.sharing = req.data.content.sharing;
    context.voip.type = req.data.content.mediaType;
    context.voip.messageCache.forEach(function (item) {
        RongIM.voip.IMRequest(item);
    });
    context.voip.messageCache = [];
}

function initVoip(context, messageApi, userApi) {
    RongIM.voip.regVoipRequest(function (event, params) {
        var handle = voipCommandHandler[params.command] || voipCommandHandler.other;
        handle(params, messageApi);
    });

    MessageCtrl.watch(function (message) {
        utils.console.log('voip msg', message);
        var req = {
            type: 'message',
            data: message
        };
        if (context.voip.loading) {
            context.voip.messageCache.push(req);
            return ;
        }
        var handle = voipMessageHandler[message.messageType] || voipMessageHandler.other;
        handle(req, context, userApi);
    });

    RongIM.voip.regClose(function () {
        context.voip.busy = false;
    });
}

function insertSummaryMessage(message, messageApi) {
    var im = RongIM.instance;
    var params = {
        conversationType: message.conversationType,
        targetId: message.targetId,
        senderUserId: message.senderUserId,
        sentStatus: utils.sentStatus.READ,
        receivedStatus: utils.receivedStatus.READ,
        direction: message.messageDirection
    };
    var summaryCode = message.content.status;
    // 1 取消 15 对方未接听
    var receiverUnread = [1, 15].indexOf(summaryCode) !== -1;
    if (receiverUnread) {
        params.sentStatus = utils.sentStatus.SENT;
    }
    // 5 未接听 11 对方已取消
    var selfUnread = [5, 11].indexOf(summaryCode) !== -1;
    if (selfUnread) {
        params.receivedStatus = utils.receivedStatus.UNREAD;
    }
    var isPrivate = message.conversationType === utils.conversationType.PRIVATE;
    var isVideo = message.content.mediaType === CallType.MEDIA_VEDIO;
    var shareScreen = RongIM.instance.voip.sharing;
    var messageContent;
    if (isPrivate) {
        if (shareScreen) {
            params.messageType = 'ShareScreenMessage';
        } else if (isVideo) {
            params.messageType = 'VideoMessage';
        } else {
            params.messageType = 'AudioMessage';
        }
        var duration = message.content.duration;
        messageContent = {
            code: summaryCode,
            duration: duration
        };
    } else {
        params.messageType = 'InformationNotificationMessage';
        var str = '';
        if (shareScreen) {
            str = im.locale.voip.shareScreen;
        } else if (isVideo) {
            str = im.locale.voip.video;
        } else {
            str = im.locale.voip.audio;
        }
        // 已接通
        var active = [3, 13].indexOf(summaryCode) !== -1;
        if (active) {
            str += im.locale.voip.end;
        } else {
            str += im.locale.voip.summaryCodeMap[summaryCode];
        }
        messageContent = {message: str};
    }
    var summaryMsg = messageApi.create({messageType: params.messageType, content: messageContent});
    params.content = summaryMsg;
    messageApi.insertMessage(params);
}

function unRegListeners(context, addon){
    addon.unregLogout();
    addon.unregAccount();
    if(context.config.support.balloonClick) {
        addon.unregBalloon();
    }
}

function authChanged(im, api, auth) {
    if(auth) {
        connect(api, auth.token, function (errorCode) {
            if(errorCode) {
                common.handleError(errorCode);
                im.auth = null;
                return;
            }
            if(auth.isStaff){
                api.user.getDetail(auth.id, function (errorCode, user) {
                    if(errorCode) {
                        return common.handleError(errorCode);
                    }
                    im.loginUser = user;
                });
            } else {
                api.user.get(auth.id, function (errorCode, user) {
                    if(errorCode) {
                        return common.handleError(errorCode);
                    }
                    user.mobile = cache.get('phone');
                    im.loginUser = user;
                });
            }
            updateFav();
            im.dataModel.Pin.notifyUnReadCount();
            if(im.$route.name === 'login') {
                im.$router.push({name: 'conversation'});
            }
        });
    } else {
        var $fav = $('#rong-favicon');
        updateFav($fav.data('default-value'));

        if(im.status === utils.status.CONNECTED) {
            api.status.disconnect();
        }
        api.user.logout();
        clearCache();
        try {
            im.addon.logout();
        } catch(e) {
            throw new Error('im.addon.logout error!', e);
        }

        if(im.$route.name !== 'login') {
            im.$router.push({name: 'login'});
        }
    }
}

function toggleScreenShortcut(route) {
    var addon = RongIM.addon;
    var params = route.params;
    var enable;
    if(route.name === 'conversation' && params.conversationType && params.targetId) {
        enable = true;
    } else {
        enable = false;
    }
    addon.toggleScreenShortcut(enable);
}

function login(context, api, params) {
    var im = context;
    var defer = $.Deferred();
    var loginParams = {
        phone: params.phone,
        region: params.region,
        agent: {
            platform: utils.getPlatform(),
            device_id: utils.getDeviceId()
        },
        status: getStatus()
    };

    var requriedPassword = utils.isEmpty(cache.get('login-params'));
    if(requriedPassword) {
        loginParams.password = params.password;
    }

    api.user.login(loginParams, function (errorCode, result) {
        if(errorCode) {
            im.auth = null;
            defer.reject(errorCode);
        } else {
            var user = result.staff;
            var auth = {
                id: result.staff.id,
                token: result.token,
                companyId: user.companyId,
                deptId: user.deptId,
                isStaff: user.userType === 0
            };

            getRequestList(im.dataModel.Friend, im);

            connect(api, auth.token, function (errorCode, token) {
                if(errorCode) {
                    return defer.reject(errorCode);
                }

                auth.token = token;
                var isTemp = true;
                cache.set('auth', auth, isTemp);
                cache.set('local-auth', auth);
                if(params.isRememberMe) {
                    var backup = $.extend(true, {}, loginParams);
                    delete backup.password;
                    cache.set('login-params', backup);
                }
                im.auth = auth;
                im.$router.push({name: 'conversation'});
                defer.resolve(auth);
            });
        }
        im.busy = false;
    });
    return defer.promise();
}

function getStatus() {
    return cache.get('online-status') || 'online';
}

function connect(api, token, callback) {
    callback = callback || $.noop;
    callback.done = false;
    var im = RongIM.instance;
    var status = im.status;
    var connected = status === utils.status.CONNECTED;
    if(connected) {
        return callback(null, token);
    }

    api.status.connect(token, function (errorCode) {
        if(callback.done) {
            return;
        }
        callback.done = true;
        if(errorCode) {
            if(connect.retry === 'done') {
                return callback(errorCode);
            }

            api.user.refreshToken(function (errorCode, result) {
                if(errorCode) {
                    return callback(errorCode);
                }
                connect.retry = 'done';
                connect(api, result.token, callback);
            });
        } else {
            callback(null, token);
        }
    });
}

function logout(context) {
    var im = context;
    im.auth = null;
    im.loginUser = null;
    cachePrimarypath = {};
    if(im.$route.name !== 'login') {
        im.$router.push({name: 'login'});
    }
}

function clearCache() {
    cache.remove('auth');
    cache.remove('local-auth');
    cache.remove('online-status');
    cache.remove('sysMessage');
}

function promptKickedOfflineByOtherClient(im) {
    im.loginUser && common.messagebox({
        message: im.locale.errorCode['kicked-offline-by-otherclient'],
        callback: im.logout()
    });
}

function watchConnectionStatus(statusApi, im) {
    var timer;
    statusApi.watch(function (status) {
        utils.console.log(utils.status[status]);
        if(status === utils.status['KICKED_OFFLINE_BY_OTHER_CLIENT']) {
            return promptKickedOfflineByOtherClient(im);
        }

        im.status = status;
        timer && clearInterval(timer);
        var connected = status === utils.status.CONNECTED;
        var connecting = status === utils.status.CONNECTING;

        // c++ SDK 有自动重连机制 不需要处理重连
        if(utils.isEmpty(im.auth) || connected || connecting || im.config.support.autoReconnect) {
            return;
        }

        timer = setInterval(function () {
            if(utils.isEmpty(im.auth)) {
                return clearInterval(timer);
            }
            networkAvailable(statusApi.reconnect);
        }, 3000);
    });
}

function networkAvailable(callback) {
    var params = {
        version: (new Date).getTime()
    };
    $.get('/favicon.ico', params).then(function () {
        callback();
    }).fail(function (xhr, textStatus, error) {
        // 能收到HTTP响应说明网络是通的
        error && callback();
    });
}

function watchMessage(messageApi, conversationApi, im) {
    messageApi.watch(function (message) {
        var auth = im.auth;
        if(utils.isEmpty(auth)) {
            return;
        }
        var isNewMessage = message.sentStatus === utils.sentStatus.SENT
            || message.sentStatus === utils.sentStatus.RECEIVED
            || message.receivedStatus === 0;
        var isSelf = (message.user || {}).id === auth.id;
        var notOfflineMessage = !message.offLineMessage;
        // 系统消息通知提示音
        var key = 'sysMessage';
        var ring = cache.get(key);
        if (isNewMessage && !isSelf && notOfflineMessage) {
            var params = {
                conversationType: message.conversationType,
                targetId: message.targetId
            };
            conversationApi.getExpandInfo(params, function (errorCode, info) {
                info = info || {};
                var notify = !info.notDisturb;
                if (ring && notify) {
                    common.playSound();
                }
                var isDarwin = (RongIM.addon.getPlatform() === 'darwin');
                if (!isDarwin && notify) {
                    RongIM.pcWin.flashDock();
                }
            });
        }
    });
}

function watchConversation(conversationApi, im) {
    conversationApi.watch(function (list) {
        im.unReadCount = getUnreadCount(list);
        updateUnreadCount();
    });
}

function watchLoginUser(userApi, im){
    userApi.watch(function (user) {
        if (im.loginUser && user.id === im.loginUser.id) {
            im.loginUser = user;
        }
    });
}

function getUnreadCount(list) {
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
    return total;
}

function updateTotalUnreadCount(conversationApi, im, list) {
    conversationApi.getTotalUnreadCount(list, function(errorCode, total){
        im.unReadCount = total;
        updateUnreadCount();
    });
}

function updateUnreadCount() {
    var im = RongIM.instance;
    im.addon.updateBadgeNumber(im.unReadCount + im.pinUnReadCount.unConfirm);
}

function getRequestUnreadCount(list) {
    var total = 0;
    list.forEach(function (item) {
        if (item.read_state === 0 && item.state === common.FriendState.INVITEE) {
            total += 1;
        }
    });
    return total;
}

function watchFriendRequest(friendApi, im){
    friendApi.watch(function (result) {
        // utils.console.log('watchRequest', list);
        if(result.type === 'Friend'){
            return;
        }
        im.requestUnReadCount = getRequestUnreadCount(result.list);
    });
}

function getPinUnreadCount(pinApi, im) {
    pinApi.getUnReadCount(function(errorCode, unread) {
        if (!errorCode) {
            im.pinUnReadCount.unComment = unread.cnt;
            pinApi.getUnConfirmCount(function(errorCode, unconfirm) {
                im.pinUnReadCount.unConfirm = unconfirm.cnt;
                updateUnreadCount();
                updateFav();
            });
        }
    });
}

function watchPinUnreadCount(pinApi, im) {
    getPinUnreadCount(pinApi, im);
    pinApi.watch(function(message) {
        var isPin = pinApi.MessageType.PinCommentMessage === message.messageType;
        var isMe = message.content.publisherUid === im.auth.id;
        var isSelfComment = isPin && isMe;
        !isSelfComment && getPinUnreadCount(pinApi, im);
    });
}

function turnOffCapsLockWarning() {
    if(document.msCapsLockWarningOff === false) {
        document.msCapsLockWarningOff = true;
    }
}

function cleanup(statusApi, messageApi, friendApi) {
    statusApi.unwatch();
    messageApi.unwatch();
    friendApi.unwatch();
}

RongIM.init = function (config) {
    cache.setKeyNS(config.appkey);
    fixCache(config.appkey);

    var userSetting = cache.get('locale');
    var locale = userSetting || config.locale;
    if(!locale){
        //zh-CN --> zh;
        var systemLocale = RongIM.system.getLocale().split('-')[0];
            systemLocale = systemLocale.toLowerCase();
        locale = systemLocale || config.supportLocales[0].value;

        var supportList = config.supportLocales.map(function (item) {
            return item.value;
        });
        var notSupport = supportList.indexOf(locale) === -1;
        if (notSupport) {
            utils.console.log('不支持语言：', locale);
            locale = 'zh';
        }
    }

    config.locale = locale;
    document.title = config.product.name[locale];
    utils.loadLocale([locale], function () {
        config.product.productName = config.product.name[config.locale];
        init(config);
    });
};

})(RongIM, {
    jQuery : jQuery,
    Vue: Vue,
    VueRouter: VueRouter,
    MessageCtrl: MessageCtrl,
    win: window
}, RongIM.components);
