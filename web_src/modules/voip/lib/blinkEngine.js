/** This library require adapter.js */

/** ----- 参数定义 ----- */
var BlinkGlobal = {
	/** 带宽设置计数器 */
	bandWidthCount : 0
}
/** ----- 参数定义 ----- */

/** ----- 常量定义 ----- */
var BlinkConstant = {
	/** Blink SDK版本号 */
	SDK_VERSION_NAME : '1.0.0',
	/** logon version */
	LOGON_VERSION : '1',
	/** keepAlive时间间隔 */
	KEEPALIVE_INTERVAL : 5 * 1000,
	/** keepAlive最大连续失败次数 */
	KEEPALIVE_FAILEDTIMES_MAX : 4,
	/** keepAliveTimer时间间隔 */
	KEEPALIVE_TIMER_INTERVAL : 1 * 1000,
	/** keepAlive未收到result最大超时时间 */
	KEEPALIVE_TIMER_TIMEOUT_MAX : 20,
	/** keepAlive未收到result最大超时时间 */
	KEEPALIVE_TIMER_TIMEOUT_RECONNECT : 12,
	/** reconnect最大连续次数 */
	RECONNECT_MAXTIMES : 10,
	/** reconnect连续重连时间间隔 */
	RECONNECT_TIMEOUT : 1 * 1000,
	/** getStatsReport时间间隔 */
	GETSTATSREPORT_INTERVAL : 1 * 1000
}
/** 连接类型 */
BlinkConstant.ConnectionType = {
	/** P2P模式 */
	P2P : '0',
	/** MediaServer模式 */
	MEDIASERVER : '1'
}
/** 用户模式类型 */
BlinkConstant.UserType = {
	/** 普通模式 */
	NORMAL : '1',
	/** 观察者模式 */
	OBSERVER : '2'
}
/** 与服务器的连接状态 */
BlinkConstant.ConnectionState = {
	CONNECTED : 'CONNECTED',
	DISCONNECTED : 'DISCONNECTED',
	ROOM_ERROR : 'ROOM_ERROR'
}
/** websocket的连接状态 */
BlinkConstant.wsConnectionState = {
	CONNECTED : 'CONNECTED',
	DISCONNECTED : 'DISCONNECTED',
	CONNECTING : 'CONNECTING'
}
/** 交换类型 */
BlinkConstant.ExchangeType = {
	/** offer */
	OFFER : '1',
	/** answer */
	ANSWER : '2',
	/** candidate */
	CANDIDATE : '3'
}
/** logonAndJoin status */
BlinkConstant.LogonAndJoinStatus = {
	CONNECT : 0,
	RECONNECT : 1
}
/** offer status */
BlinkConstant.OfferStatus = {
	SENDING : 'SENDING',
	DONE : 'DONE'
}
/** 信令 */
BlinkConstant.SignalType = {
	/** 请求信令 */
	// LOGON : 'logon',
	// JOIN : 'join',
	// PING : 'ping',
	LOGONANDJOIN : 'logonAndJoin',
	CHANNEL_PING : 'channelPing',
	UPDATETALKTYPE : 'updateTalkType',
	LEAVE : 'leave',
	EWB_CREATE : 'ewb_create',
	EWB_QUERY : 'ewb_query',
	/** 应答信令 */
	LOGONANDJOIN_RESULT : 'logonAndJoin_result',
	CHANNEL_PING_RESULT : 'channelPing_result',
	LEAVE_RESULT : 'leave_result',
	EWB_CREATE_RESULT : 'ewb_create_result',
	EWB_QUERY_RESULT : 'ewb_query_result',
	/** 通知信令 */
	JOINED : 'joined',
	UPDATE_TALKTYPE : 'update_talktype',
	OFFER_REQUEST : 'offerRequest',
	LEFT : 'left',
	EWB_CREATE_NOTIFY : 'ewb_create_notify',
	/** exchange信令 */
	EXCHANGE : 'exchange'
}
/** 视频分辨率 */
BlinkConstant.VideoProfile_default = {
	width : 640,
	height : 480,
	frameRate : 15
}
/** 带宽 */
BlinkConstant.BandWidth_default = {
	start : 500,
	min : 300,
	max : 600
}
/** 视频参数KEY值 */
BlinkConstant.ParameterKey = {
	/** 是否为纯音频 */
	KEY_IS_AUDIO_ONLY : "IS_AUDIO_ONLY",
	/** 视频分辨率/帧率等参数 */
	KEY_VIDEO_PROFILE : "VIDEO_PROFILE",
	/** 视频的最大码率 */
	KEY_VIDEO_MAX_RATE : "VIDEO_MAX_RATE",
	/** 视频的最小码率 */
	KEY_VIDEO_MIN_RATE : "VIDEO_MIN_RAT",
	/** 用户类型 */
	KEY_USER_TYPE : "USER_TYPE",
	/** 是否关闭本地摄像头 */
	KEY_IS_CLOSE_VIDEO : "IS_CLOSE_VIDEO",
}
/** ----- 常量定义 ----- */

/** ----- BlinkEngine ----- */
//var BlinkEngine = (function() {
/**
 * 构造函数
 * 
 */
var BlinkEngine = function(wsNavUrl) {
	this.init(wsNavUrl);
	return this;
}
/**
 * 初始化
 * 
 */
BlinkEngine.prototype.init = function(wsNavUrl) {
	/** 会议ID */
	this.channelId = null;
	/** 连接集合 */
	this.peerConnections = {};
	/** 本地视频流 */
	this.localStream = null;
	/** 远端视频流数组 */
	this.remoteStreams = new Array();
	/** logonAndJoin status 登录类型，第一次登录加入房间传0，断线重连传1 */
	this.logonAndJoinStatus = null;
	/** offer status */
	this.offerStatus = null;
	/** 连接的用户集合 */
	this.joinedUsers = new BlinkMap();
	/** remote cname Map */
	this.remoteCnameMap = new BlinkMap();
	/** 麦克风开关 */
	this.microphoneEnable = true;
	/** 本地视频开关 */
	this.localVideoEnable = true;
	/** 远端音频开关 */
	this.remoteAudioEnable = true;
	/** keepAlive连续失败次数计数器 */
	this.keepAliveFailedTimes = 0;
	/** keepAlive间隔 */
	this.keepAliveInterval = null;
	/** keepAlive未收到result计时 */
	this.keepAliveTimerCount = 0;
	/** keepAlive未收到result计时器 */
	this.keepAliveTimer = null;
	/** reconnect连续次数计数器 */
	this.reconnectTimes = 0;
	/** csequence */
	this.csequence = 0;
	/** websocket对象 */
	this.signaling = null;
	/** websocket消息队列 */
	this.wsQueue = [];
	/** websocket连接状态, true:已连接, false:未连接 */
	this.wsConnectionState = null;
	/** websocket是否强制关闭：true:是, false不是 */
	this.wsForcedClose = false;
	/** websocket是否需要重连：true:是, false不是 */
	this.wsNeedConnect = true;
	/** websocket地址列表 */
	this.wsUrlList = [];
	/** websocket地址索引 */
	this.wsUrlIndex = 0;
	
	// 设置websocket nav url
	this.wsNavUrl = wsNavUrl;
	
	/** 视频参数默认值 */
	this.userType = BlinkConstant.UserType.NORMAL;
	this.isAudioOnly = false;
	this.localVideoEnable = true;
	this.videoProfile = BlinkConstant.VideoProfile_default;
	this.videoMaxRate = BlinkConstant.BandWidth_default.max;
	this.videoMinRate = BlinkConstant.BandWidth_default.min;
	/** media config */
	this.mediaConfig = {
		video : this.videoProfile,
		audio : true
	}
	/** bandwidth */
	this.bandWidth = {
		min : this.videoMinRate,
		max : this.videoMaxRate
	};
//	/** sdp属性 */
//	// 统一设置，包含观察者模式和普通模式无摄像头情况
//	this.mediaConfig.sdpConstraints = {};
//	this.mediaConfig.sdpConstraints.mandatory = {};
//	this.mediaConfig.sdpConstraints.mandatory.OfferToReceiveAudio = true;
//	this.mediaConfig.sdpConstraints.mandatory.OfferToReceiveVideo = true;

	/** 是否上报丢包率信息 */
	this.isSendLostReport = false;
	/** BlinkConnectionStatsReport */
	this.blinkConnectionStatsReport = null;
	/** getStatsReport间隔 */
	this.getStatsReportInterval = null;
};
/**
 * reset
 * 
 */
BlinkEngine.prototype.reset = function() {
	
}
/**
 * clear
 * 
 */
BlinkEngine.prototype.clear = function() {
	this.exitScheduleKeepAlive();
	this.exitScheduleKeepAliveTimer();
	this.disconnect(false);
	this.closePeerConnection(this.selfUserId);
}
/** ----- 提供能力 ----- */
/**
 * 获取Blink SDK版本号
 * 
 * @return sdkversion
 */
BlinkEngine.prototype.getSDKVersion = function() {
	return BlinkConstant.SDK_VERSION_NAME;
}
/**
 * 设置BlinkEngineEventHandle监听
 * 
 */
BlinkEngine.prototype.setBlinkEngineEventHandle = function(
		blinkEngineEventHandle) {
	this.blinkEngineEventHandle = blinkEngineEventHandle;
}
/**
 * 设置视频参数
 * 
 */
