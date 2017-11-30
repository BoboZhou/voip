'use strict';
(function(RongIM, dependencies, components){

var utils = RongIM.utils;
var common = RongIM.common;
var Base64Util = utils.Base64;
var $ = dependencies.jQuery;
var drag = RongIM.drag;

components.getImageMessage = function (resolve, reject) {
    var im = RongIM.instance;
    var options = {
        name: 'image-message',
        props:['message', 'message-list'],
        template:'#rong-template-image',
        data: function () {
            return {
                loaded: false,
                style: {
                    height: '180px'
                },
                sentStatus: utils.sentStatus,
                uploadStatus: utils.uploadStatus
            };
        },
        computed: {
            base64: function () {
                var imageMsg = this.message.content;
                var content = imageMsg.content;
                return Base64Util.concat(content);
            },
            imageMessageList: function () {
                return this.messageList.filter(function (item) {
                    return item.messageType === 'ImageMessage';
                });
            },
            isUploading: function () {
                var uploadStatus = this.message.uploadStatus;
                var uploading = uploadStatus === utils.uploadStatus.UPLOADING;
                var progress = this.message.progress > 0;
                return uploading && progress;
            },
            path: function () {
                var percent = (this.message.progress || 0 ) / 100;
                if (percent === 1) {
                    percent = 0.99;
                }
                var r = 10;
                var degrees = percent * 360;
                var rad = degrees * (Math.PI / 180);
                var x = (Math.sin(rad) * r).toFixed(2);
                var y = -(Math.cos(rad) * r).toFixed(2);
                var lenghty = window.Number(degrees > 180);
                var path = ['M', 0, -r, 'A', r, r, 0, lenghty, 1, x, y];
                path = path.join(' ');
                return path;
            }
        },
        destroyed: function () {
            var message = this.message;
            var messageApi = im.dataModel.Message;
            this.isUploading && cancel(this, message, messageApi, im.auth.id);
        },
        methods: {
            showImage: function (messageUId) {
                showImage(this, messageUId, im);
            },
            updateThumbnailHeight: function (event) {
                var $img = $(event.target);
                this.style = {
                    width: $img.width()  +'px',
                    height: $img.height() + 'px'
                };
            },
            largeImageLoaded: function (event) {
                var $img = $(event.target);
                var width = $img.width();
                var height = $img.height();
                if(width < height) {
                    $img.css({
                        width: this.style.width,
                        height: 'auto'
                    });
                } else {
                    $img.css({
                        width: 'auto',
                        height: this.style.height
                    });
                }
                $img.css('opacity', 1);
            }
        }
    };
    utils.asyncComponent(options, resolve, reject);
};

function showImage(context, messageUId, im) {
    var list = context.imageMessageList.map(function (item) {
        return item.messageUId;
    });
    var options = getImageOptions({
        template: '#rong-template-image-rebox',
        imageMessageList: context.imageMessageList,
        currentIndex: list.indexOf(messageUId)
    });
    options.mixins = options.mixins || [];
    var locale = {
        computed: {
            locale: function () {
                var locale = RongIM.instance.locale;
                return locale;
            }
        }
    };
    options.mixins.push(locale);

    var Image = Vue.extend(options);
    var instance = new Image({
        el: document.createElement('div')
    });
    var wrap = im.$el.firstChild;
    $(wrap).append(instance.$el);
}

function getImageOptions(options) {
    return {
        name: 'image',
        template: options.template,
        data: function () {
            return {
                show: true,
                loading: true,
                imageMessageList: options.imageMessageList || [],
                currentIndex: options.currentIndex || 0,
                // 'normal' or 'full'
                size: 'normal',
                margin: 0,
                scale: 1
            };
        },
        computed: {
            current: function () {
                return this.imageMessageList[this.currentIndex] || {};
            },
            hasPrev: function () {
                var msgListLen = this.imageMessageList.length;
                return msgListLen > 0 && this.currentIndex > 0;
            },
            hasNext: function () {
                var msgListLen = this.imageMessageList.length;
                return msgListLen > 0 && this.currentIndex < (msgListLen - 1);
            }
        },
        watch: {
            currentIndex: function () {
                this.scale = 1;
                this.margin = 0;
            }
            // size: function () {
            //     var context = this;
            //     context.$nextTick(function () {
            //         context.scale = getScale(context.$refs.img);
            //         context.toggleFullScreen(context.$el);
            //     });
            // }
        },
        mixins: [
            components.getFullscreen()
        ],
        methods: {
            close: function () {
                this.show = false;
            },
            dragImg: function (event) {
                dragImg(this, event);
            },
            toggle: function () {
                var context = this;
                context.margin = 0;
                context.scale = getScale(context.$refs.img);
                context.toggleFullScreen(context.$el);
            },
            prev: function () {
                this.currentIndex--;
            },
            next: function () {
                this.currentIndex++;
            },
            zoomIn: function (STEP) {
                var MAX_SCALE = 9;
                this.scale = Math.min(MAX_SCALE, this.scale + STEP);
            },
            zoomOut: function (STEP) {
                var MIN_SCALE = 0.1;
                this.scale = Math.max(MIN_SCALE, this.scale - STEP);
            },
            zoom: utils.throttle(function (event) {
                var STEP = 0.25;
                if(event.deltaY < 0) {
                    this.zoomIn(STEP);
                } else if(event.deltaY > 0) {
                    this.zoomOut(STEP);
                }
            }, 80)
        }
    };
}

function getScale(img) {
    getScale.size = getScale.size || {};

    var $img = $(img);
    var src = $img.attr('src');
    if(!getScale.size[src]) {
        getScale.size[src] = {
            width: $img.width(),
            height: $img.height()
        };
    }

    var imgSize = getScale.size[src];
    var $wrap = $img.parent();
    var wrapWidth = $wrap.width();
    var wrapHeight = $wrap.height();

    var scale = 1;
    if(imgSize.width > wrapWidth) {
        var widthScale = wrapWidth / imgSize.width;
        scale = Math.min(scale, widthScale);
    }
    if(imgSize.height > wrapHeight) {
        var heightScale = wrapHeight / imgSize.height;
        scale = Math.min(scale, heightScale);
    }
    return scale;
}

function dragImg(context, event) {
    var el = event.target;
    var $el = $(el);
    var oldPosition = {
        left: parseFloat($el.css('left')),
        top: parseFloat($el.css('top'))
    };
    drag(el, event, function (position) {
        var deltaX = position.left - oldPosition.left;
        var deltaY = position.top - oldPosition.top;
        var margin = '{top}px 0 0 {left}px'.replace('{top}', deltaY);
        margin = margin.replace('{left}', deltaX);
        context.margin = margin;
    }, el.parentElement);
}

function cancel(context, message, messageApi, sendUserId) {
    var content = message.content;
    message.cancel(function (errorCode) {
        if(errorCode) {
            return common.handleError(errorCode);
        }
        var params = {
            conversationType: message.conversationType,
            targetId: message.targetId,
            sendUserId: sendUserId,
            content: {
                localPath: message.localPath || content.localPath,
                status: 0,
                content: content.content
            },
            objectName:'LRC:imageMsg'
        };
        insertMessage(messageApi, params);
    });
    context.$emit('uploadCancel', message, context.messageList);
}

function insertMessage(messageApi, params){
    messageApi.insertMessage(params, function(errorCode, message){
        var setParams = {
            messageId: message.messageId,
            status: RongIMLib.SentStatus.FAILED
        };
        messageApi.setMessageSentStatus(setParams, null);
    });
}

})(RongIM, {
    jQuery: jQuery
}, RongIM.components);
