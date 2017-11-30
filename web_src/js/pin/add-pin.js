'use strict';
(function (RongIM, dependencies, components) {
    var common = RongIM.common;
    var utils = RongIM.utils;
    var $ = dependencies.jQuery;
    var dialog = RongIM.dialog;
    var dataModel = RongIM.dataModel;
    var pinApi = dataModel.Pin;

    RongIM.dialog.addPin = function () {
        var im = RongIM.instance;
        var options = {
            name: 'add-pin',
            template: 'templates/pin/add-pin.html',
            data: getData,
            components: {
                avatar: components.getAvatar,
                org: components.group.getOrg,
                friend: components.group.getFriend,
                star: components.group.getStar
            },
            computed: {
                isStarSelected: function() {
                    return this.tab === 'star';
                },
                isOrgSelected: function() {
                    return this.tab === 'org';
                },
                isFriendSelected: function() {
                    return this.tab === 'friend';
                },
                isShowTimeSelect: function() {
                    return this.isTimeSelecting && !this.isSpecificTimeSelecting;
                }
            },
            methods: getMethods(im)
        };
        common.mountDialog(options);
    };

    function getData() {
        return {
            show: true,
            tab: 'org',
            selected: [],
            defaultSelected: $.extend(true, [], []),
            isTimeSelecting: false,
            isTypeSelecting: false,
            isSpecificTimeSelecting: false,
            selectedTime: 'Immediately',
            attachments: [],
            content: '',
            isSendSms: false
        };
    }

    function getMethods(im) {
        var getFileType = utils.getFileType;
        return {
            getSelectedCount: function() {
                var selectedContactFormat = im.locale.components.newPin.selectedContact;
                return this.localeFormat(selectedContactFormat, this.selected.length);
            },
            close: function() {
                this.show = false;
            },
            added: function(members) {
                added(this, members, im);
            },
            removed: function(members) {
                removed(this, members);
            },
            selectTab: function(tab) {
                this.tab = tab;
            },
            showSendTime: function() {
                this.isTimeSelecting = !this.isTimeSelecting;
                this.isSpecificTimeSelecting = false;
                this.isTypeSelecting = false;
            },
            showSendType: function() {
                this.isTypeSelecting = !this.isTypeSelecting;
                this.isTimeSelecting = false;
                this.isSpecificTimeSelecting = false;
            },
            getSelectedTime: function() {
                if (this.selectedTime === 'Immediately') {
                    return im.locale.components.newPin.immediatelySend;
                }
                var date = new Date(this.selectedTime);
                return formatDate(null, date);
            },
            getSelectedType: function() {
                var localeNewPin = im.locale.components.newPin;
                return this.isSendSms ? localeNewPin.sms : localeNewPin.app;
            },
            selectSendType: function(isSms) {
                this.isSendSms = isSms;
                this.isTypeSelecting = false;
            },
            selectImmediately: function() {
                this.selectedTime = 'Immediately';
                this.isTimeSelecting = false;
            },
            selectSpecificTime: function() {
                if ((Object.prototype.toString.call(this.selectedTime) !== '[object Number]')) {
                    this.selectedTime = (new Date()).getTime();
                }
                this.isSpecificTimeSelecting = true;
            },
            clickAddAttachment: function() {
                dialog.addAttachment(this);
            },
            getDateItems: function() {
                return ['年', '月', '日', '时', '分'];
            },
            getFormatDate: function(type) {
                var date = new Date(this.selectedTime);
                return formatDate(type, date);
            },
            calcDate: calcDate,
            addAttachment: function(event) {
                var fileList = event.target.files;
                fileList = checkAttachInBound(this, fileList);
                for (var i = 0; i < fileList.length; i++){
                    var file = fileList[i];
                    upload(getFileType(file.name), file, this, im);
                }
                resetInputFileValue('rongAddAttachment');
            },
            sendPin: function () {
                if(this.selected.length && this.content) {
                    sendPin(this, pinApi, im);
                }
            }
        };
    }

    function resetInputFileValue(inputId) {
        var $inputFile = $('#' + inputId);
        $inputFile.val('');
    }

    function checkAttachInBound(context, fileList) {
        var attachCount = context.attachments.length + fileList.length;
        var addCount = 10 - context.attachments.length;
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

    function sendPin(context, pinApi, im) {
        if (hasUploadingFile(context)) {
            common.messagebox({
                message: context.locale.components.newPin.uploading
            });
            return;
        }
        var params = getSendParams(context);
        pinApi.create(params, function(errorCode, result) {
            if (errorCode) {
                return common.handleError(errorCode);
            }
            context.close();
            common.messagebox({
                message: im.locale.components.newPin.success,
                closecallback: context.close
            });
            sendMessageWhenInSendpinPage(im, result, pinApi);
        });
    }

    function hasUploadingFile(context) {
        var attachments = context.attachments.filter(function(atta) {
            return atta.progress !== 100;
        });
        return attachments.length !== 0;
    }

    function getSendParams(context) {
        var reveiverIds = context.selected.map(function(reveiver) {
            return reveiver.id;
        });
        var attachments = context.attachments.map(function(atta) {
            return {
                name: atta.data.name,
                size: atta.data.size,
                mime_type: atta.data.type || 'unknown',
                url: atta.content.imageUri || atta.content.fileUrl
            };
        });
        var delayed = (Object.prototype.toString.call(context.selectedTime) === '[object Number]');
        var params = {
            content: context.content,
            receiver_ids: reveiverIds,
            delayed: delayed,
            attachments: attachments,
            send_sms: context.isSendSms
        };
        params['delayed_send_time'] = delayed ? context.selectedTime : '';
        return params;
    }

    function sendMessageWhenInSendpinPage(im, content, pinApi) {
        if (im.$route.name !=='pin-sent') {
            return;
        }
        content = $.extend(content, { creatorUid: content.creatorUid, timestamp: content.createDt});
        var message = {
            messageType: pinApi.MessageType.PinNotifyMessage,
            content: content
        };
        pinApi.observerList.notify(message);
    }

    function calcDate(dateType, addNumber) {
        var im = RongIM.instance;
        var date = new Date(this.selectedTime);
        switch(dateType) {
            case 0:
                var year = date.getFullYear();
                date.setFullYear(year + addNumber);
                break;
            case 1:
                var month = date.getMonth();
                date.setMonth(month + addNumber);
                break;
            case 2:
                var day = date.getDate();
                date.setDate(day + addNumber);
                break;
            case 3:
                var hour = date.getHours();
                date.setHours(hour + addNumber);
                break;
            case 4:
                var minute = date.getMinutes();
                date.setMinutes(minute + addNumber);
                break;
            default:
                break;
        }
        var thisTime = new Date().getTime();
        if (thisTime > date.getTime()) {
            common.messagebox({
                message: im.locale.components.newPin.pastTime
            });
            return;
        }
        this.selectedTime = date.getTime();
    }

    function formatDate(type, date) {
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();
        var hour = date.getHours();
        var minute = date.getMinutes();
        switch(type) {
            case 0:
                return year;
            case 1:
                return month;
            case 2:
                return day;
            case 3:
                return hour;
            case 4:
                return minute;
            default:
                var addZeroWhenSingle = function(number) {
                    return (number + '').length > 1 ? number : ('0' + number);
                };
                var hourMark = addZeroWhenSingle(hour);
                var minuteMark = addZeroWhenSingle(minute);
                return year + '/' + month + '/' + day + ' ' + hourMark + ':' + minuteMark;
        }
    }

    function added(context, members, im) {
        var selectedIdList = context.selected.map(function(item) {
            return item.id;
        });
        var addedList = members.filter(function(item) {
            var hasSelected = selectedIdList.indexOf(item.id) < 0;
            var notSelf = item.id !== im.loginUser.id;
            return hasSelected && notSelf;
        });
        var totalList = context.selected.concat(addedList);
        context.selected = totalList;
        if (totalList.length > 100) {
            common.messagebox({
                message: context.locale.components.newPin.mostReceive
            });
            removed(context, addedList);
        }
    }

    function removed(context, members) {
        var idList = members.map(function(item) {
            return item.id;
        });
        var reservedIdList = context.defaultSelected.map(function(item) {
            return item.id;
        });
        context.selected = context.selected.filter(function(item) {
            var reserved = reservedIdList.indexOf(item.id) >= 0;
            return reserved || idList.indexOf(item.id) < 0;
        });
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

})(RongIM, {
    jQuery: jQuery,
    UploadClient: UploadClient
}, RongIM.components);