BlinkEngine.prototype.setVideoParameters = function(config) {
	if (config.USER_TYPE != null && config.USER_TYPE == BlinkConstant.UserType.OBSERVER) {
		this.userType = BlinkConstant.UserType.OBSERVER;
	}
	if (config.IS_AUDIO_ONLY != null) {
		this.isAudioOnly = config.IS_AUDIO_ONLY;
	}
	if (config.IS_CLOSE_VIDEO != null) {
		this.localVideoEnable = !config.IS_CLOSE_VIDEO;
	}
	if (config.VIDEO_PROFILE != null) {
		this.videoProfile = config.VIDEO_PROFILE;
		/** media config */
		this.mediaConfig.video = this.videoProfile;
	}
	if (config.VIDEO_MAX_RATE != null) {
		this.videoMaxRate = config.VIDEO_MAX_RATE;
		/** bandwidth */
		this.bandWidth.max = this.videoMaxRate;
	}
	if (config.VIDEO_MIN_RATE != null) {
		this.videoMinRate = config.VIDEO_MIN_RATE;
		/** bandwidth */
		this.bandWidth.min = this.videoMinRate;
	}
//	/** sdp属性 */
//	if (this.userType == BlinkConstant.UserType.OBSERVER) { // 观察者模式
//		if (this.mediaConfig.sdpConstraints == null) {
//			this.mediaConfig.sdpConstraints = {};
//		}
//		if (this.mediaConfig.sdpConstraints.mandatory == null) {
//			this.mediaConfig.sdpConstraints.mandatory = {};
//		}
//		this.mediaConfig.sdpConstraints.mandatory.OfferToReceiveAudio = true;
//		this.mediaConfig.sdpConstraints.mandatory.OfferToReceiveVideo = true;
//	}
}
/**
 * 加入会议
 * 
 */
BlinkEngine.prototype.joinChannel = function(channelId, userId, token) {
	this.channelId = BlinkConstant.ConnectionType.MEDIASERVER + channelId;
	this.selfUserId = userId;
	this.token = token;
	// 创建本地视频
	var blinkEngine = this;
	navigator.getUserMedia(blinkEngine.mediaConfig, function(stream) {
		BlinkLogger.info("navigator.getUserMedia success");
		blinkEngine.localStream = stream;
		if (!blinkEngine.localVideoEnable) {
			blinkEngine.closeLocalVideoWithUpdateTalkType(
					!blinkEngine.localVideoEnable, false);
		}
		// 创建websocket连接
		blinkEngine.createSignaling();
		blinkEngine.logonAndJoin(BlinkConstant.LogonAndJoinStatus.CONNECT);
	}, function(error) {
		BlinkLogger.error("navigator.getUserMedia error: ", error);
		blinkEngine.blinkEngineEventHandle.call('onJoinComplete', {
			'isJoined' : false
		});
	});
};
/**
 * 离开会议
 * 
 */
BlinkEngine.prototype.leaveChannel = function() {
	this.leave();
}
/**
 * 获取本地视频视图
 * @Deprecated
 * 
 */
BlinkEngine.prototype.getLocalVideoView = function() {
	return this.getLocalStream();
};
/**
 * 获取远端视频视图
 * @Deprecated
 * 
 */
BlinkEngine.prototype.getRemoteVideoView = function(userId) {
	return this.getRemoteStream(userId);
};
/**
 * 获取本地视频流
 * 
 */
BlinkEngine.prototype.getLocalStream = function() {
	return this.localStream;
};
/**
 * 获取远端视频流
 * 
 */
BlinkEngine.prototype.getRemoteStream = function(userId) {
	for ( var i in this.remoteStreams) {
		if (this.remoteStreams[i].id == userId) {
			return this.remoteStreams[i]
			break;
		}
	}
	return null;
};
/**
 * 获取远端视频流数量
 * 
 */
BlinkEngine.prototype.getRemoteStreamCount = function() {
	return this.remoteStreams.length;
};
/**
 * 创建视频视图
 * 
 */
BlinkEngine.prototype.createVideoView = function() {
	var videoView = document.createElement('video');
	// 视频自动播放
	videoView.autoplay = true;
	return videoView;
};
/**
 * 创建本地视频视图
 * 
 */
BlinkEngine.prototype.createLocalVideoView = function() {
	var localVideoView = this.createVideoView();
	// 本地视频静音
	localVideoView.muted = true;
	// ID
	localVideoView.id = this.selfUserId;
	// 附加视频流
	localVideoView.srcObject = this.getLocalStream();
	return localVideoView;
};
/**
 * 创建远端视频视图
 * 
 */
BlinkEngine.prototype.createRemoteVideoView = function(userId) {
	var remoteStream = this.getRemoteStream(userId);
	if (remoteStream == null) {
		return null;
	}
	var remoteVideoView = this.createVideoView();
	// ID
	remoteVideoView.id = userId;
	// 附加视频流
	remoteVideoView.srcObject = remoteStream;
	return remoteVideoView;
};
/**
 * 关闭/打开麦克风 true, 关闭 false, 打开
 * 
 */
BlinkEngine.prototype.muteMicrophone = function(isMute) {
	if (this.localStream.getAudioTracks()
			&& this.localStream.getAudioTracks().length === 0) {
		BlinkLogger.info("No local MIC available.");
		return;
	}
	for (i = 0; i < this.localStream.getAudioTracks().length; i++) {
		this.localStream.getAudioTracks()[i].enabled = !isMute;
	}
	BlinkLogger.info("Microphone mute=" + isMute);
	this.microphoneEnable = !isMute;
}
/**
 * 关闭/打开本地摄像头 true, 关闭 false, 打开
 * 
 */
BlinkEngine.prototype.closeLocalVideo = function(isCameraClose) {
	var isUpdateTalkType = true;
	if (this.userType == BlinkConstant.UserType.OBSERVER) { // 观察者模式
		isUpdateTalkType = false;
	}
	this.closeLocalVideoWithUpdateTalkType(isCameraClose, isUpdateTalkType);
}
/**
 * 关闭/打开本地摄像头和发送updateTalkType信令
 * 
 * @param isCameraClose
 *            true, 关闭 false, 打开
 * @param isUpdateTalkType
 *            true, 发送 false, 不发送
 */
BlinkEngine.prototype.closeLocalVideoWithUpdateTalkType = function(
		isCameraClose, isUpdateTalkType) {
	if (this.localStream.getVideoTracks()
			&& this.localStream.getVideoTracks().length === 0) {
		BlinkLogger.info("No local video available.");
		return;
	}
	for (i = 0; i < this.localStream.getVideoTracks().length; i++) {
		this.localStream.getVideoTracks()[i].enabled = !isCameraClose;
	}
	BlinkLogger.info("Local video close=" + isCameraClose);
	this.localVideoEnable = !isCameraClose;
	// 发送updateTalkType信令
	if (isUpdateTalkType) {
		this.updateTalkType();
	}
}
/**
 * 关闭/打开声音 true, 关闭 false, 打开
 * 
 */
BlinkEngine.prototype.closeRemoteAudio = function(isAudioClose) {
	if (this.remoteStreams.length === 0) {
		BlinkLogger.info("No remote audio available.");
		return;
	}
	for (x = 0; x < this.remoteStreams.length; x++) {
		var tmpRemoteStream = this.remoteStreams[x];
		if (tmpRemoteStream && tmpRemoteStream.getAudioTracks()
				&& tmpRemoteStream.getAudioTracks().length > 0) {
			for (y = 0; y < tmpRemoteStream.getAudioTracks().length; y++) {
				tmpRemoteStream.getAudioTracks()[y].enabled = !isAudioClose;
			}
		}
	}
	BlinkLogger.info("Remote audio close=" + isAudioClose);
	this.remoteAudioEnable = !isAudioClose;
}
/**
 * 关闭本地媒体流（视频流和音频流）
 * 
 */
BlinkEngine.prototype.closeLocalStream = function() {
	if (this.localStream.getTracks()
			&& this.localStream.getTracks().length === 0) {
		BlinkLogger.info("No local track available.");
		return;
	}
	for (i = 0; i < this.localStream.getTracks().length; i++) {
		this.localStream.getTracks()[i].stop();
	}
}
/**
 * 请求白板页面 HTTP URL
 * 
 */
BlinkEngine.prototype.requestWhiteBoardURL = function() {
	this.ewb_create();
}
/**
 * 查询白板
 * 
 */
BlinkEngine.prototype.queryWhiteBoard = function() {
	this.ewb_query();
}
/**
 * 设置是否上报丢包率信息
 * 
 */
BlinkEngine.prototype.enableSendLostReport = function(enable) {
	this.isSendLostReport = enable
}
/** ----- 提供能力 ----- */
/** ----- websocket ----- */
/**
 * 创建WebSocket对象
 * 
 */
BlinkEngine.prototype.createSignaling = function() {
	// ws正在连接
	this.wsConnectionState = BlinkConstant.wsConnectionState.CONNECTING;
	if (this.wsUrlList.length > 0) { // 已取得websocket连接地址
		this.wsUrlIndex++;
		if (this.wsUrlIndex > this.wsUrlList.length - 1) {
			this.wsUrlIndex = 0;
		}
		var url = this.wsUrlList[this.wsUrlIndex];
		this.createSignalingWithUrl(url);
	} else { // 还没有取得websocket连接地址
		var blinkEngine = this;
		BlinkUtil.getWsUrlList(this.wsNavUrl, function(data) {
			var wsUrlList = data;
			if (wsUrlList.length < 1) {
				throw new Error("websocket连接失败!");
			}
			blinkEngine.wsUrlList = BlinkUtil.shuffle(wsUrlList);
			var url = blinkEngine.wsUrlList[0];
			blinkEngine.createSignalingWithUrl(url);
		});
	}
};
/**
 * 创建WebScoket对象
 * 
 */
