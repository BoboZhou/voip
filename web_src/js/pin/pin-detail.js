'use strict';
(function(RongIM, dependencies, components) {

    var utils = RongIM.utils;
    var dialog = RongIM.dialog;
    var common = RongIM.common;
    components.getPinDetail = function(resolve, reject) {
        var im = RongIM.instance;
        var dataModel = im.dataModel;
        var pinApi = dataModel.Pin;
        var options = {
            name: 'pinDetail',
            template: 'templates/pin/pin-detail.html',
            props: ['isSender', 'pinUid', 'user', 'isReply'],
            data: function() {
                return {
                    confirmExpand: false,
                    receivedExpand: false,
                    pinDetail: {},
                    receiverList: null,
                    commentList: [],
                    entryComment: '',
                    attachmentList: [],
                    isShowEnd: false
                };
            },
            components: {
                avatar: components.getAvatar
            },
            directives: {
                focus: {
                    inserted: function(el, value) {
                        if (value) {
                            el.focus();
                        }
                    }
                }
            },
            computed: {
                getConfirmReceivers: function() {
                    return getConfirmReceivers(this, true);
                },
                getUnConfirmReceivers: function() {
                    return getConfirmReceivers(this, false);
                },
                isShowConfirmBtn: function() {
                    return !this.isSender && !this.pinDetail.confirmed;
                },
                isShowComment: function() {
                    return !this.isShowConfirmBtn;
                },
                isShowCommentTopLine: function() {
                    var hasComment = this.commentList.length;
                    var isExpand = this.isSender && this.receivedExpand || this.confirmExpand;
                    if (this.isSender && this.confirmExpand) {
                        isExpand = isExpand && this.receivedExpand;
                    }
                    return hasComment && isExpand;
                },
                isShowInput: function() {
                    var pinDetail = this.pinDetail;
                    var isOutDelayed = pinDetail.delayed && pinDetail.delayedSendDt < new Date().getTime();
                    var isConfirmed = this.isSender || pinDetail.confirmed;
                    var isValidTime = !pinDetail.delayed || isOutDelayed;
                    return isConfirmed && isValidTime;
                },
                getReceiverList: function() {
                    if (this.isShowEnd) {
                        return this.receiverList || [];
                    }
                    return [];
                },
                getCommentList: function() {
                    var commentList = this.commentList;
                    var split = document.body.clientHeight || 120;
                    split = parseInt((split - 120) / 70);
                    if (this.isShowEnd) {
                        return commentList;
                    }
                    return commentList.length > 20 ? commentList.slice(0, split) : commentList;
                }
            },
            methods: getMethods(dataModel, im),
            created: function() {
                created(this, dataModel, im);
            },
            destroyed: function() {
                unwatch(this, pinApi);
            }
        };
        utils.asyncComponent(options, resolve, reject);
    };

    function created(context, dataModel, im) {
        var pinApi = dataModel.Pin;
        var userApi = dataModel.User;
        hidePanel(context, im);
        commentWatch(context, im, pinApi, userApi);
        confirmWatch(context, pinApi);
        newReciverWatch(context, pinApi, userApi);
        set(context, im, context.pinUid);
    }

    function getMethods(dataModel, im) {
        var pinApi = dataModel.Pin;
        return {
            userProfile: dialog.user,
            getUsername: common.getUsername,
            formatFileSize: utils.formatFileSize,
            inputFocus: function() {
                Vue.nextTick(function () {
                    $('#replyInput')[0].focus();
                });
            },
            isShowConfirmStatus: function() {
                var isSender = this.isSender;
                var isConfirmed = !isSender && this.pinDetail.confirmed;
                return isSender || isConfirmed;
            },
            getUserName: function(user) {
                return user ? user.alias || user.name : ' ';
            },
            clickShowConfirmDetail: function() {
                this.confirmExpand = !this.confirmExpand;
            },
            getConfirmDetail: function() {
                if (!this.receiverList) {
                    return;
                }
                var localeReceivedPin = this.locale.components.receivedPin;
                var localeDetail = this.locale.components.pinDetail;
                if (this.isSender) {
                    var unConfirmedCount = this.localeFormat(localeDetail.unConfirmedCount, this.getUnConfirmReceivers.length);
                    unConfirmedCount = this.getUnConfirmReceivers.length === 0 ? localeDetail.allConfirmed : unConfirmedCount;
                    return unConfirmedCount;
                }
                return this.pinDetail.confirmed ? localeReceivedPin.confirmed : '';
            },
            clickShowReceiveDetail: function() {
                this.receivedExpand = !this.receivedExpand;
            },
            dateFormat: function(timestamp) {
                var dateFormatUtil = utils.dateFormat;
                var options = {
                    alwaysShowTime: true
                };
                return dateFormatUtil(timestamp, options);
            },
            pinDate: function() {
                var pinDetail = this.pinDetail;
                var createDt = pinDetail.sendDt || pinDetail.createDt;
                var timestamp = pinDetail.delayed ? pinDetail.delayedSendDt : createDt;
                var dateFormatUtil = utils.dateFormat;
                var options = {
                    alwaysShowTime: true
                };
                return dateFormatUtil(timestamp, options);
            },
            enterComment: function(event) {
                var that = this;
                if (event.shiftKey) {
                    return;
                }
                if (event.target.value === '\n') {
                    that.entryComment = '';
                }
                event.target.value = '';
                this.sendComment();
            },
            sendComment: function() {
                var that = this;
                if (!that.entryComment) {
                    common.messagebox({
                        message: that.locale.components.pinDetail.inputCanNotEmpty
                    });
                    return;
                }
                pinApi.comment(that.pinUid, that.entryComment, null, function(errorCode, result) {
                    var comment = $.extend(result, {user: im.loginUser});
                    that.entryComment = '';
                    clearUnReadComment(that, pinApi, that.pinUid, im);
                    that.commentList.unshift(comment);
                });
            },
            pinConfirm: function() {
                var that = this;
                pinApi.confirm(that.pinUid, function() {
                    that.pinDetail.confirmed = true;
                    setupReceiverConfirm(that, im.loginUser.id);
                    that.$emit('confirmPin');
                    pinApi.notifyUnReadCount(that.pinUid);
                    that.inputFocus();
                });
            },
            addReceivers: function() {
                if (!this.receiverList) {
                    return;
                }
                var defaultSelected = this.receiverList.map(function(receiver) {
                    return receiver.user;
                });
                dialog.addReceivers(defaultSelected, this);
            },
            cancelDownload: function(url) {
                RongIM.download.cancel(url);
            },
            getFileIconClass: function(name) {
                var prefix = 'rong-pin-file-';
                var getPointTotal = name.split('.').length - 1;
                var splitArr = name.split('.');
                return prefix + splitArr[getPointTotal];
            },
            getFileIconStyle: function(attach) {
                var name = attach.name || '';
                var imageMark = ['png', 'jpeg', 'gif', 'jpg'];
                var getPointTotal = name.split('.').length - 1;
                var type = name.split('.')[getPointTotal];
                var isImage = imageMark.indexOf(type) !== -1;
                if (isImage) {
                    return {
                        'background-image': 'url(' + attach.url + ')',
                        'background-size': 'cover',
                        'background-position': '0 0'
                        // "border-radius": "5px"
                    };
                }
            },
            getPinContent: function(content) {
                if (!content) {
                    return;
                }
                content = common.textMessageFormat(content);
                return common.highlight(content);
            },
            openFolder: openFolder
        };
    }

    function commentWatch(context, im, pinApi, userApi) {
        context.commentWatch = function(message) {
            var isMessageType = message.messageType === pinApi.MessageType.PinCommentMessage;
            var isNotSelfMessage = isMessageType && im.loginUser.id !== message.content.publisherUid;
            if (isNotSelfMessage) {
                var comment = message.content;
                comment.pinUid === context.pinUid && addPinComment(context, pinApi, userApi, comment);
            }
        };
        pinApi.watch(context.commentWatch);
    }

    function confirmWatch(context, pinApi) {
        context.confirmWatch = function(message) {
            var isMessageType = message.messageType === pinApi.MessageType.PinConfirmMessage;
            var isThisPinMessage = isMessageType && message.content.pinUid === context.pinUid;
            if (isThisPinMessage) {
                setupPinDetail(context, pinApi, context.pinUid);
                setupReceiverConfirm(context, message.content.operatorUid);
            }
        };
        pinApi.watch(context.confirmWatch);
    }

    function newReciverWatch(context, pinApi) {
        context.newReciverWatch = function(message) {
            var isMessageType = message.messageType === pinApi.MessageType.PinNewReciverMessage;
            var isThisPinMessage = isMessageType && message.content.pinUid === context.pinUid;
            if (isThisPinMessage) {
                setupPinDetail(context, pinApi, context.pinUid);
                setupReceivers(context, pinApi, context.pinUid);
            }
        };
        pinApi.watch(context.newReciverWatch);
    }

    function unwatch(context, pinApi) {
        pinApi.unwatch(context.commentWatch);
        pinApi.unwatch(context.confirmWatch);
        pinApi.unwatch(context.newReciverWatch);
        unRegDownloadListener();
    }

    function addPinComment(context, pinApi, userApi, comment) {
        comment.content = comment.comment;
        comment.createDt = comment.timestamp;
        userApi.getDetail(comment.publisherUid, function(errorCode, user) {
            clearUnReadComment(context, pinApi, comment.pinUid);
            comment.user = user;
            context.commentList.unshift(comment);
        });
    }

    function setupReceiverConfirm(context, uid) {
        if (!context.receiverList) {
            return;
        }
        context.receiverList.forEach(function(receiver) {
            if (receiver.receiverUid === uid) {
                receiver.isConfirmed = true;
            }
        });
    }

    function hidePanel(context, im) {
        im.$on('imclick', function(event) {
            var $target = $(event.target);
            var wrap = '.rong-pin-detail, .rong-pin-item, .rong-dialog';
            var inBody = $target.closest('body').length > 0;
            var inWrap = $target.closest(wrap).length < 1;
            var isOuter = inBody && inWrap;
            isOuter && context.$emit('hidepanel');
        });
    }

    function set(context, im, pinUid) {
        var dataModel = im.dataModel;
        var pinApi = dataModel.Pin;
        setupPinDetail(context, pinApi, pinUid);
        setupPinAttachmentList(context, pinApi, pinUid);
        setupCommentList(context, pinApi, pinUid);
        setupReceivers(im, context, pinApi, pinUid);
        setupShowEnd(context, im);
    }

    function setupShowEnd(context, im) {
        im.$on('pinDetailLoadDone', function() {
            context.isShowEnd = true;
            if (context.isReply) {
                context.inputFocus();
            }
            im.$off('pinDetailLoadDone');
        });
    }

    function setupPinDetail(context, pinApi, uid) {
        pinApi.getPinDetail(uid, function(errorCode, detail) {
            if (errorCode) {
                return;
            }
            context.pinDetail = detail;
        });
    }

    function setupReceivers(im, context, pinApi, uid) {
        pinApi.getReceiverList(uid, function(errorCode, receivers) {
            if (errorCode) {
                return;
            }
            context.receiverList = receivers;
        });
    }

    function setupCommentList(context, pinApi, uid) {
        pinApi.getCommentList(uid, function(errorCode, comments) {
            if (errorCode) {
                return;
            }
            pinApi.notifyUnReadCount(uid);
            Vue.nextTick(function() {
                context.commentList = comments;
            });
        });
    }

    function setupPinAttachmentList(context, pinApi, uid) {
        pinApi.getAttachments(uid, function (errorCode, result) {
            var progress = {
                isDownloading: false,
                downloadProgress: 0
            };
            result = result.map(function(attach) {
                return $.extend(attach, progress);
            });
            context.attachmentList = result;
            setupAttachDownload(context);
            setupAttachExists(context.attachmentList);
        });
    }

    function setupAttachDownload(context) {
        context.attachmentList.forEach(function(attach) {
            addDownloadWatch(attach, attach.url);
        });
    }

    function getConfirmReceivers(context, isConfirmed) {
        if (!context.getReceiverList) {
            return [];
        }
        return context.getReceiverList.filter(function(receiver) {
            return receiver.isConfirmed === isConfirmed;
        });
    }

    function clearUnReadComment(context, pinApi, uid) {
        pinApi.getCommentList(uid, function() {
            pinApi.notifyUnReadCount(uid);
            context.$emit('receiveComment');
        });
    }

    function openFolder(attach) {
        if (attach.isDownloading) {
            return;
        }
        var file = RongIM.file;
        var localPath = attach.localPath;
        var url = localPath || attach.url;
        localPath = file.chkExists(url);
        if(localPath) {
            file.openDir(localPath);
        } else {
            common.handleError('download-404');
            attach.downloadProgress = 0;
            removeLocalAttach(attach);
        }
    }

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
                    context.isDownloading = true;
                    context.downloadProgress = params.progress;
                    break;
                case 'paused':
                    break;
                case 'completed':
                    context.isDownloading = false;
                    if(!params.localPath){
                        break;
                    }
                    context.localPath = params.localPath;
                    saveLocalAttach(context, params.localPath);
                    context.downloadProgress = 100;
                    break;
                case 'cancelled':
                    stateCode = ('download-' + params.state);
                    context.isDownloading = false;
                    if(context.downloadProgress === 0){
                        return;
                    }
                    context.downloadProgress = 0;
                    common.handleError(stateCode);
                    break;
            // case 'interrupted':
                default:
                    stateCode = ('download-' + params.state);
                    context.downloadStatus = false;
                    context.downloadProgress = 0;
                    common.handleError(stateCode);
            }
        });
    }

    function saveLocalAttach(attach, localPath) {
        var im = RongIM.instance;
        var Cache = im.dataModel._Cache;
        var attachCache = Cache.pin.attach;
        attachCache[attach.uid] = {};
        attachCache[attach.uid].localPath = localPath;
    }

    function removeLocalAttach(attach) {
        var im = RongIM.instance;
        var Cache = im.dataModel._Cache;
        var attachCache = Cache.pin.attach;
        delete attachCache[attach.uid];
    }

    function setupAttachExists(attachmentList) {
        var im = RongIM.instance;
        var Cache = im.dataModel._Cache;
        var attachCache = Cache.pin.attach;
        attachmentList.forEach(function(attach) {
            setAttach(attach);
        });
        function setAttach(attach) {
            for (var key in attachCache) {
                if (key === attach.uid) {
                    attach.localPath = attachCache[key].localPath;
                    attach.downloadProgress = 100;
                }
            }
        }
    }

    function unRegDownloadListener(){
        var download = RongIM.download;
        download.unregStateChange();
    }

})(RongIM, {
    jQuery: jQuery
}, RongIM.components);
