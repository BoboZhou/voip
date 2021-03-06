"use strict";;
(function(dependencies) {
    var KurentoRoom = dependencies.KurentoRoom;
    var global = dependencies.win;
    var util = global._;

    var config = {
        ices: [{
            urls: 'turn:119.254.101.80:3478',
            credential: 'test',
            username: 'test'
        }]
    };

    var videoRoom, localStream;

    /*
        var callback = function(error, result){
            // result => {type: 'added', data: stream, isLocal: true}
            // do something
        };
    */
    var joinRoom = function(params, callback) {
        callback = callback || util.noop;
        params.engineType = 2;

        var errorInfo = null;

        var url = params.url;
        videoRoom = KurentoRoom(url, function(error, kurento) {
            if (error)
                return console.log(error);


            var roomId = params.channelId;
            var userId = params.sentTime;
            userId = userId & 0x7fffffff;
            var ices = params.ices;

            var room = kurento.Room({
                room: roomId,
                user: userId,
                ices: ices
            });

            localStream = kurento.Stream(room, {
                audio: true,
                video: true,
                data: false,
                ices: ices
            });

            var participant = {
                add: function(data) {

                    var stream = data.data;

                    var video = stream.getVideoPlayer();

                    var user = stream.getParticipant();
                    var userId = user.getID();

                    video.setAttribute('userid', userId);

                    var result = {
                        type: 'added',
                        data: video,
                        isLocal: data.isLocal
                    };
                    callback(errorInfo, result);
                },
                remove: function(data) {
                    var result = {
                        type: 'removed',
                        data: data.data,
                        isLocal: data.isLocal
                    };
                    callback(errorInfo, result);
                }
            };

            var eventFactory = {
                'room-connected': function(roomEvent) {
                    localStream.publish();

                    var streams = roomEvent.streams;
                    util.each(streams, function(stream) {
                        participant.add({
                            data: stream,
                            isLocal: false
                        });
                    });
                },
                'stream-published': function(streamEvent) {
                    var stream = streamEvent.stream;
                    participant.add({
                        data: stream,
                        isLocal: true
                    });
                },
                'stream-added': function(streamEvent) {
                    var stream = streamEvent.stream;
                    participant.add({
                        data: stream,
                        isLocal: false
                    });
                },
                'stream-removed': function(streamEvent) {
                    var stream = streamEvent.stream;
                    var globalId = 'native-video-' + stream.getGlobalID();
                    participant.remove({
                        data: globalId,
                        isLocal: false
                    });
                },
                'new-message': function(msg) {

                },
                'error-room': function(error) {

                },
                'error-media': function(msg) {

                },
                'room-closed': function(msg) {

                },
                'lost-connection': function(msg) {
                    kurento.close(true);
                },
                'stream-stopped-speaking': function(participantId) {

                },
                'stream-speaking': function(participantId) {

                },
                'update-main-speaker': function(participantId) {

                }
            };

            localStream.addEventListener("access-accepted", function() {

                util.forEach(eventFactory, function(event, eventName) {
                    room.addEventListener(eventName, event);
                });

                room.connect();
            });

            localStream.addEventListener("access-denied", function() {

            });

            var mediaType = params.mediaType;
            mediaType = params.isSharing ? 3 : mediaType;

            var constraintItem = {
                1: {
                    audio: true,
                    video: false
                },
                2: {
                    audio: true,
                    video: {
                        width: {
                            ideal: 1280 || config.width
                        },
                        frameRate: {
                            ideal: 15 || config.rate
                        }
                    }
                },
                3: {
                    audio: false,
                    video: {
                        mandatory: {
                            chromeMediaSource: 'screen',
                            maxWidth: 1920,
                            maxHeight: 1080
                        },
                        optional: [{
                            googTemporalLayeredScreencast: true
                        }, {
                            googLeakyBucket: true
                        }]
                    }
                }
            };

            var constraints = constraintItem[mediaType];
            localStream.init(constraints);
        });
    };

    var quitRoom = function() {
        videoRoom && videoRoom.close();
    };

    var getRtcPeer = function(params) {

        if (!localStream) {
            throw new Error('Not call yet, please call first.');
        }

        return localStream.getWebRtcPeer();
    };

    var enableAudio = function(params) {
        getRtcPeer().audioEnabled = params.isEnabled;
    };

    var enableVideo = function(params) {
        getRtcPeer().videoEnabled = params.isEnabled;
    };

    var setConfig = function(cfg) {
        util.extend(config, cfg);
    };

    global.RongVoIP = {
        setConfig: setConfig,
        joinRoom: joinRoom,
        quitRoom: quitRoom,
        enableAudio: enableAudio,
        enableVideo: enableVideo
    };

})({
    KurentoRoom: KurentoRoom,
    win: window
});