BlinkEngine.prototype.createSignalingWithUrl = function(url) {
	var blinkEngine = this;
	blinkEngine.signaling = new WebSocket('wss://' + url + '/signaling');
	blinkEngine.signaling.onopen = function() {
		blinkEngine.onOpen();
	};
	blinkEngine.signaling.onmessage = function(ev) {
		blinkEngine.onMessage(ev);
	};
	blinkEngine.signaling.onerror = function(ev) {
		blinkEngine.onError(ev);
	};
	blinkEngine.signaling.onclose = function(ev) {
		blinkEngine.onClose(ev);
	};
};
/**
 * BlinkMessage实体
 * 
 * @param signal
 * @param content
 * @param parameters
 * @returns
 */
var BlinkMessage = function(signal, content, parameters) {
	this.signal = signal;
	this.content = content;
	this.parameters = parameters;
};
/**
 * 发送消息
 * 
 */
BlinkEngine.prototype.sendMsg = function(signal, msgBody, parameters) {
	this.csequence++;
	parameters.csequence = this.csequence;
	var message = JSON.stringify(new BlinkMessage(signal, msgBody, parameters));
	this.send(message);
};
/**
 * 发送消息
 * 
 */
BlinkEngine.prototype.send = function(message) {
	var signal = JSON.parse(message).signal;
	if (this.wsConnectionState == BlinkConstant.wsConnectionState.CONNECTED) { // ws连接可用
		if (signal == BlinkConstant.SignalType.CHANNEL_PING) { // channelPing记录debug日志
			BlinkLogger.debug("req: " + message);
		} else {
			BlinkLogger.info("req: " + message);
		}
		this.signaling.send(message);
	} else { // websocket不可用
		BlinkLogger.warn("websocket not connected!");
		if (this.wsQueue.length == 0 // 消息队列只保留一条logonAndJoin
				&& signal == BlinkConstant.SignalType.LOGONANDJOIN) { // logonAndJoin
			// 加入消息队列
			this.wsQueue.push(message);
		}
	}
};
/**
 * 发送队列中的消息
 */
BlinkEngine.prototype.doWsQueue = function() {
	if (this.wsQueue.length > 0) {
		// 消息队列只有一条logonAndJoin，取出并删除
		var message = this.wsQueue.shift();
		this.send(message);
	}
};
/**
 * onOpen
 * 
 */
BlinkEngine.prototype.onOpen = function() {
	BlinkLogger.info('websocket open');
	// ws连接可用
	this.wsConnectionState = BlinkConstant.wsConnectionState.CONNECTED;
	// 重置reconnectTimes
	this.reconnectTimes = 0;
	// websocket可用后，发送队列中的消息
	this.doWsQueue();
}
/**
 * onMessage
 * 
 */
BlinkEngine.prototype.onMessage = function(ev) {
	var data = JSON.parse(ev.data);
	if (data.signal == BlinkConstant.SignalType.CHANNEL_PING_RESULT) { // channelPing_result记录debug日志
		BlinkLogger.debug("res: " + ev.data);
	} else {
		BlinkLogger.info("res: " + ev.data);
	}
	switch (data.signal) {
	// 应答信令
	case BlinkConstant.SignalType.LOGONANDJOIN_RESULT:
		this.logonAndJoin_result(data);
		return;
	case BlinkConstant.SignalType.CHANNEL_PING_RESULT:
		this.channelPing_result(data);
		return;
	case BlinkConstant.SignalType.LEAVE_RESULT:
		this.leave_result(data);
		return;
	case BlinkConstant.SignalType.EWB_CREATE_RESULT:
		this.ewb_create_result(data);
		return;
	case BlinkConstant.SignalType.EWB_QUERY_RESULT:
		this.ewb_query_result(data);
		return;
	// 通知信令
	case BlinkConstant.SignalType.JOINED:
		this.joined(data);
		return;
	case BlinkConstant.SignalType.LEFT:
		this.left(data);
		return;
	case BlinkConstant.SignalType.OFFER_REQUEST:
		this.offerRequest(data);
		return;
	case BlinkConstant.SignalType.UPDATE_TALKTYPE:
		this.update_talktype(data);
		return;
	// exchange信令
	case BlinkConstant.SignalType.EXCHANGE:
		this.exchange(data);
		return;
	default:
		BlinkLogger.debug('Event ' + data.signal + ' do not have defined function');
	}
};
/**
 * onClose
 * 
 */
BlinkEngine.prototype.onClose = function(ev) {
	BlinkLogger.warn('websocket close', ev);
	if (ev.code == 1000 && ev.reason == 'wsForcedClose') { // 如果自定义关闭ws连接，避免二次重连
		return;
	}
	// ws连接不可用
	this.wsConnectionState = BlinkConstant.wsConnectionState.DISCONNECTED;
	if (this.wsNeedConnect) { // ws需要重连
		this.reconnect();
	}
};
/**
 * onError
 * 
 */
BlinkEngine.prototype.onError = function(ev) {
	BlinkLogger.error('websocket error', ev);
};
/**
 * disconnect
 * 
 */
BlinkEngine.prototype.disconnect = function(wsNeedConnect) {
	BlinkLogger.warn('websocket disconnect');
	BlinkLogger.warn('wsNeedConnect=' + wsNeedConnect);
	
	this.wsForcedClose = true;
	this.wsNeedConnect = wsNeedConnect;
	this.wsConnectionState = BlinkConstant.wsConnectionState.DISCONNECTED;
	// 自定义关闭ws连接
	this.signaling.close(1000, 'wsForcedClose');
	// 网断后，执行close方法后不会立即触发onclose事件，所以需要手动重连
	if (this.wsNeedConnect) { // ws需要重连
		this.reconnect();
	}
};
/**
 * reconnect
 * 
 */
BlinkEngine.prototype.reconnect = function() {
	if (this.wsConnectionState != BlinkConstant.wsConnectionState.DISCONNECTED) { // ws连接可用或正在连接不重连
		return;
	}
	this.reconnectTimes++;
	BlinkLogger.warn('reconnectTimes=' + this.reconnectTimes);
	if (this.reconnectTimes > BlinkConstant.RECONNECT_MAXTIMES) {
		this.keepAliveDisconnect();
	} else {
		var blinkEngine = this;
		if (blinkEngine.reconnectTimes > 1) { // 连续重连的话间隔一定时间
			setTimeout(function() {
				reconnectFunc(blinkEngine);
			}, BlinkConstant.RECONNECT_TIMEOUT);
		} else {
			reconnectFunc(blinkEngine);
		}

		function reconnectFunc(blinkEngine) {
			if (blinkEngine.wsConnectionState == BlinkConstant.wsConnectionState.DISCONNECTED) { // ws连接不可用
				BlinkLogger.info('websocket reconnect');
				blinkEngine.createSignaling();
				// 重新logonAndJoin
				blinkEngine.logonAndJoin(BlinkConstant.LogonAndJoinStatus.RECONNECT);
			}
		}
	}
};
/** ----- websocket ----- */
/** ----- keepAlive ---- */
/**
 * keepAlive
 * 
 */
BlinkEngine.prototype.keepAlive = function() {
	if (this.wsConnectionState == BlinkConstant.wsConnectionState.CONNECTED) { // ws连接可用
		// 开始计时
		this.startScheduleKeepAliveTimer();
		this.channelPing();
	} else {
		this.keepAliveFailed();
	}
}
/**
 * keepAlive失败
 * 
 */
BlinkEngine.prototype.keepAliveFailed = function() {
	this.keepAliveFailedTimes++;
	BlinkLogger.warn("keepAliveFailedTimes=" + this.keepAliveFailedTimes);
	if (this.keepAliveFailedTimes > BlinkConstant.KEEPALIVE_FAILEDTIMES_MAX) {
		this.keepAliveDisconnect();
	}
}
/**
 * 开始keepAlive
 * 
 */
BlinkEngine.prototype.startScheduleKeepAlive = function() {
	this.exitScheduleKeepAlive();
	this.exitScheduleKeepAliveTimer();
	
	var blinkEngine = this;
	blinkEngine.keepAlive(); // 立即执行1次
	blinkEngine.keepAliveInterval = setInterval(function() {
		blinkEngine.keepAlive();
	}, BlinkConstant.KEEPALIVE_INTERVAL);
}
/**
 * 停止keepAlive
 * 
 */
BlinkEngine.prototype.exitScheduleKeepAlive = function() {
	this.keepAliveFailedTimes = 0;
	if (this.keepAliveInterval != null) {
		clearInterval(this.keepAliveInterval);
		this.keepAliveInterval = null;
	}
}
/**
 * keepAlive未收到result计时器方法
 * 
 */
BlinkEngine.prototype.keepAliveTimerFunc = function() {
	this.keepAliveTimerCount++;
	if (this.keepAliveTimerCount > BlinkConstant.KEEPALIVE_TIMER_TIMEOUT_MAX / 3) {
		BlinkLogger.warn("keepAliveTimerCount=" + this.keepAliveTimerCount);
	} else {
		BlinkLogger.debug("keepAliveTimerCount=" + this.keepAliveTimerCount);
	}
	if (this.keepAliveTimerCount > BlinkConstant.KEEPALIVE_TIMER_TIMEOUT_MAX) {
		this.keepAliveDisconnect();
		return;
	}
	if (this.keepAliveTimerCount == BlinkConstant.KEEPALIVE_TIMER_TIMEOUT_RECONNECT) {
		// 断开本次连接，进行重连
		this.disconnect(true);
	}
}
/**
 * 开始keepAlive未收到result计时器
 * 
 */
