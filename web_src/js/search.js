'use strict';
(function (RongIM, dependencies, components) {

var $ = dependencies.jQuery;
var Vue = dependencies.Vue;
var dialog = RongIM.dialog;
var common = RongIM.common;
var utils = RongIM.utils;
var selectIndex = 0;

var messageSearch = {
    TextMessage: function (message, keyword) {
        var str = message.content.content;
        return getSubstrHighlight(str, keyword);
    },
    FileMessage: function (message, keyword) {
        var str = message.content.name;
        // 7 - 页面最多可容纳字符长度
        return getSubstrHighlight(str, keyword, 7);
    },
    RichContentMessage: function (message, keyword) {
        var str = message.content.title;
        return getSubstrHighlight(str, keyword, 7);
    }
};

var keywordChanged = utils.debounce(function (context, value) {
    context.currentView = '';
    context.showHistoryDetail = false;
    if(utils.isEmpty(value)) {
        return context.clear();
    }
    context.getContacts();
    context.getGroups();
    context.getHistory();
}, 300);

components.getSearch = function (resolve, reject) {
    var im = RongIM.instance;
    var dataModel = im.dataModel;
    var options = {
        name: 'search',
        template: 'templates/search.html',
        data: function () {
            return {
                isShowMenu: false,
                currentView: '', /*'contacts' or 'groups' or `history`*/
                keyword: '',
                contacts: [],
                groups: [],
                history: [],
                searchHistoryDetail: {
                    list: [],
                    count: 0
                },
                showHistoryDetail: false,
                curItem: null,
                busy: {
                    contacts: false,
                    groups: false,
                    history: false
                }
            };
        },
        computed: {
            isEmpty: function () {
                var noResult = this.contacts.length + this.groups.length + this.history.length === 0;
                return this.keyword.length > 0 && noResult;
            },
            showContacts: function () {
                if(utils.isEmpty(this.currentView)) {
                    return this.contacts.length > 0;
                }
                return this.currentView === 'contacts';
            },
            showGroups: function () {
                if(utils.isEmpty(this.currentView)) {
                    return this.groups.length > 0;
                }
                return this.currentView === 'groups';
            },
            showHistory: function () {
                if(utils.isEmpty(this.currentView)) {
                    return this.history.length > 0;
                }
                return this.currentView === 'history' && this.showHistoryDetail === false;
            },
            isBusy: function () {
                var busy = this.busy;
                return busy.contacts || busy.groups || busy.history;
            }
        },
        components: {
            avatar: components.getAvatar
        },
        directives: {
            scrollTop: function (el) {
                Vue.nextTick(function () {
                    $(el).scrollTop(0);
                });
            }
        },
        created: function () {
            if(utils.isEmpty(this.keyword)) {
                return;
            }
            this.getContacts();
            this.getGroups();
            this.getHistory();
        },
        watch: {
            $route: function () {
                this.clear();
            },
            keyword: function (value) {
                initSearch(this);
                keywordChanged(this, value);
            },
            currentView: function () {
                initSearch(this);
                this.focus();
            }
        },
        methods: {
            showMenu: function () {
                this.isShowMenu = true;
                im.$on('imclick', this.hideMenu);
            },
            hideMenu: function () {
                this.isShowMenu = false;
                im.$off('imclick', this.hideMenu);
            },
            focus: function () {
                if(this.$refs.searchBox) {
                    this.$refs.searchBox.focus();
                }
            },
            getUsername: common.getUsername,
            getGroupName: common.getGroupName,
            createGroup: function(){
                var userId = im.auth.id;
                dataModel.User.getBatch([userId], function(errorCode, list){
                    dialog.createGroup(null, list);
                });
            },
            addFriend: function(){
                dialog.addFriend();
            },
            addPin: function() {
                dialog.addPin();
            },
            clear: function () {
                this.keyword = '';
                this.contacts = [];
                this.groups = [];
                this.history = [];
            },
            getContacts: function () {
                getContacts(this, dataModel.Organization, dataModel.User);
            },
            getGroups: function () {
                getGroups(this, dataModel.Group, dataModel.Conversation);
            },
            getHighlightUsername: function (user) {
                return this.highlight(common.getSearchUsername(user));
            },
            getHighlightGroupName: function (group) {
                return this.highlight(common.getGroupName(group));
            },
            getMatchedMembers: function (group) {
                return getMatchedMembers(this, group);
            },
            highlight: function (name) {
                return common.highlight(name, this.keyword);
            },
            showConversation: function (conversationType, targetId) {
                var params = {
                    conversationType: conversationType,
                    targetId: targetId
                };
                this.currentView = '';
                this.$router.push({
                    name: 'conversation',
                    params: params
                });
                var conversationApi = dataModel.Conversation;
                conversationApi.add(params);
                this.clear();
                var itemId = ['conversation', conversationType, targetId].join('-');
                var item = document.getElementById(itemId);
                if (item) {
                    var parentHeight = item.parentNode.offsetHeight;
                    var offsetTop = item.offsetTop;
                    var alginWithTop = offsetTop > parentHeight;
                    item.scrollIntoView(alginWithTop);
                }
            },
            getHistory: function () {
                getHistory(this, dataModel.Conversation);
            },
            showDeatil: function (item) {
                var context = this;
                if (item.search.count === 1) {
                    gotoMessage(context, item.search.list[0]);
                    return ;
                }
                context.showHistoryDetail = true;
                context.searchHistoryDetail = {
                    user: item.user,
                    group: item.group,
                    list: [],
                    count: item.search.count
                };
                dataModel.Message.addSendUserInfo(item.search.list, function (errorCode, list) {
                    context.searchHistoryDetail.list = list;
                });
            },
            gotoMessage: function (message) {
                gotoMessage(this, message);
            },
            getSearchStr: function (message) {
                var locale = this.locale;
                var prefix = locale.message.prefix[message.messageType] || '';
                return prefix + messageSearch[message.messageType](message, this.keyword, locale);
            },
            up: function () {
                if(selectIndex > 0){
                   selectIndex--;
                }
                var item = getItem(this, selectIndex);
                this.curItem = item;
            },
            down: function () {
                var lenObj = getListLen(this);
                if(selectIndex < lenObj.all - 1){
                    selectIndex++;
                }
                var item = getItem(this, selectIndex);
                this.curItem = item;
            },
            enter: function () {
                var selectItem = this.curItem || getItem(this, selectIndex);
                switch (selectItem.type) {
                    case 1:
                        this.showConversation(1, selectItem.item.id);
                        break;
                    case 2:
                        this.showConversation(3, selectItem.item.id);
                        break;
                    case 3:
                        this.showDeatil(selectItem.item);
                        break;
                    default:
                }
            },
            isEqual: function (item, type) {
                type = +type;
                var selectItem = this.curItem || getItem(this, selectIndex);
                if(!selectItem){
                    return false;
                }
                var selected = selectItem.item;
                if (selectItem.type !== type) {
                    return false;
                }
                var equal = false;
                switch (selectItem.type) {
                    case 1:
                        equal = selected.id === item.id;
                        break;
                    case 2:
                        equal = selected.id === item.id;
                        break;
                    case 3:
                        equal = common.sameConversaton(item, selected);
                        break;
                    default:
                }
                return equal;
            }
        }
    };
    utils.asyncComponent(options, resolve, reject);
};

function initSearch(context) {
    selectIndex = 0;
    context.curItem = null;
    context.busy.contacts = true;
    context.busy.groups = true;
    context.busy.history = true;
}

function gotoMessage(context, message) {
    var router = context.$router;
    context.currentView = '';
    router.push({
        name: 'conversation',
        params: {
            conversationType: message.conversationType,
            targetId: message.targetId,
            focus: true
        },
        query: {
            timestamp: (new Date).getTime(),
            messageUId: message.messageUId
        }
    });
}

function getSubstrHighlight(str, keyword, maxLength) {
    maxLength = maxLength || 10;
    str = str.replace(/\r\n/g, '');
    str = str.replace(/\n/g, '');
    var keyLength = utils.getLength(keyword);
    var startStr = str.substring(0, str.indexOf(keyword));
    var startLength = utils.getLength(startStr);
    var result = '';
    if (startLength + keyLength > maxLength) {
        var i = (maxLength - keyLength) / 2;
        var move = i > 0 ? i : 0;
        var start = utils.slice(str, startLength - move).length;
        result =  '...' + str.substring(start);
    } else {
        result = str;
    }
    result = utils.encodeHtmlStr(result);
    result = result.replace(keyword, '<em>' + keyword + '</em>');
    return result;
}

function getContacts(context, orgApi, userApi) {
    var busy = context.busy;
    busy.contacts = true;
    orgApi.search(context.keyword, function (errorCode, list) {
        busy.contacts = false;
        if(errorCode) {
            return common.handleError(errorCode);
        }
        common.searchAlias(list, context.keyword, userApi);
        common.sortUsers(list);
        context.contacts = list;
    });
}

function getGroups(context, groupApi, conversationApi) {
    var groupDefer = $.Deferred();
    var busy = context.busy;
    busy.groups = true;
    groupApi.getList(function (errorCode, groups) {
        if(errorCode) {
            return groupDefer.reject(errorCode);
        }
        groupDefer.resolve(groups);
    });

    $.when(groupDefer.promise())
        .then(function (favGroups) {
            var conversationList = conversationApi.getLocalList();
            conversationList = conversationList.filter(function (item) {
                return item.conversationType === utils.conversationType.GROUP;
            });
            var list = [].concat(favGroups);
            var groupIds = list.map(function (item) {
                return item.id;
            });
            conversationList.forEach(function (conversation) {
                var existed = groupIds.indexOf(conversation.targetId) >= 0;
                if(!existed) {
                    var group = utils.toJSON(conversation.group);
                    group.id = conversation.targetId;
                    list.push(group);
                }
            });
            context.groups = list.filter(function (group) {
                var matchName = utils.searchName([group.name, context.getGroupName(group)], context.keyword);
                var matchMembers = getMatchedMembers(context, group).length > 0;
                return matchName || matchMembers;
            });

        }).fail(function (errorCode) {
            common.handleError(errorCode);
        }).always(function () {
            busy.groups = false;
        });
}

function getMatchedMembers(context, group) {
    var keyword = context.keyword;
    if(utils.isEmpty(keyword)) {
        return '';
    }
    var memberNames = group.memberNames || [];
    var members = memberNames.filter(function (name) {
        return utils.searchName([name], keyword);
    }).map(function (name) {
        return context.highlight(name);
    });

    if(members.length > 0) {
        return members.join('，');
    }
    return '';
}

function getHistory(context, conversationApi) {
    if (context.keyword !== '') {
        var busy = context.busy;
        busy.history = true;
        conversationApi.search(context.keyword, function (errorCode, list) {
            busy.history = false;
            list.sort(function (one, another) {
                return another.sentTime - one.sentTime;
            });
            context.history = list;
        });
    }
}

function getListLen(context){
    var length = {
        contacts: Math.min(context.contacts.length, 3),
        groups: Math.min(context.groups.length, 3),
        history: Math.min(context.history.length, 3)
    };

    if (length[context.currentView]) {
        length = {
            contacts: 0,
            groups: 0,
            history: 0
        };
        length[context.currentView] = context[context.currentView].length;
    }

    length.all = length.contacts + length.groups + length.history;
    return length;
}

function getItem(context, index){
    var lenObj = getListLen(context);
    var item = {};
    var thisIndex = index;
    if(index < lenObj.contacts){
        item = {type: 1, item: context.contacts[thisIndex]};
    } else if(index < lenObj.contacts + lenObj.groups){
        thisIndex = thisIndex - lenObj.contacts;
        item = {type: 2, item: context.groups[thisIndex]};
    } else {
        thisIndex = thisIndex - lenObj.contacts - lenObj.groups;
        item = {type: 3, item: context.history[thisIndex]};
    }
    return item;
}

})(RongIM, {
    jQuery: jQuery,
    Vue: Vue
}, RongIM.components);
