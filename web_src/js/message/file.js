'use strict';
(function(RongIM, dependencies, components) {

var common = RongIM.common;
var utils = RongIM.utils;
var moment = dependencies.moment;

components.getFileMessage = function(resolve, reject) {
    var im = RongIM.instance;
    var dataModel = im.dataModel;
    var options = {
        name: 'file-message',
        props: ['message', 'keyword'],
        template: '#rong-template-file',
        data: function() {
            return {
                uploadStatus: utils.uploadStatus,
                sentStatus: utils.sentStatus,
                downloadStatus: '',
                downloadProgress: 0
            };
        },
        computed: {
            support: function () {
                return im.config.support;
            },
            canceled: function () {
                return this.message.content.status === 0;
            },
            size: function() {
                return size(this);
            },
            filename: function () {
                return this.message.content.name;
            },
            basename: function () {
                return this.filename.slice(0, 0 - this.extname.length);
            },
            extname: function () {
                var index = this.filename.lastIndexOf('.');

                // 扩展名前多显示2个字
                var prefix = 2;
                var chPatrn = /[\u4E00-\u9FA5]|[\uFE30-\uFFA0]/gi;
                var extname = this.filename.slice(Math.max(0, index - prefix));
                return chPatrn.exec(extname) ? extname.substring(1) : extname;
            },
            fileUrl: function () {
                return this.message.content.fileUrl;
            }
        },
        destroyed: function () {
            unRegDownloadListener();
        },
        watch: {
            fileUrl: function(newValue, oldValue) {
                fileUrlChanged(this, newValue, oldValue);
            }
        },
        created: function() {
            created(this);
        },
        methods: {
            getUsername: common.getUsername,
            dateFormat: function (timestamp, format) {
                return moment(timestamp).format(format);
            },
            highlight: function (text) {
                return common.highlight(text, this.keyword);
            },
            cancel: function() {
                cancel(this, this.message, dataModel.Message, im.auth.id);
            },
            cancelDownlad: function() {
                RongIM.download.cancel(this.fileUrl);
            },
            openFile: function () {
                openFile(this);
            },
            openFolder: function() {
                openFolder(this);
            },
            uploading: function (message) {
                return message.uploadStatus === utils.uploadStatus.UPLOADING;
            }
        }
    };
    utils.asyncComponent(options, resolve, reject);
};

function addDownloadWatch(context, fileUrl){
    var download = RongIM.download;
    if(!fileUrl){
        return;
    }
    download.regStateChange(function(event, params){
        if(fileUrl !== params.url){
            return;
        }
        var stateCode;
        switch (params.state) {
            case 'progressing':
                // 下载 另存为对话框,点取消后也会触发此方法  加入判断避免闪烁
                if(params.progress === 0){
                    return;
                }
                stateCode = null;
                context.downloadStatus = 'DOWNLOADING';
                context.downloadProgress = params.progress;
                break;
            case 'paused':
                break;
            case 'completed':
                context.downloadStatus = 'DOWNLOADED';
                if(!params.localPath){
                    break;
                }
                var message = context.message;
                if(message.content){
                    message.content.localPath = params.localPath;
                    var rongInstance = RongIMClient.getInstance();
                    var messageId = message.messageId;
                    var content = message.content;
                    rongInstance.setMessageContent(messageId, content, '');
                }
                context.downloadProgress = 0;
                break;
            case 'cancelled':
                stateCode = ('download-' + params.state);
                context.downloadStatus = 'CANCELLED';
                if(context.downloadProgress === 0){
                    return;
                }
                context.downloadProgress = 0;
                common.handleError(stateCode);
                break;
            // case 'interrupted':
            default:
                stateCode = ('download-' + params.state);
                context.downloadStatus = 'READY';
                context.downloadProgress = 0;
                common.handleError(stateCode);
        }
    });
}

function unRegDownloadListener(){
    var download = RongIM.download;
    download.unregStateChange();
}

function fileUrlChanged(context, newValue/*, oldValue*/) {
    var localUrl = context.message.content.localPath;
    var localPath = localUrl || newValue;
    if (getFileExists(localPath)) {
        context.downloadStatus = 'DOWNLOADED';
    } else {
        context.downloadStatus = 'READY';
    }
    !localUrl && newValue && addDownloadWatch(context, newValue);
}

function created(context) {
    // if(created.init !== 'done' && context.support.downloadProgress) {
    //     watchDownloadProgress();
    //     watchDownloadState();
    //     created.init = 'done';
    // }

    var message = context.message;
    var fileUrl = context.fileUrl;
    // fileUrl && addDownloadWatch(context, fileUrl);
    fileUrl && addDownloadWatch(context, fileUrl);

    var localUrl = message.content.localPath;
    var localPath = localUrl || fileUrl;
    var uploadDone = message.uploadStatus === context.uploadStatus.SUCCESS;
    var download = utils.isEmpty(message.uploadStatus) || uploadDone;
    var downloadStatus = '';
    if(message.content.status === 0) {
        // 已取消
    } else if (getFileExists(localPath)) {
        downloadStatus = 'DOWNLOADED';
    } else if (download) {
        downloadStatus = 'READY';
    }
    context.downloadStatus = downloadStatus;
}

function getFileExists(fileUrl) {
    var file = RongIM.file;
    var existed = false;
    if (!utils.isEmpty(fileUrl)) {
        existed = file.chkExists(fileUrl);
    }
    return existed;
}

function cancel(context, message, messageApi, sendUserId) {
    var content = message.content;
    var routeParams = context.$route.params;
    message.cancel(function (errorCode) {
        if(errorCode) {
            return common.handleError(errorCode);
        }
        var params = {
            conversationType: routeParams.conversationType,
            targetId: routeParams.targetId,
            sendUserId: sendUserId,
            messageDirection: 1,
            content: {
                messageName: 'FileMessage',
                type: content.type,
                name: content.name,
                localPath: content.localPath,
                status: 0
            },
            objectName:'LRC:fileMsg'
        };
        insertMessage(messageApi, params);
    });
    context.$emit('uploadCancel', message);
}

function insertMessage(messageApi, params){
    messageApi.insertMessage(params, function(errorCode, message){
        var setParams = {
            messageId: message.messageId,
            status: message.sentStatus
        };
        messageApi.setMessageSentStatus(setParams, null);
    });
}

function openFile(context) {
    if(context.downloadStatus !== 'DOWNLOADED') {
        return;
    }
    var file = RongIM.file;
    var localUrl = context.message.content.localPath;
    var url = localUrl || context.fileUrl;
    var localPath = file.chkExists(url);
    if(localPath) {
        file.open(localPath);
    } else {
        common.handleError('download-404');
        context.downloadStatus = 'READY';
    }
}

function openFolder(context) {
    var file = RongIM.file;
    var localUrl = context.message.content.localPath;
    var url = localUrl || context.fileUrl;
    var localPath = file.chkExists(url);
    if(localPath) {
        file.openDir(localPath);
    } else {
        common.handleError('download-404');
        context.downloadStatus = 'READY';
    }
}

function size(context) {
    var filesize = Number(context.message.content.size) || 0;
    var sizeStr = '';
    var G = Math.pow(1024, 3);
    var M = Math.pow(1024, 2);
    var K = Math.pow(1024, 1);
    if (filesize > G) {
        sizeStr = (filesize / G).toFixed(2) + 'G';
    } else if (filesize > M) {
        sizeStr = (filesize / M).toFixed(2) + 'M';
    } else /*if (filesize > K)*/ {
        sizeStr = (filesize / K).toFixed(2) + 'KB';
    }/* else {
        sizeStr = filesize + 'B';
    }*/
    return sizeStr;
}

})(RongIM, {
    moment: moment,
    jQuery: jQuery
}, RongIM.components);
