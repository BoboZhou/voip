'use strict';
(function (RongIM, dependencies, components) {

var common = RongIM.common;
var utils = RongIM.utils;
var moment = dependencies.moment;
var RongIMClient = dependencies.RongIMClient;

components.getHistory = function (resolve, reject) {
    var im = RongIM.instance;
    var dataModel = im.dataModel;
    var options = {
        name: 'history',
        template: 'templates/conversation/history.html',
        props: ['conversation'],
        data: function () {
            return {
                busy: true,
                messageType: '',
                keyword: '',
                count: 20,
                currentPage: 1,
                pageCount: '',
                total: 0,
                messageList: []
            };
        },
        computed: {
            filterList: function () {
                var list = [
                    'TextMessage',
                    'ImageMessage',
                    'FileMessage',
                    'VoiceMessage',
                    'LocationMessage',
                    'CardMessage',
                    'SightMessage'
                ];
                return this.messageList.filter(function (item) {
                    return list.indexOf(item.messageType) >= 0 && item.sentStatus !== RongIMLib.SentStatus.FAILED;
                });
            },
            supportSearch: function () {
                return im.config.support.search;
            },
            messageTypeClassName: function () {
                if(utils.isEmpty(this.messageType)) {
                    return 'all';
                }
                var map = {};
                map[RongIMClient.MessageType.FileMessage] = 'file';
                return map[this.messageType];
            }
        },
        components: {
            avatar: components.getAvatar,
            TextMessage: components.getTextMessage,
            ImageMessage: components.getImageMessage,
            FileMessage: components.getFileMessage,
            VoiceMessage: components.getVoiceMessage,
            LocationMessage: components.getLocationMessage,
            CardMessage: components.getCardMessage,
            SightMessage: components.getSightMessage,
            UnknownMessage: components.getUnknownMessage
        },
        directives: {
            autoScrolltotop: function (ele) {
                ele.scrollTop = 0;
            }
        },
        watch: {
            keyword: function () {
                toggle(this, dataModel.Message);
            },
            messageType: function () {
                toggle(this, dataModel.Message);
            }
        },
        mounted: function () {
            var context = this;
            im.$on('imclick', context.close);
            toggle(this, dataModel.Message);
            getAllFileList(this, dataModel.Message);
        }
    };

    options.methods = {
        clear: function () {
            this.keyword = '';
        },
        getUsername: common.getUsername,
        dateFormat: function (timestamp, format) {
            return moment(timestamp).format(format);
        },
        getMessageType: function (item) {
            var supported = options.components[item.messageType];
            return supported ? item.messageType : 'UnknownMessage';
        },
        showFileMessage: function() {
            this.messageType = RongIMClient.MessageType.FileMessage;
        },
        next: function () {
            if (this.pageCount === this.currentPage) {
                return;
            }
            this.currentPage++;
            getCurrentPageMessage(this, dataModel.Message);
        },
        prev: function () {
            if (this.currentPage === 1) {
                return;
            }
            this.currentPage--;
            getCurrentPageMessage(this, dataModel.Message);
        },
        close: function () {
            this.$emit('hidepanel');
            im.$off('imclick', this.close);
        }
    };

    utils.asyncComponent(options, resolve, reject);
};

var cacheMessageList = [];

function toggle(context, messageApi) {
    cacheMessageList = [];
    context.pageCount = 0;
    context.currentPage = 1;
    getCurrentPageMessage(context, messageApi);
}

var allFileList = [];
function getAllFileList(context, messageApi) {
    var routeParams = context.$route.params;
    allFileList = [];
    var params = {
        conversationType: Number(routeParams.conversationType),
        targetId: routeParams.targetId,
        count: context.count,
        position: 2,
        type: 'FileMessage',
        timestamp: 0
    };
    function getFile() {
        messageApi.get(params, function (errorCode, list, hasMore) {
            if(errorCode) {
                return common.handleError(errorCode);
            }
            list.reverse();
            allFileList = allFileList.concat(list);
            if (hasMore) {
                params.timestamp = allFileList.slice(-1)[0].sentTime;
                getFile();
            }
        });
    }
    getFile();
}

function getCurrentPageMessage(context, messageApi)  {
    var currentPage = context.currentPage;
    var count = context.count;
    var start = (currentPage - 1) * count;
    var end = currentPage * count;
    if (context.messageType === 'FileMessage') {
        // C++ SDK 不支持文件消息关键字搜索。全部获取在内存中搜索。
        var notSearch = utils.isEmpty(context.keyword);
        if (notSearch) {
            context.pageCount = Math.ceil(allFileList.length / context.count) || 1;
            context.messageList = allFileList.slice(start, end);
        } else {
            searchFile(context, start, end);
        }
    } else {
        var cacheHas = cacheMessageList.length > start;
        if (cacheHas) {
            context.messageList = cacheMessageList.slice(start, end);
        } else {
            var earliest = cacheMessageList.slice(-1)[0];
            var timestamp = earliest ? earliest.sentTime : 0;
            getMessage(context, messageApi, timestamp);
        }
    }
}

function getMessage(context, messageApi, timestamp) {
    var routeParams = context.$route.params;
    var params = {
        conversationType: Number(routeParams.conversationType),
        targetId: routeParams.targetId,
        timestamp: timestamp,
        count: context.count
    };
    if (context.keyword) {
        params.keyword = context.keyword;
        messageApi.search(params, function (errorCode, list, total) {
            context.busy = false;
            if(errorCode) {
                return common.handleError(errorCode);
            }
            list.reverse();
            cacheMessageList = cacheMessageList.concat(list);
            context.messageList = list;
            context.pageCount = Math.ceil(total / context.count) || 1;
        });
    } else {
        params.position = 2;
        params.type = context.messageType;

        messageApi.get(params, function (errorCode, list, hasMore) {
            context.busy = false;
            if(errorCode) {
                return common.handleError(errorCode);
            }
            list.reverse();
            cacheMessageList = cacheMessageList.concat(list);
            context.messageList = list;

            if (hasMore) {
                context.pageCount = 0;
            } else {
                context.pageCount = context.currentPage;
            }
        });
    }
}

function searchFile(context, start, end) {
    var arr = allFileList.filter(function (item) {
        return item.content.name.indexOf(context.keyword) !== -1;
    });
    context.pageCount = Math.ceil(arr.length / context.count) || 1;
    arr = arr.slice(start, end);
    context.messageList = arr;
}

})(RongIM, {
    jQuery: jQuery,
    moment: moment,
    RongIMClient: RongIMClient
}, RongIM.components);