BlinkEngine.prototype.startScheduleKeepAliveTimer = function() {
	if (this.keepAliveTimer == null) {
		var blinkEngine = this;
		// keepAlive5秒间隔，这个时候有可能已经断了5秒
		blinkEngine.keepAliveTimerCount += BlinkConstant.KEEPALIVE_INTERVAL / 1000;
		blinkEngine.keepAliveTimer = setInterval(function() {
			blinkEngine.keepAliveTimerFunc();
		}, BlinkConstant.KEEPALIVE_TIMER_INTERVAL);
	}
}
/**
 * 停止keepAlive未收到result计时器
 * 
 */
BlinkEngine.prototype.exitScheduleKeepAliveTimer = function() {
	this.keepAliveTimerCount = 0;
	if (this.keepAliveTimer != null) {
		clearInterval(this.keepAliveTimer);
		this.keepAliveTimer = null;
	}
}
/**
 * 与服务器断开
 * 
 */
BlinkEngine.prototype.keepAliveDisconnect = function() {
	this.clear();
	this.blinkEngineEventHandle.call('onConnectionStateChanged', {
		'connectionState' : BlinkConstant.ConnectionState.DISCONNECTED
	});
}
/** ----- keepAlive ---- */
/** ----- getStatsReport ---- */
/**
 * getStatsReport
 * 
 */
BlinkEngine.prototype.getStatsReport = function() {
	var pcClient = this.peerConnections[this.selfUserId];
	if (pcClient != null) {
		var pc = pcClient['pc'];
		var blinkEngine = this;
		pc.getStats(null, function(report) {
			blinkEngine.blinkConnectionStatsReport.parseStatsReport(report);
			if (blinkEngine.isSendLostReport) {
				BlinkLogger.info("onNetworkSentLost=" + 
						blinkEngine.blinkConnectionStatsReport.packetSendLossRate);
				// 上报丢包率信息，返回本地数据流的丢包率
				blinkEngine.blinkEngineEventHandle.call('onNetworkSentLost', {
					packetSendLossRate : blinkEngine.blinkConnectionStatsReport.packetSendLossRate
				});
			}
		}, function(error) {
			BlinkLogger.error("getStatsReport error: ", error);
		});
	}
}
/**
 * 开始getStatsReport
 * 
 */
BlinkEngine.prototype.startScheduleGetStatsReport = function() {
	this.exitScheduleGetStatsReport();

	this.blinkConnectionStatsReport = new BlinkConnectionStatsReport();
	var blinkEngine = this;
	blinkEngine.getStatsReportInterval = setInterval(function() {
		blinkEngine.getStatsReport();
	}, BlinkConstant.GETSTATSREPORT_INTERVAL);
}
/**
 * 停止getStatsReport
 * 
 */
BlinkEngine.prototype.exitScheduleGetStatsReport = function() {
	if (this.getStatsReportInterval != null) {
		clearInterval(this.getStatsReportInterval);
		this.getStatsReportInterval = null;
	}
	this.blinkConnectionStatsReport = null;
}
/** ----- getStatsReport ---- */
/** ----- 请求信令 ----- */
// /**
// * 请求logon信令
// *
// */
// BlinkEngine.prototype.logon = function() {
// this.sendMsg(BlinkConstant.SignalType.LOGON, this.token, {
// 'version' : BlinkConstant.LOGON_VERSION
// });
// }
// /**
// * 请求join信令
// *
// */
// BlinkEngine.prototype.join = function() {
// this.sendMsg(BlinkConstant.SignalType.JOIN, null, {
// 'key' : this.channelId,
// 'type' : this.userType
// });
// }
/**
 * 请求logonAndJoin信令
 * 
 */
BlinkEngine.prototype.logonAndJoin = function(status) {
	this.logonAndJoinStatus = (status == null || status == undefined ? 0 : status);
	this.offerStatus = null;
	this.sendMsg(BlinkConstant.SignalType.LOGONANDJOIN, this.token, {
		'key' : this.channelId,
		'type' : this.userType,
		'index' : this.localVideoEnable ? 1 : 0,
		'status' : this.logonAndJoinStatus,
		'version' : BlinkConstant.LOGON_VERSION
	});
}
/**
 * 请求channelPing信令
 * 
 */
BlinkEngine.prototype.channelPing = function() {
	this.sendMsg(BlinkConstant.SignalType.CHANNEL_PING, null, {
		'key' : this.channelId
	});
}
/**
 * 请求updateTalkType信令
 * 
 */
BlinkEngine.prototype.updateTalkType = function() {
	this.sendMsg(BlinkConstant.SignalType.UPDATETALKTYPE, null, {
		'key' : this.channelId,
		'index' : this.localVideoEnable ? 1 : 0
	});
}
/**
 * 请求leave信令
 * 
 */
BlinkEngine.prototype.leave = function() {
	this.sendMsg(BlinkConstant.SignalType.LEAVE, null, {
		'key' : this.channelId
	});
}
/**
 * 请求offer信令
 * 
 */
BlinkEngine.prototype.offer = function(desc, from) {
	this.sendMsg(BlinkConstant.SignalType.EXCHANGE, desc, {
		'key' : this.channelId,
		'type' : BlinkConstant.ExchangeType.OFFER,
		'to' : from
	});
}
/**
 * 请求answer信令
 * 
 */
BlinkEngine.prototype.answer = function(desc, from) {
	this.sendMsg(BlinkConstant.SignalType.EXCHANGE, desc, {
		'key' : this.channelId,
		'type' : BlinkConstant.ExchangeType.ANSWER,
		'to' : from
	});
}
/**
 * 请求candidate信令
 * 
 */
BlinkEngine.prototype.candidate = function(candidate, userId) {
	this.sendMsg(BlinkConstant.SignalType.EXCHANGE, candidate, {
		'key' : this.channelId,
		'type' : BlinkConstant.ExchangeType.CANDIDATE,
		'to' : userId
	});
}
/**
 * 请求白板信令
 * 
 */
BlinkEngine.prototype.ewb_create = function() {
	this.sendMsg(BlinkConstant.SignalType.EWB_CREATE, null, {
		'key' : this.channelId
	});
}
/**
 * 查询白板信令
 * 
 */
BlinkEngine.prototype.ewb_query = function() {
	this.sendMsg(BlinkConstant.SignalType.EWB_QUERY, null, {
		'key' : this.channelId
	});
}
/** ----- 请求信令 ----- */
/** ----- 处理应答信令 ----- */
/**
 * 处理join_result应答信令
 * 
 */
BlinkEngine.prototype.logonAndJoin_result = function(data) {
	var statusCode = data.parameters['statusCode'];
	var isJoined = statusCode == 'OK' ? true : false;
	if (isJoined) {
		var content = data.content; // 返回的结果是包含自己的
		var contentArr = content.split("],");
		var member = contentArr.length > 1 ? contentArr[1] : contentArr[0];
		var memberArr = eval(member);
		for ( var i in memberArr) {
			var userId = memberArr[i].userId;
			if (!this.joinedUsers.contains(userId)) {
				var userType = memberArr[i].type;
				var talkType = memberArr[i].talktype;
				var joinedUser = new Array();
				joinedUser.push(userType);
				joinedUser.push(talkType);
				joinedUser.push(null);
				this.joinedUsers.put(userId, joinedUser);
			}
		}
		// 开始keepAlive
		this.startScheduleKeepAlive();
		if (this.logonAndJoinStatus == BlinkConstant.LogonAndJoinStatus.RECONNECT) { // 断线重连，主动发offer
			var pcClient = this.peerConnections[this.selfUserId];
			if (pcClient != null) { // 只有一人时，值为null
				var pc = pcClient['pc'];
				BlinkLogger.warn("reLogonAndJoin createOffer");
				this.createOffer(pc, this.selfUserId, true);
			}
		}
	}
	if (this.logonAndJoinStatus == BlinkConstant.LogonAndJoinStatus.CONNECT // 正常加入
			|| (this.logonAndJoinStatus == BlinkConstant.LogonAndJoinStatus.RECONNECT && !isJoined) // 重连加入且加入失败
	) {
		this.blinkEngineEventHandle.call('onJoinComplete', {
			'isJoined' : isJoined
		});
	}
}
/**
 * 处理channelPing_result应答信令
 * 
 */
BlinkEngine.prototype.channelPing_result = function(data) {
	// 收到result，停止计时
	this.exitScheduleKeepAliveTimer();
	
	var statusCode = data.parameters['statusCode'];
	var isOK = statusCode == 'OK' ? true : false;
	if (!isOK) {
		this.keepAliveFailed();
	} else {
		// 重置keepAliveFailedTimes
		this.keepAliveFailedTimes = 0;
	}
}
/**
 * 处理leave_result应答信令
 * 
 */
BlinkEngine.prototype.leave_result = function(data) {
	var statusCode = data.parameters['statusCode'];
	var isLeft = statusCode == 'OK' ? true : false;
	if (isLeft) {
		this.clear();
	}
	this.blinkEngineEventHandle.call('onLeaveComplete', {
		'isLeft' : isLeft
	});
}
/**
 * 处理ewb_create_result应答信令
 * 
 */
BlinkEngine.prototype.ewb_create_result = function(data) {
	var statusCode = data.parameters['statusCode'];
	var isSuccess = statusCode == 'OK' ? true : false;
	var url = '';
	if (isSuccess) {
		url = data.content;
	}
	this.blinkEngineEventHandle.call('onWhiteBoardURL', {
		'isSuccess' : isSuccess,
		'url' : url // 观察者模式url返回为空
	});
}
/**
 * 处理ewb_query_result应答信令
 * 
 */
