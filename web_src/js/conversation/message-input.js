'use strict';
(function (RongIM, dependencies, components){

var common = RongIM.common;
var utils = RongIM.utils;
var Base64Util = utils.Base64;
var dialog = RongIM.dialog;
var $ = dependencies.jQuery;
var UploadClient = dependencies.UploadClient;
var dataModel = RongIM.dataModel;

components.getMessageInput = function (resolve, reject) {
    var im = RongIM.instance;
    var options =  {
        name: 'message-input',
        template: '#rong-template-message-input',
        props: {
            atMembers: {
                type: Array,
                required: false
            },
            autoFocus: {
                type: Boolean,
                required: false,
                default: true
            },
            draft: {
                type: String
            },
            inGroup: false
        },
        data: function () {
            return {
                sendBtnAvailable: false,
                at: {},
                atFilterMembers: [],
                atPanelStyle: {},
                atSelectedMembers: [],
                showEmojiPanel: false,
                support: RongIM.config.support
            };
        },
        computed: {
            screenshotSupported: function () {
                return im.config.support.screenshot;
            },
            status: function () {
                return im.status;
            }
        },
        components: {
            'edit-box': components.getEditBox,
            'emoji-panel': components.getEmojiPanel
        },
        methods: getMethods(im)
    };
    utils.asyncComponent(options, resolve, reject);
};

function getMethods(im) {
    var dataModel = im.dataModel;
    var methods = {
        reset: function () {
            if(this.$refs.editor) {
                this.$refs.editor.reset();
            }
        },
        focus: function () {
            if(this.$refs.editor) {
                this.$refs.editor.focus();
            }
        },
        getValue: function () {
            return this.$refs.editor.getValue();
        },
        sendMessage: function () {
            sendMessage(this, im);
        },
        messageInputChanged: function (value) {
            messageInputChanged(this, value);
        },
        toggleEmoji: function () {
            this.showEmojiPanel = !this.showEmojiPanel;
            this.$emit('prepareinput');
        },
        prepareinput: function () {
            this.$emit('prepareinput');
        },
        selectedEmoji: function (emoji) {
            this.$refs.editor.insertText(emoji);
        },
        hideEmojiPanel: function () {
            this.showEmojiPanel = false;
        },
        screenshot: function () {
            this.$emit('prepareinput');
            RongIM.addon.screenShot();
        },
        fileChanged: function(event) {
            var context = this;
            this.$emit('prepareinput');
            Vue.nextTick(function () {
                var fileList = event.target.files;
                uploadFileList(fileList, context, im);
                // 重置 input file 的 value 使可以连续多次上传同一文件
                resetInputFileValue(event.target, methods.fileChanged, context);
            });
        },
        dragover: function(event) {
            event.preventDefault();
            event.stopPropagation();
        },
        drop: function(event) {
            event.preventDefault();
            event.stopPropagation();
            var items = event.dataTransfer.items;
            var fileList = [];
            if (items) {
                // chrome firefox 过滤文件夹
                $.each(items, function(index, item) {
                    var entry = item.webkitGetAsEntry();
                    if(entry.isFile) {
                        fileList.push(item.getAsFile());
                    }
                });
            } else {
                // IE 不包含文件夹
                fileList = event.dataTransfer.files;
            }
            if(fileList.length === 0){
                return;
            }
            uploadFileList(fileList, this, im);
        },
        paste: function (event) {
            paste(this, event, im);
        },
        clearUnReadCount: function () {
            var params = this.$route.params;
            var conversationType = params.conversationType;
            var targetId = params.targetId;
            dataModel.Conversation.clearUnReadCount(conversationType, targetId);
        },
        sendVideo: function () {
            this.$emit('sendVideo');
        },
        sendAudio: function () {
            this.$emit('sendAudio');
        },
        shareScreen: function () {
            this.$emit('shareScreen');
        },
        sendCard: function () {
            var userId = this.$route.params.targetId;
            dialog.card(userId);
        }
    };
    return methods;
}

function uploadFileByPath(filePaths, context, im){
    var file = RongIM.file;
    var fileList = [];
    filePaths.forEach( function(filePath) {
        var thisFile = file.getBlobByPath(filePath);

        //localPath 为了兼容复制的本地文件,File 的 path 属性只读
        thisFile.localPath = filePath;
        fileList.push(thisFile);
    });
    uploadFileList(fileList, context, im);
}

function getPasteData(clipboardData) {
    var data = {};
    var items = clipboardData.items;
    if (utils.isEmpty(items)) {
        var string = clipboardData.getData('text');
        data.str = {
            getAsString: function (callback) {
                callback(string);
            }
        };
    } else {
        for (var i = items.length - 1; i >= 0; i--) {
            var item = items[i];
            if (item.kind === 'file') {
                var file = item.getAsFile();
                if (file.size > 0) {
                    data.file = file;
                }
            }
            if (item.kind === 'string' && item.type === 'text/plain') {
                data.str = item;
            }
        }
    }
    return data;
}

function decodeMessageJSON(str) {
    try {
        var obj = JSON.parse(str);
        return obj;
    } catch(error) {
        return null;
    }
}

function decodeMessage(msgStr) {
    var messageApi = dataModel.Message;
    var message = decodeMessageJSON(msgStr);
    if(utils.isEmpty(message) || utils.isEmpty(message.messageName)) {
        return;
    }
    var msg = {
        messageType: message.messageName,
        content: message
    };
    message = messageApi.create(msg);
    // 文件消息有本地存储地址
    if(message.localPath) {
        message.localPath = message.localPath;
    }
    return message;
}

function resetInputFileValue(inputFile, changed, context) {
    var $inputFile = $(inputFile);
    var $newInputFile = $inputFile.clone();
    $newInputFile.val('');
    $inputFile.replaceWith($newInputFile);
    $newInputFile.change(function(event) {
        changed.call(context || this, event);
    });
}

function getBase64(blob, callback) {
    var fr = new FileReader();
    fr.onload = function(event) {
        var base64Str = event.target.result;
            base64Str = Base64Util.replace(base64Str);

        callback(base64Str);
    };
    fr.readAsDataURL(blob);
}

function getConversationInfo(conversation) {
    return {
        targetId: conversation.targetId,
        conversationType: conversation.conversationType
    };
}

function getBase64Size(base64Str){
    var str = base64Str;
    var equalIndex = str.indexOf('=');
    if(equalIndex > 0){
        str = str.substring(0, equalIndex);
    }
    var strLength = str.length;
    var size = parseInt(strLength-(strLength / 8) * 2);
    return size;
}

function uploadBase64(base64Str, context, im) {
    var fileApi = dataModel.File;
    var messageApi = dataModel.Message;
    var params = getConversationInfo(context.$route.params);
    params.data = base64Str;
    var uploadMessage = fileApi.createUploadMessage(params);

    var base64Config = im.config.upload.base64;
    var size = getBase64Size(base64Str);
    var base64Size = base64Config.size;
    if (size > base64Size) {
        common.messagebox({
            message: '截图大小超限，必须小于 ' + parseInt(base64Size / 1024) + 'KB'
        });
        return;
    }

    base64Config.data = UploadClient.dataType.data;
    var api = {
        file: fileApi,
        message: messageApi
    };
    upload(uploadMessage, base64Config, context, api);
}

function uploadFileList(fileList, context, im) {
    var fileApi = dataModel.File;
    var messageApi = dataModel.Message;
    var params = getConversationInfo(im.$route.params);

    for (var i = fileList.length - 1; i >= 0; i--) {
        var file = fileList[i];
        params.data = file;

        //localPath 为了兼容复制的本地文件,File 的 path 属性只读
        params.localPath = file.path || file.localPath;
        var uploadMessage = fileApi.createUploadMessage(params);
        var api = {
            file: fileApi,
            message: messageApi
        };
        upload(uploadMessage, im.config.upload.file, context, api);
    }
}

function upload(uploadMessage, config, context, api) {
    api.file.upload(uploadMessage, config, function (errorCode, uploadMessage, data) {
        if (errorCode) {
            return ;
        }

        api.file.addFileUrl(uploadMessage, data, function (errorCode, uploadMessage) {
            api.file.send(uploadMessage, function (errorCode, uploadMessage) {
                if (errorCode) {
                    var errMsg = common.getErrorMessage('lib-' + errorCode);
                    if (errorCode === RongIMLib.ErrorCode.NOT_IN_GROUP) {
                        var targetId = uploadMessage.targetId;
                        var conversationType = uploadMessage.conversationType;
                        var params = common.createNotificationMessage(conversationType, targetId, errMsg);
                        api.message.insertMessage(params);
                        context.$emit('setInGroup', false);
                    }
                } else {
                    var im = RongIM.instance;
                    im.$emit('messagechange');
                }
            });
        });
    });
}

function sendMessage(context) {
    var connected = context.status === utils.status.CONNECTED;
    if (!connected) {
        return;
    }
    var message = context.$refs.editor.getValue();
    if(utils.isEmpty(message.text.trim())) {
        return;
    }
    context.draft = '';
    context.$refs.editor.reset();
    context.panel = null;
    context.showEmojiPanel = false;
    context.$emit('sendMessage', message);
}

function messageInputChanged(context, value) {
    var connected = context.status === utils.status.CONNECTED;
    context.sendBtnAvailable = !utils.isEmpty((value || '').trim()) && connected;
}

var inputPaste = {
    pasteString: function (event, data, context) {
        data.str.getAsString(function (str) {
            var msg = decodeMessage(str);
            if (msg) {
                context.$emit('sendCopyMessage', msg);
            } else {
                context.$refs.editor.insertText(str);
            }
        });
        event.preventDefault();
    },
    pasteImage: function (event, data, context, im) {
        var hasString = !utils.isEmpty(data.str);
        var dataString = '';
        if (hasString) {
            data.str.getAsString(function (str) {
                dataString = str;
            });
        }
        getBase64(data.file, function(base64Str) {
            var base64 = Base64Util.concat(base64Str);
            RongIM.dialog.previewImage(base64, function (isConvertStr) {
                if (!context.$refs.editor) {
                    return;
                }
                if (isConvertStr) {
                    context.$refs.editor.insertText(dataString);
                    return;
                }
                context.$refs.editor.focus();
                uploadBase64(base64Str, context, im);
            });
        });
        event.preventDefault();
    },
    empty: function () {}
};

function paste(context, event, im) {
    var file = RongIM.file;
    var clipFile = file.getPathsFromClip();
    if(clipFile && clipFile.fileList.length > 0){
        // 判断如果是粘贴的单张图片则需要预览图片然后发送，多文件则直接上传发送
        var clipboardImg = file.getImgByPath();
        if (clipboardImg) {
            var reader = new FileReader();
            reader.addEventListener('load', function () {
                var base64 = reader.result;
                var base64Str = Base64Util.replace(base64);
                RongIM.dialog.previewImage(base64, function(){
                    if(context.$refs.editor) {
                        context.$refs.editor.focus();
                        uploadBase64(base64Str, context, im);
                    }
                });
            }, false);
            reader.readAsDataURL(clipboardImg);
        } else {
            uploadFileByPath(clipFile.fileList, context, im);
        }
        event.preventDefault();
        return;
    }

    /*
    chrome
    --------------- clipboardData
    属性
        dropEffect 拖拽相关属性
        effectAllowed 拖拽相关属性

    粘贴文件以下属性都为空，通过 C++ 处理粘贴文件
        files
        types
        items 与 types 一一对应
        getData('text')

    粘贴内容：
    files 属性都为空

        word:
            windows types ["text/plain", "text/html", "text/rtf"]
                    types ["text/plain", "text/html", "text/rtf"] 仅复制表格
                    types ["text/html", "Files"] 仅复制图片

            macOS   types ["text/plain", "text/html", "text/rtf"]
                    types ["text/plain", "text/html", "text/rtf", "Files"] 仅复制表格
                    types ["Files"] 仅复制图片

        excel: types ["text/plain", "text/html", "text/rtf", "Files"]
        ppt:   types ["Files"]
        pdf:   types ["text/plain", "text/html", "text/rtf"]
        text:  types ["text/plain"]
        md:    types ["text/plain"]
        截图:
               types ["Files"]

    items 内容说明
        text/plain
            纯文本不包含图片 file 表格
        text/html
            包含图片 <img src = ""file:///C:\Users\***\AppData\Local\Temp\ksohtml\wps87D8.tmp.jpg">

    --------------- Electron 内置 clipboard
        clipboard.readText
        clipboard.readHTML
        clipboard.readRTF
    */

    var clipboardData = event.clipboardData || window.clipboardData;
    var data = getPasteData(clipboardData);
    var table = isTable(clipboardData);
    var onlyImage = utils.isEmpty(clipboardData.getData('text'));

    var pasteImage = !utils.isEmpty(data.file) && (table || onlyImage);
    var preferenceText = RongIM.config.messageInputPastePreferenceText;
    var pasteString = !utils.isEmpty(data.str);
    var pasteHandler = 'empty';
    if (pasteString && pasteImage) {
        if (preferenceText) {
            pasteHandler = 'pasteString';
        } else {
            pasteHandler = 'pasteImage';
        }
    } else if (pasteString) {
        pasteHandler = 'pasteString';
    } else if (pasteImage) {
        pasteHandler = 'pasteImage';
    }
    inputPaste[pasteHandler](event, data, context, im);
}

function isTable(clipboardData) {
    // https://msdn.microsoft.com/zh-cn/library/windows/desktop/ms649015(v=vs.85).aspx
    var result = false;
    if (utils.isEmpty(clipboardData.items)) {
        return result;
    }
    var html = clipboardData.getData('text/html');

    var match = html.match(/<body[^>]*>([\s\S]*)<\/body>/);
    if (match) {
        html = match[1];
    }
    html = html.replace('<!--StartFragment-->', '');
    html = html.replace('<!--EndFragment-->', '');
    html = html.trim();

    var $hmlt = $(html);
    var onlyOne = $hmlt.length === 1;
    var tableEle = Object.prototype.toString.apply($hmlt.get(0)) === '[object HTMLTableElement]';
    if (onlyOne && tableEle) {
        result = true;
    }
    return result;
}

})(RongIM, {
    UploadClient: UploadClient,
    jQuery: jQuery
}, RongIM.components);
