'use strict';
(function (RongIM) {
    var common = RongIM.common;
    var utils = RongIM.utils;

    RongIM.dialog.addAttachment = function(context) {
        var addPin = context;
        var im = RongIM.instance;
        var options = {
            name: 'add-attachment',
            template: 'templates/pin/add-attachment.html',
            data: function() {
                return {
                    show: true
                };
            },
            computed: {
                attachments: function() {
                    return addPin.attachments;
                }
            },
            methods: getMethods(im, addPin)
        };
        common.mountDialog(options);
    };

    function getMethods(im, addPin) {
        var getFileType = utils.getFileType;
        var formatFileSize = utils.formatFileSize;
        return {
            close: function() {
                this.show = false;
            },
            addAttachment: function(event) {
                var fileList = event.target.files;
                fileList = checkAttachInBound(addPin, fileList);
                for (var i = 0; i < fileList.length; i++){
                    var file = fileList[i];
                    var fileType = getFileType(file.name);
                    upload(fileType, file, addPin, im);
                }
                resetInputFileValue('rongAddAttachment');
            },
            formatFileSize: formatFileSize,
            removeAttachment: function(attachment) {
                addPin.attachments = addPin.attachments.filter(function(atta) {
                    return attachment !== atta;
                });
            },
            getFileIconClass: function(name) {
                var prefix = 'rong-pin-file-';
                var getPointTotal = name.split('.').length - 1;
                var splitArr = name.split('.');
                return prefix + splitArr[getPointTotal];
            },
            getProgressWidth: function(attach) {
                attach.progress = attach.progress || 0;
                return attach.progress + '%';
            },
            isShowProgress: function(attach) {
                return attach.progress !== 100;
            },
            getProgress: function(attach) {
                return parseInt(attach.progress) + '%';
            },
            getAttachName: function(name) {
                var length = getNameLength(name);
                if (length > 27) {
                    var splitLength = name.length * 27 / length / 2;
                    var head = name.substring(0, splitLength);
                    var foot = name.substring(name.length - splitLength, name.length);
                    return head + '...' + foot;
                }
                return name;
            }
        };
    }

    function getNameLength(name) {
        var isChinese = function(t) {
            var re=/[^\u4e00-\u9fa5]/;
            if(re.test(t)) {
                return false;
            }
            return true;
        };
        var mark = 0;
        for (var i = 0; i < name.length; i++) {
            var cName = name[i];
            mark += isChinese(cName) ? 2 : 1;
        }
        return mark;
    }

    function resetInputFileValue(inputId) {
        var $inputFile = $('#' + inputId);
        $inputFile.val('');
    }

    function checkAttachInBound(context, fileList) {
        var attachLength = context.attachments.length;
        var attachCount = attachLength + fileList.length;
        var addCount = 10 - attachLength;
        if (attachCount > 10) {
            common.messagebox({
                message: context.locale.components.newPin.mostAtta
            });
            var list = [];
            for (var i = 0; i < fileList.length; i++) {
                if (i < addCount) {
                    list.push(fileList[i]);
                }
            }
            fileList = list;
        }
        return fileList;

    }

    function upload(type, fileData, context, im) {
        var config = im.config.upload.file;
        var api = im.dataModel;
        var attach = api.File.createUploadMessage({
            data: fileData,
            localPath: fileData.path
        });
        context.attachments.push(attach);
        api.File.upload(attach, config, function (errorCode, uploadMessage, data) {
            if (errorCode) {
                return ;
            }

            api.File.addFileUrl(uploadMessage, data, function() {});
        });
    }

})(RongIM);