BlinkEngine.prototype.ewb_query_result = function(data) {
	var statusCode = data.parameters['statusCode'];
	var isSuccess = statusCode == 'OK' ? true : false;
	var url = '';
	if (isSuccess) {
		url = data.content;
	}
	this.blinkEngineEventHandle.call('onWhiteBoardQuery', {
		'isSuccess' : isSuccess,
		'url' : url // 当前会议没有白板url返回为空
	});
}
/** ----- 处理应答信令 ----- */
/** ----- 处理通知信令 ----- */
/**
 * 处理joined通知信令
 * 
 */
BlinkEngine.prototype.joined = function(data) {
	var userId = data.parameters['serverData'];
	var userType = data.parameters['type'];
	var talkType = data.parameters['index'];
	if (!this.joinedUsers.contains(userId)) {
		var joinedUser = new Array();
		joinedUser.push(userType);
		joinedUser.push(talkType);
		joinedUser.push(null);
		this.joinedUsers.put(userId, joinedUser);
	}
	if (userType == BlinkConstant.UserType.OBSERVER) {
		this.blinkEngineEventHandle.call('onUserJoined', { // 观察者模式
			userId : userId,
			userType : BlinkConstant.UserType.OBSERVER,
			talkType : talkType
		});
	}
}
/**
 * 处理update_talktype通知信令
 * 
 */
BlinkEngine.prototype.update_talktype = function(data) {
	var userId = data.parameters['serverData'];
	var userType = data.parameters['type'];
	var talkType = data.parameters['index'];
	this.blinkEngineEventHandle.call('onUserUpdatedTalkType', {
		userId : userId,
		userType : userType,
		talkType : talkType
	});
};
/**
 * 处理left通知信令
 * 
 */
BlinkEngine.prototype.left = function(data) {
	var userId = data.parameters['serverData'];
	var userType = data.parameters['type'];
	if (userType == BlinkConstant.UserType.NORMAL) {
		for ( var i in this.remoteStreams) {
			if (this.remoteStreams[i].id == userId) {
				this.remoteStreams.splice(i, 1);
				break;
			}
		}
	}
	this.joinedUsers.remove(userId);
	this.remoteCnameMap.remove(userId);
	if (this.joinedUsers.size() == 1) { // 当没有其它用户在会议时
		// 重置offerStatus状态
		this.offerStatus = null;
		// 关闭连接
		this.closePeerConnection(this.selfUserId);
	}
	this.blinkEngineEventHandle.call('onUserLeft', {
		userId : userId,
		userType : userType
	});
}
/**
 * 建立连接
 * 
 */
BlinkEngine.prototype.preparePeerConnection = function(userId) {
	BlinkLogger.info("preparePeerConnection userId=" + userId);
	var blinkEngine = this;
	if (blinkEngine.peerConnections[userId] == null) {
		var pc = new RTCPeerConnection();
		pc.onaddstream = function(evt) {
			BlinkLogger.debug("onaddstream", evt);
			
			blinkEngine.remoteStreams.push(evt.stream);
			var joinedUser = blinkEngine.joinedUsers.get(evt.stream.id);
			joinedUser.splice(2, 1, evt.stream);
			var talkType = joinedUser[1];
			blinkEngine.blinkEngineEventHandle.call('onUserJoined', { // 普通模式
				userId : evt.stream.id,
				userType : BlinkConstant.UserType.NORMAL,
				talkType : talkType
			});
		};

		pc.onremovestream = function(evt) {
			BlinkLogger.debug("onremovestream", evt);
		};

		pc.ontrack = null;

		pc.onsignalingstatechange = function(evt) {
			BlinkLogger.debug("onsignalingstatechange", evt);
		};

		pc.oniceconnectionstatechange = function(evt) {
			BlinkLogger.debug("oniceconnectionstatechange", evt);
			BlinkLogger.warn("pc.iceConnectionState=" + pc.iceConnectionState);
			
			if (pc.iceConnectionState == 'failed') {
				if (blinkEngine.wsConnectionState == BlinkConstant.wsConnectionState.CONNECTED) { // ws连接可用
					BlinkLogger.warn("oniceconnectionstatechange createOffer");
					blinkEngine.createOffer(pc, userId, true);
				}
			}
		};

		pc.onnegotiationneeded = null;
		pc.ondatachannel = null;

		pc.onicecandidate = function(evt) {
			BlinkLogger.debug("onicecandidate", evt);
			
			handle(pc, evt);
			function handle(pc, evt) {
				if ((pc.signalingState || pc.readyState) == 'stable'
						&& blinkEngine.peerConnections[userId]['rem'] == true) {
					if (evt.candidate) {
						blinkEngine.candidate(JSON.stringify(evt.candidate),
								userId);
					}
					return;
				}
				setTimeout(function() {
					handle(pc, evt);
				}, 2 * 1000);
			}
		};
		blinkEngine.peerConnections[userId] = {}
		blinkEngine.peerConnections[userId]['pc'] = pc;
		blinkEngine.peerConnections[userId]['rem'] = false;
		
		// peerConnection创建成功，开始getStatsReport
		blinkEngine.startScheduleGetStatsReport();
	}
	return blinkEngine.peerConnections[userId];
};
/**
 * 关闭连接
 * 
 */
BlinkEngine.prototype.closePeerConnection = function(userId) {
	if (this.peerConnections[userId] != null) {
		this.peerConnections[userId]['pc'].close();
		this.peerConnections[userId] = null;
	}
	// peerConnection关闭，停止getStatsReport
	this.exitScheduleGetStatsReport();
}
/**
 * 处理OfferRequest通知信令
 * 
 */
BlinkEngine.prototype.offerRequest = function(data) {
	var from = data.parameters['serverData'];
	
	var pcClient = this.preparePeerConnection(from);
	var pc = pcClient['pc'];
	if (this.userType == BlinkConstant.UserType.NORMAL) {
		pc.addStream(this.localStream);
	}
	BlinkLogger.warn("offerRequest createOffer");
	this.createOffer(pc, from, false);
};
/**
 * 处理exchange通知信令
 * 
 */
BlinkEngine.prototype.exchange = function(data) {
	var type = data.parameters['type'];
	if (type == BlinkConstant.ExchangeType.OFFER) {
		this.handleOffer(data);
	} else if (type == BlinkConstant.ExchangeType.ANSWER) {
		this.handleAnswer(data);
	} else if (type == BlinkConstant.ExchangeType.CANDIDATE) {
		this.handleCandidate(data);
	}
};
/**
 * handle offer
 * 
 */
BlinkEngine.prototype.handleOffer = function(data) {
	if (this.offerStatus == BlinkConstant.OfferStatus.SENDING) {
		BlinkLogger.warn("handleOffer offerStatus sending");
		return;
	}
	
	var from = data.parameters['from'];
	var desc = JSON.parse(data.content.replace(new RegExp('\'', 'g'), '"'));
	// set bandwidth
	desc.sdp = BlinkUtil.setBandWidth(desc.sdp, this.bandWidth);

	var pcClient = this.preparePeerConnection(from);
	var pc = pcClient['pc'];
	if (this.userType == BlinkConstant.UserType.NORMAL) {
		pc.addStream(this.localStream);
	}
	var blinkEngine = this;
	pc.setRemoteDescription(new RTCSessionDescription(desc), function() {
		BlinkLogger.info("handleOffer setRemoteDescription success");
		blinkEngine.offerStatus = BlinkConstant.OfferStatus.DONE;
		// set remote cname map
		blinkEngine.setRemoteCnameMap(desc.sdp);
		pcClient['rem'] = true;
		pc.createAnswer(function(desc2) {
			BlinkLogger.info("createAnswer success");
			pc.setLocalDescription(desc2, function() {
				BlinkLogger.info("createAnswer setLocalDescription success");
				blinkEngine.answer(JSON.stringify(desc2), from);
			}, function(error) {
				BlinkLogger.error("createAnswer setLocalDescription error: ", error);
			});
		}, function(error) {
			BlinkLogger.error("createAnswer error: ", error);
		}, blinkEngine.getSdpMediaConstraints(false));
	}, function(error) {
		BlinkLogger.error("handleOffer setRemoteDescription error: ", error);
	});
};
/**
 * handle answer
 * 
 */
BlinkEngine.prototype.handleAnswer = function(data) {
	if (this.offerStatus == BlinkConstant.OfferStatus.DONE) { // 已经设置过一次SDP，放弃本次设置
		BlinkLogger.warn("handleAnswer offerStatus done");
		return;
	}
	
	var from = data.parameters['from'];
	var desc = JSON.parse(data.content.replace(new RegExp('\'', 'g'), '"'));
	// set bandwidth
	desc.sdp = BlinkUtil.setBandWidth(desc.sdp, this.bandWidth);

	var pcClient = this.preparePeerConnection(from);
	var pc = pcClient['pc'];
	var blinkEngine = this;
	pc.setRemoteDescription(new RTCSessionDescription(desc), function() {
		BlinkLogger.info("handleAnswer setRemoteDescription success");
		blinkEngine.offerStatus = BlinkConstant.OfferStatus.DONE;
		// set remote cname map
		blinkEngine.setRemoteCnameMap(desc.sdp);
		pcClient['rem'] = true;
	}, function(error) {
		BlinkLogger.error("handleAnswer setRemoteDescription error: ", error);
	});
};
/**
 * handle candidate
 * 
 */
