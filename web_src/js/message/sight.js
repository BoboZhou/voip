'use strict';
(function(RongIM, dependencies, components){

var utils = RongIM.utils;
var Base64Util = utils.Base64;
var download = RongIM.downloadSight;
var file = RongIM.file;

components.getSightMessage = function (resolve, reject) {
    var im = RongIM.instance;
    var dataModel = im.dataModel;
    var options = {
        name: 'sight-message',
        props:['message', 'message-list'],
        template:'#rong-template-sight',
        data: function () {
            return {
                downloading:false,
                progress: 0
            };
        },
        computed: {
            base64: function () {
                var sightMessage = this.message.content;
                var content = sightMessage.content;
                return Base64Util.concat(content);
            },
            path: function () {
                var percent = (this.progress || 0 ) / 100;
                if (percent === 1) {
                    percent = 0.99;
                }
                var r = 18;
                var degrees = percent * 360;
                var rad = degrees * (Math.PI / 180);
                var x = (Math.sin(rad) * r).toFixed(2);
                var y = -(Math.cos(rad) * r).toFixed(2);
                var lenghty = window.Number(degrees > 180);
                var a = ['M', 0, -r, 'A', r, r, 0, lenghty];
                var b = [1, x, y, 'L', 0, 0, 'Z'];
                var path = a.concat(b);
                path = path.join(' ');
                return path;
            },
            seconds: function () {
                return secondsToTime(this.message.content.duration);
            }
        },
        methods: {
            play: function () {
                if (this.downloading) {
                    return ;
                }
                var message = this.message;
                var exist = file.chkExists(message.content.localPath);
                if (exist) {
                    file.open(message.content.localPath);
                } else {
                    var id = message.messageUId;
                    var url = message.content.sightUrl;

                    // 兼容 iOS name 没有后缀名问题
                    var filename = message.content.name;
                    if (!/\.[a-zA-Z0-9]+$/.test(filename)) {
                        filename = filename + '.mp4';
                    }
                    // 开始下载 下载完成后打开视频
                    download.downloadFile(url, filename, id);
                }
            }
        },
        mounted: function () {
            var sightUrl = this.message.content.sightUrl;
            addDownloadWatch(this, sightUrl, dataModel.Message);
        },
        destroyed: function () {
            unRegDownloadListener();
        }
    };
    utils.asyncComponent(options, resolve, reject);
};

function addDownloadWatch(context, fileUrl, messageApi) {
    if (!fileUrl) {
        return;
    }
    download.regDownload(function (event, params) {
        switch (params.state) {
            case 'preDownload':
                if (isCurrentMessage(context, params.messageId)) {
                    context.message.content.localPath = params.targetPath;
                    messageApi.setContent(context.message);
                }
                break;
            case 'downloading':
                if (isCurrentMessage(context, params.messageId)) {
                    context.progress = (params.receivedBytes / params.totalBytes) * 100;
                    context.downloading = true;
                }
                break;
            case 'downloaded':
                if (isCurrentMessage(context, params.messageId)) {
                    context.downloading = false;
                    file.open(context.message.content.localPath);
                }
                break;
            case 'downloadError':
                if (isCurrentMessage(context)) {
                    utils.console.log('sight download:', params.error);
                }
                break;
            default:
                $.noop();
        }
    });
}

function isCurrentMessage(context, id) {
    return context.message.messageUId === id;
}

function unRegDownloadListener(){
    download.unregDownload();
}

function secondsToTime(seconds){
    var hours  = Math.floor( seconds / ( 60 * 60 ) );
        seconds -= hours * ( 60 * 60 );
    var minutes  = Math.floor( seconds / 60 );
        seconds -= minutes * 60;
    var result = hours > 0 ? hours + ':' : '';
    result += minutes + ':' + (seconds > 9 ? seconds : '0' + seconds);
    return result;
}
})(RongIM, {
    jQuery: jQuery
}, RongIM.components);
