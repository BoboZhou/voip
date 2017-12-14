/*
使用流程：
    1、引入第三方 SDK
    2、引入 RongIMCallLib

开发流程：
    1、获取 Agora 最新插件、SDK
    2、设计暴露方式、API
    3、伪代码、Demo
    4、实现
约定：
    1、所有依赖通过参数传入
    2、所有 callback 第一个参数是 error， 第二个是返回值
*/

"use strict";
(function(dependencies) {
    var global = dependencies.win;
    var RongCallUtil = dependencies.RongCallUtil;
    var MessageCtrl = dependencies.MessageCtrl;
    var util = global._;

    var RongVoIP = global.RongVoIP;
    var joinRoom = RongVoIP.joinRoom;
    var quitRoom = RongVoIP.quitRoom;
    var enableAudio = RongVoIP.enableAudio;
    var enableVideo = RongVoIP.enableVideo;


    var callUtil = RongCallUtil;

    var sendCommand = MessageCtrl.sendCommand;

    var cache = callUtil.cache();

    var ObserverList = callUtil.ObserverList;

    var videoWatcher = new ObserverList();
    var commandWatcher = new ObserverList();
    var msgWatcher = new ObserverList();

    MessageCtrl.watch(function(message) {
        msgWatcher.notify(message);
    });

    var watch = function(listener) {
        msgWatcher.add(listener);
    };

    function Timer() {
        this.timeout = 0;
        this.startTime = 0;
        this.start = function(callback, second) {
            second = second || 0;

            if (callback) {
                this.timeout = setTimeout(function() {
                    callback();
                }, second);
            }

            this.startTime = +new Date;
        };

        this.stop = function(callback) {

            clearTimeout(this.timeout);

            var endTime = +new Date;
            var startTime = this.startTime;
            var duration = endTime - startTime;

            return {
                start: startTime,
                end: endTime,
                duration: duration
            };
        };
    }

    cache.set('videoQueue', {});

    var callTimer = {};
    window.callTimer = callTimer
    window.Timer = callTimer;
    var calcTimeout = function(params) {
        var userIds = params.userIds;
        var conversationType = params.conversationType;
        var targetId = params.targetId;


        var currentUserId = config.currentUserId;

        util.forEach(userIds, function(userId) {
            var timer = callTimer[userId] = new Timer();

            var isPrivate = (conversationType == 1);
            var isRemote = (userId == currentUserId) || isPrivate;
            var status = params.status;
            timer.status = status;
            timer.mediaType = params.mediaType;
            var timeout = config.timeout;
            if (!isRemote) {
                timeout += (params.timeout || 0);
            }
            var sentItem = {
                sent: function(timer) {
                    // 一直处于呼叫状态认为对方不在线。
                    var isOffLine = timer.status == CallStatus.Dialing;
                    var key = isOffLine ? 'REMOTE_NO_RESPONSE15' : 'NO_RESPONSE5';
                    var params = {
                        conversationType: conversationType,
                        targetId: targetId,
                        from: 'call-timeout',
                        reasonKey: key
                    };
                    var inviteUsers = cache.get('inviteUsers');
                    sendHungup(params, function(error, message) {
                        var senderUserId = message.senderUserId;
                        delete inviteUsers[senderUserId];
                    });
                },
                local: function(callback) {
                    var key = 'NO_RESPONSE5';
                    var reason = Reason.get(key);
                    var session = cache.get('session')
                    var content = {
                        reason: reason.code,
                        callId: session.content.channelInfo.Id
                    };
                    var message = {
                        messageType: 'HungupMessage',
                        conversationType: conversationType,
                        targetId: targetId,
                        senderUserId: userId,
                        content: content,
                        messageDirection: 2
                    };

                    var error = null;
                    msgWatcher.notify(message);
                }
            };
            timer.start(function() {
                // 接收者为自己时发送 HungupMessage, 其他人则本地创建 HungupMessage，认为此人已忽略、或者不在线。
                var method = isRemote ? 'sent' : 'local';
                sentItem[method](timer);
            }, timeout);
        });
    };

    var room = {
        isActive: false,
        init: function(params, callback) {
            if (this.isActive) {
                return;
            }
            params.url = config.url;
            params.ices = config.ices;
            joinRoom(params, callback);
            this.isActive = true;
        },
        reset: function() {
            this.isActive = false;
            cache.remove('session');
        }
    };

    var initRoom = function(params) {
        getToken(params, function(error, token) {
            if (error) {
                throw new Error(error);
            }

            params.token = token;

            var videoItem = {
                added: function(result) {
                    var stream = result.data;
                    var userId = stream.getAttribute('userid');
                    // App Server 的用户 Id
                    result.userId = userId;

                    var session = cache.get('session');
                    // 加入房间使用的用户 Id
                    var sourceId = session[userId];
                    userId = sourceId || userId;
                    stream.setAttribute('userId', userId);
                }
            };
            room.init(params, function(error, result) {
                if (error) {
                    throw new Error(error);
                }
                var type = result.type;
                var handler = videoItem[type];
                handler && handler(result);

                var sourceId = result.sourceId;
                var userId = result.userId;
                var hasUser = (Number(userId) != sourceId);
                if (hasUser) {
                    videoWatcher.notify(result);
                } else {
                    var queue = cache.get('videoQueue');
                    queue[sourceId] = result;
                }

            });
        });
    };

    var config = {
        url: '',
        timeout: 10000,
        ices: [{
            urls: 'turn:119.254.101.80:3478',
            credential: 'test',
            username: 'test'
        }]
    };

    var CallStatus = {
        //初始状态
        CallIdle: 0,

        //正在呼出
        Dialing: 1,

        //正在呼入
        Incoming: 2,

        //收到一个通话呼入后，正在振铃
        Ringing: 3,

        //正在通话
        Active: 4,

        //已经挂断
        Hangup: 5,
    };

    var Reason = (function() {
        // key ：用描述和错误码组成，方便通过错错误码或者描述获取
        var result = {
            CANCEL1: {
                code: 1,
                info: '己方取消已发出的通话请求'
            },
            REJECT2: {
                code: 2,
                info: '己方拒绝收到的通话请求'
            },
            HANGUP3: {
                code: 3,
                info: '己方挂断'
            },
            BUSYLINE4: {
                code: 4,
                info: '己方忙碌'
            },
            NO_RESPONSE5: {
                code: 5,
                info: '己方未接听'
            },
            ENGINE_UN_SUPPORTED6: {
                code: 6,
                info: '己方不支持当前引擎'
            },
            NETWORK_ERROR7: {
                code: 7,
                info: '己方网络出错'
            },
            OTHER_CLIENT_HANDLED8: {
                code: 8,
                info: '其他设备已处理'
            },
            REMOTE_CANCEL11: {
                code: 11,
                info: '对方取消已发出的通话请求'
            },
            REMOTE_REJECT12: {
                code: 12,
                info: '对方拒绝收到的通话请求'
            },
            REMOTE_HANGUP13: {
                code: 13,
                info: '通话过程对方挂断'
            },
            REMOTE_BUSYLINE14: {
                code: 14,
                info: '对方忙碌'
            },
            REMOTE_NO_RESPONSE15: {
                code: 15,
                info: '对方未接听'
            },
            REMOTE_ENGINE_UN_SUPPORTED16: {
                code: 16,
                info: '对方不支持当前引擎'
            },
            REMOTE_NETWORK_ERROR17: {
                code: 17,
                info: '对方网络错误'
            },
            VOIP_NOT_AVALIABLE18: {
                code: 18,
                info: 'VoIP 不可以用'
            }
        };

        var getKey = function(key) {
            if (util.isNumber(key)) {
                util.forEach(result, function(reason, reasonKey) {
                    reasonKey.indexOf(key) > -1 && (key = reasonKey);
                });
            }
            return key;
        };

        var get = function(key) {
            key = getKey(key);
            return result[key];
        };

        return {
            get: get
        };
    })();

    var getToken = function(params, callback) {
        var channelId = params.channelId;
        var engineType = 3;
        params = {
            command: 'getToken',
            engineType: engineType,
            data: {
                channelId: channelId
            }
        };
        sendCommand(params, callback);
    };

    var array2Obj = function(arrs) {
        var obj = {};
        util.forEach(arrs, function(item) {
            obj[item] = item;
        });
        return obj;
    };

    var isGroup = function(type) {
        return type == 3;
    };

    var inviteItem = {
        busy: function(message) {
            var reasonKey = 'BUSYLINE4';
            var reason = Reason.get(reasonKey);

            var isSender = (message.messageDirection ==1 );

            if (isSender) {
                reasonKey = 'HANGUP3';
            }

            var callId = message.content.callId;

            var content = {
                callId: callId,
                reason: reason.code
            };

            var conversationType = message.conversationType;
            var targetId = message.targetId;

            var data = {
                conversationType: conversationType,
                targetId: targetId,
                content: content
            };
            var params = {
                command: 'hungup',
                data: data
            };

            sendCommand(params);
        },
        free: function(message,isNeedUpUserRel,isInvite) {
            commandWatcher.notify(message);

            cache.set('session', message);

            var sentTime = message.sentTime;
            var senderUserId = message.senderUserId;
            if (isNeedUpUserRel) { //邀请方一人映射
                addUserRelation({
                    sentTime: sentTime,
                    senderUserId: senderUserId
                });
            }else { // 群聊 映射 正在视频的成员
                message.content.existedUserPofiles.map((user) =>{
                    doUserRelation(user.userId, user.mediaId);
                })
            }

            var content = message.content;

            var callId = content.callId;

            var conversationType = message.conversationType;
            var targetId = message.targetId;

            var userIds = content.inviteUserIds;

            cache.set('inviteUsers', array2Obj(userIds));
            if (message.content.existedUserPofiles) {
                let existUsers = message.content.existedUserPofiles.map((user) => {
                    return user.userId
                })
               existUsers.forEach((id)=>{
                   userIds.push(id);
               })
            }

            var mediaType = content.mediaType;
            var params = {
                conversationType: conversationType,
                targetId: targetId,
                userIds: userIds,
                mediaType: mediaType,
                status: CallStatus.Incoming
            };
            calcTimeout(params);
            // 移动端第一次向pc端发起单个群聊 导致existuser 里面缺少发起端
            if (isInvite) {
                var params = {
                    conversationType: conversationType,
                    targetId: targetId,
                    userIds: [message.senderUserId],
                    mediaType: mediaType,
                    status: CallStatus.Active
                };
                calcTimeout(params);
            }

            var data = {
                conversationType: conversationType,
                targetId: targetId,
                content: {
                    callId: callId
                }
            };
            var params = {
                command: 'ringing',
                data: data
            };

            sendCommand(params);
        }
    };

    function doUserRelation(senderUserId, userId) {
        var session = cache.get('session');

            session[senderUserId] = userId;
            session[userId] = senderUserId;

        return {
            userId: userId,
            sender: senderUserId
        };
    }

    var addUserRelation = function(params) {
        var sentTime = params.sentTime;
        var senderUserId = params.senderUserId;
        var mediaID = sentTime & 0x7fffffff;


        console.log("addUserRelation:sentTime->userId", sentTime, "->", senderUserId);
        return doUserRelation(senderUserId, mediaID);
    };
    var Consumer = function(result) {
        var queue = cache.get('videoQueue');

        var stream = result.data;
        var userId = stream.getAttribute('userid');
        var session = cache.get('session');

        if (userId in session) {
            delete queue[userId];
            userId = session[userId] || userId;
            result.sourceId = userId;
            stream.setAttribute('userid', userId);
            videoWatcher.notify(result);
        }
    }

    var summayTimer = new Timer();

    var MessgeDirection = {
        SENT: 1,
        RECEIVED: 2
    };

    var stopItem = {
        single: function(message) {
            var senderUserId = message.senderUserId;
            let targetId = message.targetId;
            var timer = callTimer[senderUserId];
            timer.status=message.callInfo.status;
            var timerTarget = callTimer[targetId];
            timerTarget.status=message.callInfo.status;
            timer && timer.stop();
            timerTarget && timerTarget.stop();
        },
        multi: function(message) {
            util.forEach(callTimer, function(timer) {
                timer.status=message.callInfo.status;
                timer.stop();
            });
            // cache.remove('inviteUsers');
        }
    };
    var stopTimer = function(message) {
        var method = message.extra || 'multi';
        stopItem[method](message);
    };

    var reasonItem = {
        1: function() {
            return Reason.get('REMOTE_CANCEL11');
        },
        2: function() {
            return Reason.get('REMOTE_REJECT12');
        },
        3: function() {
            return Reason.get('REMOTE_HANGUP13');
        },
        4: function() {
            return Reason.get('REMOTE_BUSYLINE14');
        },
        5: function() {
            return Reason.get('REMOTE_NO_RESPONSE15');
        },
        15: function() {
            return Reason.get('NO_RESPONSE5');
        }
    };

    var otherClientHandler = function(message) {
        var type = message.conversationType;
        var targetId = message.targetId;
        var direction = 2;

        var session = cache.get('session');
        var senderUserId = session.senderUserId;
        var caller = senderUserId;
        var inviter = senderUserId;
        var content = session.content;
        var mediaType = content.mediaType;
        var inviteUserIds = content.inviteUserIds;

        var start = 0;
        var duration = 0;
        var reason = Reason.get('OTHER_CLIENT_HANDLED8');

        var summary = {
            conversationType: type,
            targetId: targetId,
            messageDirection: direction,
            content: {
                caller: caller,
                inviter: inviter,
                mediaType: mediaType,
                startTime: start,
                duration: duration,
                status: reason.code,
                memberIdList: inviteUserIds,
            },
            senderUserId: inviter,
            messageType: 'SummaryMessage'
        };

        commandWatcher.notify(summary);
        cache.remove('session');
    };

    var messageHandler = {
        InviteMessage: function(message) {
            var session = cache.get('session');
            var method = session ? 'busy' : 'free';
            inviteItem[method](message,true,true);
        },
        RingingMessage: function(message) {
            var senderUserId = message.senderUserId;
            var timer = callTimer[senderUserId];
            if (timer) {
                timer.stop();
                timer.status = CallStatus.Ringing;
            }
            var session = cache.get('session');
            if (session) {
                var userOnLine = session.userOnLine || {};
                userOnLine[senderUserId] = true;

                session.userOnLine = userOnLine;
                commandWatcher.notify(message);
            }
        },
        AcceptMessage: function(message) {

            var session = cache.get('session');

            var already = session.already;

            var senderUserId = message.senderUserId;
            // 存储用户信息标识
            var sentTime = message.sentTime;
            var user = addUserRelation({
                sentTime: sentTime,
                senderUserId: senderUserId
            });

            var queue = cache.get('videoQueue');
            var video = queue[user.userId] || queue[user.sender];
            if (video) {
                Consumer(video);
            }

            var isSender = (message.messageDirection == 1);

            if (isSender) {
                otherClientHandler(message);
                return;
            }

            if (already) {
                return;
            }

            var content = message.content;

            message.callInfo = {
                mediaType: content.mediaType,
                status: CallStatus.Active
            };
            stopTimer(message);

            var channel = session.content.channelInfo;
            var channelId = channel.Id;

            // 过滤其他端的发送消息
            var callInfo = session.callInfo || {};
            if (!callInfo[channelId]) {
                return;
            }

            session.already = true;
            summayTimer.start();

            var timer = callTimer[senderUserId] || {};
            timer.status = CallStatus.Active;
            commandWatcher.notify(message);
        },
        HungupMessage: function(message) {

            var inviteUsers = cache.get('inviteUsers') || {};

            var senderUserId = message.senderUserId;
            var conversationType = message.conversationType;

            var session = cache.get('session');
            if (!session) {
                return;
            }

            var content = session.content;
            var callId = content.channelInfo.Id;
            var hungupContent = message.content;
            var hungupCallId = hungupContent.callId;
            if (callId != hungupCallId) {
                return;
            }

            message.callInfo = {
                mediaType: content.mediaType,
                status: CallStatus.Hangup
            };

            stopTimer(message);

            delete inviteUsers[senderUserId];
            delete callTimer[senderUserId];// 挂断在邀请
            var isReceived = (message.messageDirection == MessgeDirection.RECEIVED);

            if (isReceived) {
                var content = message.content;
                var reasonCode = content.reason;
                // 兼容移动端拒绝时 reason = 3 
                if (reasonCode == 3 && summayTimer.startTime == 0) {
                    reasonCode = 2;
                }

                var getReason = reasonItem[reasonCode] || util.noop;
                var reason = getReason() || {};

                reasonCode = reason.code || reasonCode;

                // content.reason = reasonCode;
                // message.content.reason = reasonCode;
                cache.set('hungupReason', reasonCode);
            } else {
                otherClientHandler(message);
            }
            commandWatcher.notify(message);

        },
        MediaModifyMessage: function(message) {
            commandWatcher.notify(message);
        },
        MemberModifyMessage: function(message) {
            inviteItem['free'](message,false,false);
        },
        otherMessage: function(message) {
            commandWatcher.notify(message);
        }
    };

    watch(function(message) {
        var messageType = message.messageType;
        messageType = messageType in messageHandler ? messageType : 'otherMessage';

        var handler = messageHandler[messageType];
        handler(message);
    });

    var getRoomId = function(params) {
        var random = Math.floor(Math.random() * 1000);
        var info = [params.conversationType, params.targetId, random];
        return info.join('_');
    };

    var sendCall = function(data, callback) {
        var content = data.content;
        var callId = content.callId;
        var mediaType = content.mediaType;
        var isSharing = data.isSharing;
        var inviteUserIds = content.inviteUserIds;

        var conversationType = data.conversationType;
        var targetId = data.targetId;

        cache.set('inviteUsers', array2Obj(inviteUserIds));

        var params = {
            command: 'invite',
            data: data
        };

        sendCommand(params, function(error, result) {
            var callInfo = {};
            callInfo[callId] = true;

            result.callInfo = callInfo;
            result.isSharing = isSharing;

            //主叫方 userId 为 inviterMessage.sentTime
            //被叫方 userId 为 AcceptMessage.sentTime
            var sentTime = result.sentTime;
            var senderUserId = result.senderUserId;

            var userOnLine = result.userOnLine = {};
            util.forEach(inviteUserIds, function(userId) {
                userOnLine[userId] = false;
            });

            cache.update('session', result);

            addUserRelation({
                sentTime: sentTime,
                senderUserId: senderUserId
            });

            var errorInfo = {
                code: error
            };

            result.params = {
                channelId: callId,
                userId: senderUserId,
                sentTime: sentTime,
                mediaType: mediaType,
                isSharing: isSharing
            };

            callback(errorInfo, result);

            var params = {
                conversationType: conversationType,
                targetId: targetId,
                userIds: inviteUserIds,
                timer: 10,
                mediaType: mediaType,
                status: CallStatus.Dialing
            };
            calcTimeout(params);
        });
    };
    var call = function(params, callback) {

        var cacheKey = 'session';

        var session = cache.get(cacheKey);
        if (session) {
            var key = 'BUSYLINE4';
            callback(Reason.get(key));
            return;
        }

        var engineType = 3;

        cache.set(callback, params);

        callback = callback || util.noop;

        var conversationType = params.conversationType;
        var targetId = params.targetId;
        var inviteUserIds = params.inviteUserIds;
        var mediaType = params.mediaType;
        var isSharing = params.isSharing;

        var callId = getRoomId(params);
        var channel = {
            Key: '',
            Id: callId
        };

        var data = {
            isSharing: isSharing,
            conversationType: conversationType,
            targetId: targetId,
            content: {
                sharing: isSharing,
                engineType: engineType,
                inviteUserIds: inviteUserIds,
                mediaType: mediaType,
                callId: callId,
                channelInfo: channel
            }
        };

        sendCall(data, function(error, result) {
            if (error.code) {
                callback(error);
                return;
            }
            var params = result.params;
            params.engineType = engineType;
            initRoom(params);
        });
    };

    var sendInvite = function(data, callback) {
        var content = data.content;
        var inviteUserIds = content.inviteUserIds;

        var inviteUsers = cache.get('inviteUsers');
        util.forEach(inviteUserIds, function(userId) {
            inviteUsers[userId] = userId;
        });

        var params = {
            command: 'memberModify',
            data: data
        };
        var conversationType = data.conversationType;
        var targetId = data.targetId;
        var mediaType = data.content.mediaType;
        console.log("send memberModify", data);
        sendCommand(params, function(error, result) {
            var sentTime = result.sentTime;
            var senderUserId = result.senderUserId;

          /*  addUserRelation({  //  群聊 A 已经在房间， A 邀请 B ，A的mediaId在第一次accept的时候已经确定！此 sentTime 是A 邀请 B的时间戳 不应该映射为 A 的mediaID。
                sentTime: sentTime,
                senderUserId: senderUserId
            });*/

            var error = {
                code: error
            };

            callback(error, result);

            var params = {
                conversationType: conversationType,
                targetId: targetId,
                userIds: inviteUserIds,
                timer: 10,
                mediaType: mediaType,
                status: CallStatus.Dialing
            };
            calcTimeout(params);
        });
    };

    var invite = function(params, callback) {
        var cacheKey = 'session';

        var session = cache.get(cacheKey);

        var info = 'Invite: Not call yet';
        checkSession({
            session: session,
            info: info
        });

        callback = callback || util.noop;

        var session = cache.get('session');
        var conversationType = params.conversationType;
        var targetId = params.targetId;

        var content = session.content;
        var callId = content.callId;

        var caller = session.senderUserId;
        var engineType = 3;
        var channel = {
            Key: '',
            Id: callId
        };

        var mediaType = params.mediaType;
        var inviteUserIds = params.inviteUserIds;
        var isSharing = params.isSharing;

        var modifyMemType = 1;


        var existList = [];

        util.forEach(callTimer, function(timer, userId) {
            var member = {
                userId: userId,
                mediaId: String(session[userId] & 0x7fffffff),//ios o只支持string 类型
                mediaType: timer.mediaType,
                callStatus: timer.status
            };
            existList.push(member);
        });

        var currentUserId = config.currentUserId;
        var currentUser = {
            userId: currentUserId,
            mediaId: String(session[currentUserId] & 0x7fffffff),
            mediaType: mediaType,
            callStatus: CallStatus.Active
        };
       let userIDs= existList.map((user)=>{
            return user.userId
        })
        if (userIDs.indexOf(currentUser.userId)<0)
            existList.push(currentUser);
     /*   // 去重
       existList= existList.filter((user)=>{
            var t = false;
            existList.forEach((u)=>{
                if (user.userId == u.userId) {
                    !t
                }
            })
             return t;
        })*/
        var data = {
            conversationType: conversationType,
            targetId: targetId,
            content: {
                modifyMemType: modifyMemType,
                callId: callId,
                caller: caller,
                engineType: engineType,
                extra:"multi",
                inviter:currentUser.userId,
                useSignalServer:false,
                channelInfo: channel,
                mediaType: mediaType,
                inviteUserIds: inviteUserIds,
                existedMemberStatusList: existList
            }
        };

        sendInvite(data, callback);
    };
    // params.info
    // params.position
    var errorHandler = function(params) {
        var info = params.info;
        throw new Error(info);
    };

    var checkSession = function(params) {
        if (!params.session) {
            errorHandler(params);
        }
    };

    var sendAccept = function(params) {
        var conversationType = params.conversationType;
        var targetId = params.targetId;

        var mediaType = params.mediaType;
        var isSharing = params.isSharing;

        var session = cache.get('session');

        var from = params.from;
        var info = from + ': Not call yet';
        checkSession({
            session: session,
            info: info
        });

        var engineType = 3;

        var content = session.content;
        var callId = content.callId;

        params = {
            command: 'accept',
            data: {
                conversationType: conversationType,
                targetId: targetId,
                content: {
                    callId: callId,
                    mediaType: mediaType
                }
            }
        };

        sendCommand(params, function(error, command) {
            var sentTime = command.sentTime;
            var channelId = content.callId;
            var userId = command.senderUserId;

            command.callInfo = {
                mediaType: content.mediaType,
                status: CallStatus.Active
            };
            if (session.content.extra){
                command.extra = session.content.extra;
            }

            stopTimer(command);

            addUserRelation({
                sentTime: sentTime,
                senderUserId: userId
            });

            var params = {

                channelId: channelId,
                userId: userId,
                sentTime: sentTime,
                mediaType: mediaType,
                isSharing: isSharing,
                engineType: engineType
            };
            callTimer[userId].status = CallStatus.Active;
            initRoom(params);
            summayTimer.start();
        });
    };

    var accept = function(params) {
        params.form = 'accept';
        sendAccept(params);
    };

    var join = function(params) {
        params.form = 'join';
        sendAccept(params);
    };

    var sendHungup = function(params, callback) {
        callback = callback || util.noop;

        var session = cache.get('session');

        var from = params.from;
        var info = from + ': Not call yet';
        checkSession({
            session: session,
            info: info
        });

        var callId = session.content.callId;
        var callId = callId;

        var conversationType = session.conversationType;
        var targetId = session.targetId;

        var key = params.reasonKey;
        var reason = Reason.get(key);

        params = {
            command: 'hungup',
            data: {
                conversationType: conversationType,
                targetId: targetId,
                content: {
                    callId: callId,
                    reason: reason.code
                }
            }
        };

        sendCommand(params, function(error, result) {

            var timer = summayTimer.stop();

            var caller = session.senderUserId;

            var inviter = session.senderUserId;

            var content = session.content;
            var mediaType = content.mediaType;

            var inviteUserIds = content.inviteUserIds;

            var userOnLine = session.userOnLine || {};

            if (conversationType == 1 && userOnLine[caller]) {
                var method = reasonItem[reason.code];
                method && (reason = method());
            }

            var summary = {
                conversationType: conversationType,
                targetId: targetId,
                messageDirection: session.messageDirection,
                content: {
                    caller: caller,
                    inviter: inviter,
                    mediaType: mediaType,
                    startTime: timer.start,
                    duration: timer.duration,
                    status: reason.code,
                    memberIdList: inviteUserIds,
                },
                senderUserId: inviter,
                messageType: 'SummaryMessage'
            };

            commandWatcher.notify(summary);

            var error = null;

            callback(error, summary);

            room.reset();
            cache.remove('hungupReason');
        });

        quitRoom({
            roomId: callId
        });

        stopTimer();
    };

    var hungup = function(params, callback) {
        params.from = 'hungup';
        var key = 'CANCEL1';
        util.forEach(callTimer, function(timer) {
            if (timer.status == CallStatus.Active) {
                key = 'HANGUP3';
            }
        });

        var conversationType = params.conversationType;
        if (params.passive) {
            key = cache.get('hungupReason') || key;
            if (isGroup(conversationType)) {  // TODO callTimer[config.currentUserId] ==undefinde  导致多人无法挂断 看看融云什么问题
                if (callTimer[config.currentUserId] && callTimer[config.currentUserId].status == CallStatus.Active) {
                    key = 'REMOTE_HANGUP13';
                } else {
                    key = 'NO_RESPONSE5';
                }
            }
        }
        params.reasonKey = key;
        sendHungup(params, callback);
    };

    var reject = function(params) {
        params = params || {};
        params.from = 'reject';
        params.reasonKey = 'REJECT2';
        sendHungup(params);
    };

    var quit = function(params, callback) {
        params.reasonKey = 'HANGUP3';
        sendHungup(params, callback);
    };

    var mute = function() {
        var params = {
            isEnabled: false
        };
        enableAudio(params);
    };

    var unmute = function() {
        var params = {
            isEnabled: true
        };
        enableAudio(params);
    };

    var sendMediaModifyMessage = function(mediaType) {
        var session = cache.get('session');
        var content = session.content;
        var callId = content.callId;
        var mediaType = mediaType;
        var conversationType = session.conversationType;
        var targetId = session.targetId;

        var params = {
            command: 'mediaModify',
            data: {
                conversationType: conversationType,
                targetId: targetId,
                content: {
                    callId: callId,
                    mediaType: mediaType
                }
            }
        };

        sendCommand(params);
    };

    var videoToAudio = function() {
        var params = {
            isEnabled: false
        };
        enableVideo(params);
        // TODO
        var mediaType = 1;
        sendMediaModifyMessage(mediaType);
    };

    var audioToVideo = function() {
        var params = {
            isEnabled: true
        };
        enableVideo(params);
        // TODO
        var mediaType = 2;
        sendMediaModifyMessage(mediaType);
    };

    var setConfig = function(cfg) {
        util.extend(config, cfg);
    };

    var videoWatch = function(watcher) {
        videoWatcher.add(watcher);
    };

    var commandWatch = function(watcher) {
        commandWatcher.add(watcher);
    };

    global.RongCallLib = {
        setConfig: setConfig,
        videoWatch: videoWatch,
        commandWatch: commandWatch,

        call: call,
        invite: invite,
        hungup: hungup,
        reject: reject,
        join: join,
        mute: mute,
        unmute: unmute,
        videoToAudio: videoToAudio,
        audioToVideo: audioToVideo,
        accept: accept
    };
})({
    win: window,
    RongCallUtil: RongCallUtil,
    MessageCtrl: MessageCtrl
});