BlinkEngine.prototype.handleCandidate = function(data) {
	var from = data.parameters['from'];
	var desc = JSON.parse(data.content.replace(new RegExp('\'', 'g'), '"'))

	var pcClient = this.preparePeerConnection(from);
	var pc = pcClient['pc'];
	pc.addIceCandidate(new RTCIceCandidate(desc), function() {
		BlinkLogger.info("addIceCandidate success");
	}, function(error) {
		BlinkLogger.error("addIceCandidate error: ", error);
	});
}
/**
 * create offer
 * 
 */
BlinkEngine.prototype.createOffer = function(pc, userId, isIceRestart) {
	if (this.offerStatus == BlinkConstant.OfferStatus.SENDING) { // 已经创建过Offer，本次不创建
		BlinkLogger.warn("createOffer offerStatus sending");
		return;
	}
	BlinkLogger.info("createOffer userId=" + userId);
	var blinkEngine = this;
	pc.createOffer(function(desc) {
		BlinkLogger.info("createOffer success");
		// change streamId use userId
		desc.sdp = BlinkUtil.changeStreamId(desc.sdp,
				blinkEngine.localStream.id, blinkEngine.selfUserId);
		// 替换video参数
		desc.sdp = BlinkUtil.changeVideoDesc(desc.sdp);
		pc.setLocalDescription(desc, function() {
			BlinkLogger.info("createOffer setLocalDescription success");
			blinkEngine.offerStatus = BlinkConstant.OfferStatus.SENDING;
			blinkEngine.offer(JSON.stringify(desc), userId);
		}, function(error) {
			BlinkLogger.error("createOffer setLocalDescription error: ", error);
		});
	}, function(error) {
		BlinkLogger.error("createOffer error: ", error);
	}, blinkEngine.getSdpMediaConstraints(isIceRestart));
}
/**
 * 设置sdp属性
 * 
 */
BlinkEngine.prototype.getSdpMediaConstraints = function(isIceRestart) {
//	if (this.userType == BlinkConstant.UserType.OBSERVER) { // 观察者模式
//		if (this.mediaConfig.sdpConstraints == null) {
//			this.mediaConfig.sdpConstraints = {};
//		}
//		if (this.mediaConfig.sdpConstraints.mandatory == null) {
//			this.mediaConfig.sdpConstraints.mandatory = {};
//		}
//		this.mediaConfig.sdpConstraints.mandatory.OfferToReceiveAudio = true;
//		this.mediaConfig.sdpConstraints.mandatory.OfferToReceiveVideo = true;
//	}

	var sdpMediaConstraints = {};
	sdpMediaConstraints.mandatory = {};
	// 统一设置，包含观察者模式和普通模式无摄像头情况
	sdpMediaConstraints.mandatory.OfferToReceiveAudio = true;
	sdpMediaConstraints.mandatory.OfferToReceiveVideo = true;
	// IceRestart
	BlinkLogger.warn("isIceRestart=" + isIceRestart);
	sdpMediaConstraints.mandatory.IceRestart = isIceRestart;
	return sdpMediaConstraints;
}
/**
 * 设置remote cname map
 * 
 */
BlinkEngine.prototype.setRemoteCnameMap = function(sdp) {
	var userArr = this.joinedUsers.getEntrys();
	for ( var i in userArr) {
		var userId = userArr[i].key;
		if (userId == this.selfUserId) { // 不是远端
			continue;
		}
		if (!this.remoteCnameMap.contains(userId)) {
			var cname = BlinkUtil.getCname(sdp, userId);
			if (cname != null && cname != "") {
				this.remoteCnameMap.put(userId, cname);
			}
		} else {
			var cname = this.remoteCnameMap.get(userId);
			if (cname != null && cname != ""
					&& !BlinkUtil.isHasCname(sdp, cname)) {
				var newCname = BlinkUtil.getCname(sdp, userId);
				if (newCname != null && newCname != "") {
					this.remoteCnameMap.put(userId, newCname);
					// userId不变，cname变化，视为客户端杀进程后重连，刷新远端视频流
					BlinkUtil.refreshMediaStream(userId);
				}
			}
		}
	}
}
/** ----- 处理通知信令 ----- */
//
// return BlinkEngine;
// });
/** ----- BlinkEngine ----- */

/** ----- BlinkEngineEventHandle ----- */
// var BlinkEngineEventHandle = (function() {
/**
 * 构造函数
 * 
 */
var BlinkEngineEventHandle = function(config) {
	/** 事件集合 */
	this.eventHandles = {};
	return this;
}
/**
 * 绑定事件
 * 
 */
BlinkEngineEventHandle.prototype.on = function(eventName, event) {
	this.eventHandles[eventName] = event;
};
/**
 * 调用事件
 * 
 */
BlinkEngineEventHandle.prototype.call = function(eventName, data) {
	for ( var eventHandle in this.eventHandles) {
		if (eventName === eventHandle) {
			return this.eventHandles[eventName](data);
		}
	}
	BlinkLogger.info('EventHandle ' + eventName + ' do not have defined function');
};
//
// return BlinkEngineEventHandle;
// });
/** ----- BlinkEngineEventHandle ----- */

/** ----- BlinkConnectionStatsReport ----- */
var BlinkConnectionStatsReport = function() {
	this.statsReportSend = {};
	this.statsReportRecvs = new Array();
	this.packetSendLossRate = 0;
}
/**
 * parse statsReport
 * 
 */
BlinkConnectionStatsReport.prototype.parseStatsReport = function(report) {
	var packetsSent = this.statsReportSend.packetsSent;
	packetsSent = (packetsSent == null || packetsSent == "") ? 0 : packetsSent;
	var packetsLost = this.statsReportSend.packetsLost;
	packetsLost = (packetsLost == null || packetsLost == "") ? 0 : packetsLost;
	var packetSendLossRate = 0;

	var statsReportSend = {};
	var statsReportRecvs = new Array();
	for ( var i in report) {
		var now = report[i];
		if (now.type == 'ssrc' && now.mediaType == 'video') {
			if (now.id.indexOf("recv") != -1) {
				var statsReportRecv = {};
				statsReportRecv.googTrackId = now.googTrackId;
				statsReportRecv.googCodecName = now.googCodecName
				statsReportRecv.googCurrentDelayMs = now.googCurrentDelayMs;
				statsReportRecv.googDecodeMs = now.googDecodeMs;
				statsReportRecv.googFrameHeightReceived = now.googFrameHeightReceived;
				statsReportRecv.googFrameRateDecoded = now.googFrameRateDecoded;
				statsReportRecv.googFrameRateOutput = now.googFrameRateOutput;
				statsReportRecv.googFrameRateReceived = now.googFrameRateReceived;
				statsReportRecv.googFrameWidthReceived = now.googFrameWidthReceived;
				statsReportRecv.packetsLost = now.packetsLost;
				statsReportRecv.packetsReceived = now.packetsReceived;

				statsReportRecvs.push(statsReportRecv);
			} else if (now.id.indexOf("send") != -1) {
				statsReportSend.googCodecName = now.googCodecName;
				statsReportSend.googAvgEncodeMs = now.googAvgEncodeMs;
				statsReportSend.googFrameHeightInput = now.googFrameHeightInput;
				statsReportSend.googFrameHeightSent = now.googFrameHeightSent;
				statsReportSend.googFrameRateSent = now.googFrameRateSent;
				statsReportSend.googFrameWidthInput = now.googFrameWidthInput;
				statsReportSend.googFrameWidthSent = now.googFrameWidthSent;
				statsReportSend.googFrameRateInput = now.googFrameRateInput;
				statsReportSend.packetsLost = now.packetsLost;
				statsReportSend.packetsSent = now.packetsSent;

				if (statsReportSend.packetsLost != null
						&& statsReportSend.packetsLost != ""
						&& statsReportSend.packetsSent != null
						&& statsReportSend.packetsSent != ""
						&& (statsReportSend.packetsSent - packetsSent != 0)) {
					packetSendLossRate = (statsReportSend.packetsLost - packetsLost)
							* 100 / (statsReportSend.packetsSent - packetsSent);
				}
			}
		}
	}
	// 重置
	this.statsReportSend = null;
	this.statsReportRecvs = null;
	this.packetSendLossRate = 0;
	this.statsReportSend = statsReportSend;
	this.statsReportRecvs = statsReportRecvs;
	BlinkLogger.debug("packetSendLossRate=" + packetSendLossRate);
	this.packetSendLossRate = parseInt(packetSendLossRate);
	BlinkLogger.debug("this.packetSendLossRate=" + this.packetSendLossRate);
}
/** ----- BlinkConnectionStatsReport ----- */

/** ----- BlinkVideoView ----- */
var BlinkVideoView = function() {

}

