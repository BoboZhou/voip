'use strict';
(function (RongIM, dependencies, components) {

var utils = RongIM.utils;
var Base64Util = utils.Base64;
var common = RongIM.common;
var drag = RongIM.drag;
var UploadClient = dependencies.UploadClient;

components.editAvatar = function (resolve, reject) {
    var im = RongIM.instance;
    var dataModel = im.dataModel;
    var MAX_SCALE = 5;
    var options = {
        name: 'edit-avatar',
        template: 'templates/edit-avatar.html',
        data: function () {
            return {
                showField: true,
                user: im.loginUser,
                src: im.loginUser.avatar,
                canvasSize: 198,
                imgWidth: 0,
                imgHeight: 0,
                offsetX: 0,
                offsetY: 0,
                loadDone: false,
                minScale: 0.1,
                percent: 0
            };
        },
        components: {
            avatar: components.getAvatar
        },
        computed: {
            scale: {
                get: function () {
                    return this.percent / 100 * MAX_SCALE + this.minScale;
                },
                set: function (value) {
                    this.percent = (value - this.minScale) / MAX_SCALE * 100;
                }
            }
        },
        created: function () {
            RongIM.debug.editAvatar = this;
        },
        methods: {
            close: function () {
                this.$emit('close');
            },
            fieldChanged: function (event) {
                fieldChanged(this, event);
            },
            imgLoaded: function (event) {
                imgLoaded(this, event.target);
            },
            dragImg: function (event) {
                dragImg(this, event);
            },
            dragTrackButton: function (event) {
                dragTrackButton(this, event);
            },
            zoomOut: function () {
                var STEP = 1;
                this.percent = Math.max(0, this.percent - STEP);
            },
            zoomIn: function () {
                var STEP = 1;
                this.percent = Math.min(100, this.percent + STEP);
            },
            getAvatarBase64: function (callback) {
                getAvatarBase64(this, callback);
            },
            upload: function (callback) {
                uploadBase64(this, callback);
            },
            save: function () {
                save(this, dataModel.User, im);
            }
        }
    };
    utils.asyncComponent(options, resolve, reject);
};

function fieldChanged(context, event) {
    var file = event.target.files[0];
    if(utils.isEmpty(file)) {
        return;
    }
    var config = RongIM.config.upload;
    var size = config.file.imageSize;
    var isOutRange = file.size > size;
    if (isOutRange) {
        size = Math.floor(size/1024/1024);
        var info = '头像大小超限,必须小于 ' + size + 'MB';
        common.messagebox({
            message: info
        });
        return;
    }
    upload('image', file, function (errorCode, src) {
        context.src = src;
        context.showField = false;
        context.$nextTick(function () {
            context.showField = true;
        });
    });
}

function imgLoaded(context, img) {
    img.style = null;
    context.imgWidth = img.width;
    context.imgHeight = img.height;
    var canvasSize = context.canvasSize;
    var imgMinSize = Math.min(img.width, img.height);
    context.minScale = canvasSize / imgMinSize;
    context.scale = context.minScale;
    context.loadDone = true;
}

function dragImg(context, event) {
    if(!context.loadDone) {
        return;
    }
    var el = event.target;
    var $el = $(el);
    var oldPosition = {
        left: parseFloat($el.css('left')),
        top: parseFloat($el.css('top'))
    };
    drag(el, event, function (position) {
        var deltaX = position.left - oldPosition.left;
        var deltaY = position.top - oldPosition.top;
        context.offsetX = deltaX;
        context.offsetY = deltaY;
        $el.css({
            'margin-left': deltaX,
            'margin-top': deltaY
        });
    }, el.parentElement);
}

function dragTrackButton(context, event) {
    if(!context.loadDone) {
        return;
    }

    var el = event.target;
    var $el = $(el);

    var trackWidth = $el.parent().width();
    drag(el, event, function (position) {
        var left = Math.min(Math.max(0, position.left), trackWidth);
        var ratio =  left / trackWidth;
        context.percent = ratio * 100;
    });
}

function getAvatarBase64(context, callback) {
    var img = document.createElement('img');
    var canvas = document.createElement('canvas');
    canvas.width = context.canvasSize;
    canvas.height = context.canvasSize;
    img.onload = function() {
        var scale = context.scale;
        var leftCorner = context.imgWidth / 2 - canvas.width / 2 / scale;
        var topCorner = context.imgHeight / 2 - canvas.height / 2 / scale;
        var sx = leftCorner - context.offsetX / scale;
        var sy = topCorner - context.offsetY / scale;
        var sWidth = canvas.width / scale;
        var sHeight = canvas.height / scale;
        var ctx = canvas.getContext('2d');
            ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
        var url = canvas.toDataURL();
            url = Base64Util.replace(url);
        callback(null, url);
    };
    img.onerror = function () {
        callback('404');
    };
    img.crossOrigin = 'anonymous';
    img.src = context.$refs.img.src;
}

function uploadBase64(context, callback) {
    context.getAvatarBase64(function (errorCode, base64) {
        if(errorCode) {
            return callback(errorCode);
        }
        upload('base64', base64, callback);
    });
}

function save(context, userApi, im) {
    if(utils.isEmpty(context.src)) {
        return context.close();
    }

    context.upload(function (errorCode, src) {
        if(errorCode) {
            return common.handleError(errorCode);
        }
        userApi.setAvatar(src, context.src, function (errorCode) {
            if(errorCode) {
                return common.handleError(errorCode);
            }
            im.loginUser.avatar = src;
            context.$emit('srcchange', src, context.src);
            context.close();
        });
    });
}

/**
 * @param type - 'file' or 'image' or 'base64'
 * @param fileData
 * @param callback
 */
function upload(type, fileData, callback) {
    var config = RongIM.config.upload[type] || RongIM.config.upload.file;
    var domain = '';
    if(type === 'base64') {
        config.data = UploadClient.dataType.data;
    }
    config.getToken = function (done) {
        var dataModel = RongIM.instance.dataModel;
        dataModel.User.getAvatarToken(function (errorCode, result) {
            if(errorCode) {
               return  utils.console.warn('获取上传 token 失败');
            }
            domain = result.domain;
            done(result.token);
        });
    };

    var actionMap = {
        file: 'initFile',
        image: 'initImage',
        base64: 'initImgBase64'
    };
    var action = actionMap[type];
    var uploadCallback = {
        onBeforeUpload: function () {
        },
        onProgress : function () {
        },
        onCompleted: function (data) {
            var url = location.protocol + '//' + domain + '/' + data.key;
            var uploadType = RongIM.config.upload.type;
            if(uploadType === 'RongCloud'){
                url = data.rc_url.path;
                if (data.rc_url.type === 0) {
                    url = RongIM.config.upload.file.domain + data.rc_url.path;
                }
            }
            callback(null, url);
        },
        onError: callback
    };
    UploadClient[action](config, function (uploadFile) {
        uploadFile.upload(fileData, uploadCallback);
    });
}

})(RongIM, {
    UploadClient: UploadClient
}, RongIM.components);