/** ----- BlinkUtil ---- */
var BlinkUtil = {
	/**
	 * 获取websocket地址列表
	 * 
	 */
	getWsUrlList : function(wsNavUrl, callback) {
		var wsUrlList;
		BlinkAjax({
			type : "GET",
			url : wsNavUrl,
			async : true,
			data : {
				rand : Math.random()
			},
			dataType : "JSON",
			success : function(data) {
				callback(data);
			},
			error : function(error) {
				BlinkLogger.error("request nav error: ", error);
				throw error;
			}
		});
	},
	/**
	 * SDP设置带宽
	 * 
	 * @param sdp
	 * @param bandWidthParam
	 * @returns
	 */
	setBandWidth : function(sdp, bandWidthParam) {
		// 给带宽设置增加计数器，使每次设置的最小码率不同，防止码率一样WebRTC将码率重置成默认最小值
		BlinkGlobal.bandWidthCount++;
		var currentBandWidth = JSON.parse(JSON.stringify(bandWidthParam));
		if (BlinkGlobal.bandWidthCount % 2 == 0) {
			currentBandWidth.min = currentBandWidth.min + 1;
		}
		
		// set BAS
		sdp = sdp.replace(/a=mid:video\n/g, 'a=mid:video\nb=AS:'
				+ currentBandWidth.max + '\n');
		
		// 查找最优先用的视频代码
		var sep1 = "\n";
		var findStr1 = "m=video";
		
		var sdpArr = sdp.split(sep1);
		// 查找findStr1
		var findIndex1 = BlinkUtil.findLine(sdpArr, findStr1);
		if (findIndex1 == null) {
			return sdp;
		}
		
		var sep2 = " ";
		
		var videoDescArr1 = sdpArr[findIndex1].split(sep2);
		// m=video 9 UDP/TLS/RTP/SAVPF
		var firstVideoCode = videoDescArr1[3];
		var findStr2 = "a=rtpmap:" + firstVideoCode;
		// 查找findStr2
		var findIndex2 = BlinkUtil.findLine(sdpArr, findStr2);
		if (findIndex2 == null) {
			return sdp;
		}
		
		var appendStr = 'a=fmtp:' + firstVideoCode + ' x-google-min-bitrate=' + currentBandWidth.min
		// + '; x-google-max-bitrate=' + currentBandWidth.max
		// + '; x-google-start-bitrate=' + currentBandWidth.start + sep1;
		+ '; x-google-max-bitrate=' + currentBandWidth.max;
		sdpArr[findIndex2] = sdpArr[findIndex2].concat(sep1 + appendStr);
		
		return sdpArr.join(sep1);
	},
	/**
	 * SDP修改stream id
	 * 
	 * @param sdp
	 * @param oldId
	 * @param newId
	 * @returns
	 */
	changeStreamId : function(sdp, oldId, newId) {
		sdp = sdp.replace(new RegExp(oldId, 'g'), newId);
		return sdp;
	},
	/**
	 * SDP修改video兼容参数
	 * 
	 * @param sdp
	 * @returns
	 */
	changeVideoDesc : function(sdp) {
//		var videoDesc1 = "m=video 9 RTP/AVPF 98 96 100 127 125 97 99 101";
//		var videoDesc2 = "a=rtpmap:96 VP8/90000\r\na=rtcp-fb:96 ccm fir\r\na=rtcp-fb:96 nack\r\na=rtcp-fb:96 nack pli\r\na=rtcp-fb:96 goog-remb\r\na=rtcp-fb:96 transport-cc\r\na=rtpmap:98 H264/90000\r\na=rtcp-fb:98 ccm fir\r\na=rtcp-fb:98 nack\r\na=rtcp-fb:98 nack pli\r\na=rtcp-fb:98 goog-remb\r\na=rtcp-fb:98 transport-cc\r\na=fmtp:98 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r\na=rtpmap:100 red/90000\r\na=rtpmap:127 ulpfec/90000\r\na=rtpmap:125 flexfec-03/90000\r\na=rtcp-fb:125 transport-cc\r\na=rtcp-fb:125 goog-remb\r\na=fmtp:125 repair-window=10000000\r\na=rtpmap:97 rtx/90000\r\na=fmtp:97 apt=96\r\na=rtpmap:99 rtx/90000\r\na=fmtp:99 apt=98\r\na=rtpmap:101 rtx/90000\r\na=fmtp:101 apt=100";
//		
//		var findStr1 = "m=video";
//		var findStr2 = "a=rtcp-rsize";
//		var findStr3 = "a=ssrc-group";
//		
//		var sdpArr = sdp.split('\r\n');
//		// 查找videoDesc1
//		var findIndex1 = BlinkUtil.findLine(sdpArr, findStr1);
//		// 替换videoDesc1
//		sdpArr[findIndex1] = videoDesc1;
//		// 查找videoDesc2
//		var findIndex2 = BlinkUtil.findLine(sdpArr, findStr2);
//		var findIndex3 = BlinkUtil.findLine(sdpArr, findStr3);
//		// 删除中间的元素
//		sdpArr.splice(findIndex2 + 1, findIndex3 - findIndex2 - 1);
//		// 替换videoDesc2
//		sdpArr[findIndex2] = sdpArr[findIndex2].concat('\r\n' + videoDesc2);
//		return sdpArr.join('\r\n');
	
		var sep1 = "\r\n";
		var findStr1 = "m=video";
		
		var sdpArr = sdp.split(sep1);
		// 查找videoDesc1
		var findIndex1 = BlinkUtil.findLine(sdpArr, findStr1);
		if (findIndex1 == null) {
			return sdp;
		}
		
		var h264_code = "98";
		var vp8_code = "96";
		var red_code = "100"
		var ulpfec_code = "127";
		var flexfec_code = "125";
		var h264_rtx_code = "99";
		var vp8_rtx_code = "97";
		var red_rtx_code = "101"
	
		var h264_search = "H264/90000";
		var vp8_search = "VP8/90000";
		var red_search = "red/90000";
		var ulpfec_search = "ulpfec/90000";
		var flexfec_search = "flexfec-03/90000";
	
		var h264_replace = "a=rtpmap:98 H264/90000\r\na=rtcp-fb:98 ccm fir\r\na=rtcp-fb:98 nack\r\na=rtcp-fb:98 nack pli\r\na=rtcp-fb:98 goog-remb\r\na=rtcp-fb:98 transport-cc\r\na=fmtp:98 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r\na=rtpmap:99 rtx/90000\r\na=fmtp:99 apt=98";
		var vp8_replace = "a=rtpmap:96 VP8/90000\r\na=rtcp-fb:96 ccm fir\r\na=rtcp-fb:96 nack\r\na=rtcp-fb:96 nack pli\r\na=rtcp-fb:96 goog-remb\r\na=rtcp-fb:96 transport-cc\r\na=rtpmap:97 rtx/90000\r\na=fmtp:97 apt=96";
		var red_replace = "a=rtpmap:100 red/90000\r\na=rtpmap:101 rtx/90000\r\na=fmtp:101 apt=100";
		var ulpfec_replace = "a=rtpmap:127 ulpfec/90000";
		var flexfec_replace = "a=rtpmap:125 flexfec-03/90000\r\na=rtcp-fb:125 transport-cc\r\na=rtcp-fb:125 goog-remb\r\na=fmtp:125 repair-window=10000000";
	
		var sep2 = " ";
		var findStr2 = "a=rtpmap";
		var findStr3 = "a=ssrc-group";
		
		var videoDescArr1 = sdpArr[findIndex1].split(sep2);
		// m=video 9 UDP/TLS/RTP/SAVPF
		var videoReplace1 = videoDescArr1[0] + sep2 + videoDescArr1[1] + sep2
				+ videoDescArr1[2];
		// 查找videoDesc2
		var findIndex2 = BlinkUtil.findLineInRange(sdpArr, findStr2, findIndex1 + 1, sdpArr.length - 1);
		var findIndex3 = BlinkUtil.findLineInRange(sdpArr, findStr3, findIndex2 + 1, sdpArr.length - 1);
		if (findIndex3 == null) { // 观察者模式没有findStr3相关信息
			findIndex3 = sdpArr.length - 1;
		}
		// 删除中间的元素
		var removeArr = sdpArr.splice(findIndex2, findIndex3 - findIndex2);
		
		// 查找H264
		var h264_index = BlinkUtil.findLine(removeArr, h264_search);
		// 查找VP8
		var vp8_index = BlinkUtil.findLine(removeArr, vp8_search);
		// 查找red
		var red_index = BlinkUtil.findLine(removeArr, red_search);
		// 查找ulpfec
		var ulpfec_index = BlinkUtil.findLine(removeArr, ulpfec_search);
		// 查找flexfec
		var flexfec_index = BlinkUtil.findLine(removeArr, flexfec_search);
	
		var videoReplace2 = "";
		if (h264_index != null) {
			videoReplace1 += sep2 + h264_code;
			videoReplace2 += sep1 + h264_replace;
		}
		if (vp8_index != null) {
			videoReplace1 += sep2 + vp8_code;
			videoReplace2 += sep1 + vp8_replace;
		}
		if (red_index != null) {
			videoReplace1 += sep2 + red_code;
			videoReplace2 += sep1 + red_replace;
		}
		if (ulpfec_index != null) {
			videoReplace1 += sep2 + ulpfec_code;
			videoReplace2 += sep1 + ulpfec_replace;
		}
		if (flexfec_index != null) {
			videoReplace1 += sep2 + flexfec_code;
			videoReplace2 += sep1 + flexfec_replace;
		}
		if (h264_index != null) {
			videoReplace1 += sep2 + h264_rtx_code;
		}
		if (vp8_index != null) {
			videoReplace1 += sep2 + vp8_rtx_code;
		}
		if (red_index != null) {
			videoReplace1 += sep2 + red_rtx_code;
		}
	
		// 替换videoDesc1
		sdpArr[findIndex1] = videoReplace1;
		// 替换videoDesc2
		sdpArr[findIndex2 - 1] = sdpArr[findIndex2 - 1].concat(videoReplace2);
		
		return sdpArr.join(sep1);
	},
	/**
	 * get cname
	 * 
	 * @param userId
	 */
	getCname : function(sdp, userId) {
		var sep1 = "\n";
		var sep2 = " ";
		var sdpArr = sdp.split(sep1);
		
		// a=ssrc:702269835 msid:A9532881-B4CA-4B23-B219-9837CE93AA70 4716df1f-046f-4b96-a260-2593048d7e9e
		var msid_search = "msid:" + userId;
		var msid_index = BlinkUtil.findLine(sdpArr, msid_search);
		if (msid_index == null) {
			return null;
		}
		var ssrc = sdpArr[msid_index].split(sep2)[0];

		// a=ssrc:702269835 cname:wRow2WLrs18ZB3Dg
		var cname_search = ssrc + " cname:";
		var cname_index = BlinkUtil.findLine(sdpArr, cname_search);
		var cname = sdpArr[cname_index].split("cname:")[1];
		return cname;
	},
	/**
	 * check cname
	 * 
	 * @param userId
	 */
	isHasCname : function(sdp, cname) {
		var sep1 = "\n";
		var sdpArr = sdp.split(sep1);

		// a=ssrc:702269835 cname:wRow2WLrs18ZB3Dg
		var cname_search = "cname:" + cname;
		var cname_index = BlinkUtil.findLine(sdpArr, cname_search);
		return cname_index != null;
	},
	/**
	 * 数组中查找
	 * 
	 * @param arr
	 * @param substr
	 * @returns
	 */
	findLine : function(arr, substr) {
		for (var i = 0; i < arr.length; i++) {
			if (arr[i].indexOf(substr) != -1) {
				return i;
			}
		}
		return null;
	},
	/**
	 * 数组中查找
	 * 
	 * @param arr
	 * @param substr
	 * @param startIndex
	 * @param endIndex
	 * @returns
	 */
	findLineInRange : function(arr, substr, startIndex, endIndex) {
		var start = (startIndex == null || startIndex == '' || startIndex < 0) ? 0
				: startIndex;
		var end = (endIndex == null || endIndex == '' || endIndex < 0 || endIndex > arr.length - 1) ? arr.length - 1
				: endIndex;
		start = start > end ? end : start;
		for (var i = start; i <= end; i++) {
			if (arr[i].indexOf(substr) != -1) {
				return i;
			}
		}
		return null;
	},
	/**
	 * 随机打乱数组内排序
	 * 
	 * @param input
	 * @returns
	 */
	shuffle : function(input) {
		for (var i = input.length - 1; i >= 0; i--) {
			var randomIndex = Math.floor(Math.random() * (i + 1));
			var itemAtIndex = input[randomIndex];
			input[randomIndex] = input[i];
			input[i] = itemAtIndex;
		}
		return input;
	},
	/**
	 * 刷新VideoView的视频流
	 * 
	 * @param userId
	 */
	refreshMediaStream : function(userId) {
		var videoView = document.getElementById(userId);
		if (videoView != null) {
			videoView.srcObject = videoView.srcObject
		}
	}
}

/** ----- BlinkAjax ----- */
var BlinkAjax = function(opt) {
	opt.type = opt.type.toUpperCase() || 'POST';
	if (opt.type === 'POST') {
		post(opt);
	} else {
		get(opt);
	}

	// 初始化数据
	function init(opt) {
		var optAdapter = {
			url : '',
			type : 'GET',
			data : {},
			async : true,
			dataType : 'JSON',
			success : function() {
			},
			error : function(s) {
				// alert('status:' + s + 'error!');
			}
		}
		opt.url = opt.url || optAdapter.url;
		opt.type = opt.type.toUpperCase() || optAdapter.method;
		opt.data = params(opt.data) || params(optAdapter.data);
		opt.dataType = opt.dataType.toUpperCase() || optAdapter.dataType;
		// opt.async = opt.async || optAdapter.async;
		opt.success = opt.success || optAdapter.success;
		opt.error = opt.error || optAdapter.error;
		return opt;
	}
	// 创建XMLHttpRequest对象
	function createXHR() {
		if (window.XMLHttpRequest) { // IE7+、Firefox、Opera、Chrome、Safari
			return new XMLHttpRequest();
		} else if (window.ActiveXObject) { // IE6 及以下
			var versions = [ 'MSXML2.XMLHttp', 'Microsoft.XMLHTTP' ];
			for (var i = 0, len = versions.length; i < len; i++) {
				try {
					return new ActiveXObject(version[i]);
					break;
				} catch (e) {
					// 跳过
				}
			}
		} else {
			throw new Error('浏览器不支持XHR对象！');
		}
	}
	function params(data) {
		var arr = [];
		for ( var i in data) {
			// 特殊字符传参产生的问题可以使用encodeURIComponent()进行编码处理
			arr.push(encodeURIComponent(i) + '=' + encodeURIComponent(data[i]));
		}
		return arr.join('&');
	}
	function callback(opt, xhr) {
		if (xhr.readyState == 4 && xhr.status == 200) { // 判断http的交互是否成功，200表示成功
			var returnValue;
			switch (opt.dataType) {
			case "XML":
				returnValue = xhr.responseXML;
				break;
			case "JSON":
				var jsonText = xhr.responseText;
				if (jsonText) {
					returnValue = eval("(" + jsonText + ")");
				}
				break;
			default:
				returnValue = xhr.responseText;
				break;
			}
			if (returnValue) {
				opt.success(returnValue);
			}
		} else {
			// alert('获取数据错误！错误代号：' + xhr.status + '，错误信息：' +
			// xhr.statusText);
			opt.error(xhr);
		}

	}
	// post方法
	function post(opt) {
		var xhr = createXHR(); // 创建XHR对象
		var opt = init(opt);
		opt.type = 'post';
		if (opt.async === true) { // true表示异步，false表示同步
			// 使用异步调用的时候，需要触发readystatechange 事件
			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4) { // 判断对象的状态是否交互完成
					callback(opt, xhr); // 回调
				}
			};
		}
		// 在使用XHR对象时，必须先调用open()方法，
		// 它接受三个参数：请求类型(get、post)、请求的URL和表示是否异步。
		xhr.open(opt.type, opt.url, opt.async);
		// post方式需要自己设置http的请求头，来模仿表单提交。
		// 放在open方法之后，send方法之前。
		xhr.setRequestHeader('Content-Type',
				'application/x-www-form-urlencoded;charset=utf-8');
		xhr.send(opt.data); // post方式将数据放在send()方法里
		if (opt.async === false) { // 同步
			callback(opt, xhr); // 回调
		}
	}
	// get方法
	function get(opt) {
		var xhr = createXHR(); // 创建XHR对象
		var opt = init(opt);
		opt.type = 'get';
		if (opt.async === true) { // true表示异步，false表示同步
			// 使用异步调用的时候，需要触发readystatechange 事件
			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4) { // 判断对象的状态是否交互完成
					callback(opt, xhr); // 回调
				}
			};
		}
		// 若是GET请求，则将数据加到url后面
		opt.url += opt.url.indexOf('?') == -1 ? '?' + opt.data : '&' + opt.data;
		// 在使用XHR对象时，必须先调用open()方法，
		// 它接受三个参数：请求类型(get、post)、请求的URL和表示是否异步。
		xhr.open(opt.type, opt.url, opt.async);
		xhr.send(null); // get方式则填null
		if (opt.async === false) { // 同步
			callback(opt, xhr); // 回调
		}
	}
}

/** ----- BlinkMap ----- */
var BlinkMap = function() {
	this._entrys = new Array();

	this.put = function(key, value) {
		if (key == null || key == undefined) {
			return;
		}
		var index = this._getIndex(key);
		if (index == -1) {
			var entry = new Object();
			entry.key = key;
			entry.value = value;
			this._entrys[this._entrys.length] = entry;
		} else {
			this._entrys[index].value = value;
		}
	};
	this.get = function(key) {
		var index = this._getIndex(key);
		return (index != -1) ? this._entrys[index].value : null;
	};
	this.remove = function(key) {
		var index = this._getIndex(key);
		if (index != -1) {
			this._entrys.splice(index, 1);
		}
	};
	this.clear = function() {
		this._entrys.length = 0;
	};
	this.contains = function(key) {
		var index = this._getIndex(key);
		return (index != -1) ? true : false;
	};
	this.size = function() {
		return this._entrys.length;
	};
	this.getEntrys = function() {
		return this._entrys;
	};
	this._getIndex = function(key) {
		if (key == null || key == undefined) {
			return -1;
		}
		var _length = this._entrys.length;
		for (var i = 0; i < _length; i++) {
			var entry = this._entrys[i];
			if (entry == null || entry == undefined) {
				continue;
			}
			if (entry.key === key) {// equal
				return i;
			}
		}
		return -1;
	};
}

/** ----- BlinkException ----- */
var BlinkException = function(code, message) {
	this.code = code;
	this.message = message;
}

/** ----- BlinkLogger ----- */
var BlinkLogger = {
	/**
	 * debug
	 * 
	 */
	debug : function(message, data) {
		console.debug(new Date() + " DEBUG " + message);
		if (data != null && data != undefined) {
			console.debug(data);
		}
	},
	/**
	 * info
	 * 
	 */
	info : function(message, data) {
		console.info(new Date() + " INFO " + message);
		if (data != null && data != undefined) {
			console.info(data);
		}
	},
	/**
	 * log
	 * 
	 */
	log : function(message, data) {
		console.log(new Date() + " LOG " + message);
		if (data != null && data != undefined) {
			console.log(data);
		}
	},
	/**
	 * warn
	 * 
	 */
	warn : function(message, data) {
		console.warn(new Date() + " WARN " + message);
		if (data != null && data != undefined) {
			console.warn(data);
		}
	},
	/**
	 * error
	 * 
	 */
	error : function(message, error) {
		console.error(new Date() + " ERROR " + message);
		if (error != null && error != undefined) {
			console.error(error);
		}
	}
}