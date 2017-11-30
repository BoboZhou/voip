'use strict';
(function (RongIM, dependencies, components) {

var common = RongIM.common;
var utils = RongIM.utils;
var dialog = RongIM.dialog;

components.getGroupSetting = function (resolve, reject) {
    var im = RongIM.instance;
    var dataModel = im.dataModel;
    var options = {
        name: 'group-setting',
        template: 'templates/conversation/group-setting.html',
        props: ['group'],
        data: function () {
            var params = im.$route.params;
            return {
                nameEditable: false,
                isSearch: false,
                searchName: null,
                groupNameField: '',
                conversation: {
                    conversationType: params.conversationType,
                    targetId: params.targetId,
                    group: {}
                }
            };
        },
        components: {
            avatar: components.getAvatar
        },
        mounted: function () {
            var api = {
                user: dataModel.User,
                group: dataModel.Group,
                conversation: dataModel.Conversation
            };
            mounted(this, api, im);
        },
        computed: getComputed(dataModel),
        directives: {
            focus: {
                inserted: function (el) {
                    el.focus();
                }
            }
        },
        methods: getMethods(im)
    };
    utils.asyncComponent(options, resolve, reject);
};

function mounted(context, api, im) {
    var group = context.group;
    var groupApi = api.group;
    var conversationApi = api.conversation;
    im.$on('imclick', context.close);
    conversationApi.getOne(context.conversation.conversationType, context.conversation.targetId, function (errorCode, conversation) {
        context.conversation = conversation;
    });
    groupApi.getList(function (errorCode, groupList) {
        if(errorCode) {
            return common.handleError(errorCode);
        }
        var idList = groupList.map(function (item) {
            return item.id;
        });
        Vue.set(context.group, 'saved', idList.indexOf(group.id) >= 0);
    });
}

function getComputed(dataModel) {
    var conversationApi = dataModel.Conversation;
    var groupApi = dataModel.Group;
    return {
        isTop: {
            get: function () {
                return this.conversation.isTop;
            },
            set: function (checked) {
                var context = this;
                var action = checked ? 'top' : 'untop';
                var conversation = this.conversation;
                conversationApi[action](conversation.conversationType, conversation.targetId, function (errorCode) {
                    if(errorCode) {
                        return common.handleError(errorCode);
                    }
                    context.$emit('set-property', 'isTop', checked);
                });
            }
        },
        isMute: {
            get: function () {
                return this.conversation.notificationStatus;
            },
            set: function (checked) {
                var context = this;
                var action = checked ? 'mute' : 'unmute';
                var conversation = context.conversation;
                conversationApi[action](conversation.conversationType, conversation.targetId, function (errorCode) {
                    if(errorCode) {
                        return common.handleError(errorCode);
                    }
                    context.$emit('set-property', 'notificationStatus', checked);
                });
            }
        },
        isSaved: {
            get: function () {
                return this.conversation.group.saved;
            },
            set: function (checked) {
                var context = this;
                var action = checked ? 'addToFav': 'removeFromFav';
                var groupId = context.conversation.group.id;
                groupApi[action]([groupId], function (errorCode) {
                    if(errorCode) {
                        return common.handleError(errorCode);
                    }
                    context.$emit('set-property', 'group.saved', checked);
                });
            }
        },
        isCustomGroup: function () {
            return this.group.type === 0;
        },
        isEntGroup: function () {
            return this.group.type === 1 || this.group.type === 2;
        },
        filterMembers: function () {
            return getFilterMembers(this);
        },
        showSave: function () {
            return this.isCustomGroup;
        },
        showAdd: function () {
            return !this.searchName && this.isCustomGroup;
        },
        showRemove: function () {
            return !this.searchName && this.group.isCreator && this.isCustomGroup;
        },
        showQuit: function () {
            return this.isCustomGroup;
        },
        showEdit: function () {
            return this.group.isCreator && this.isCustomGroup;
        }
    };
}

function getMethods(im) {
    var dataModel = im.dataModel;
    var conversationApi = dataModel.Conversation;
    return {
        getGroupName: function () {
            return common.getGroupName(this.group);
        },
        getUsername: function (item) {
            return common.getSearchUsername(item);
        },
        setEditable: function () {
            this.groupNameField = this.getGroupName();
            this.nameEditable = true;
        },
        saveName: function () {
            saveName(this, dataModel.Group, this.group);
        },
        removeEditable: function () {
            this.nameEditable = false;
        },
        setIsSearch: function () {
            this.isSearch = true;
        },
        clearSearch: function () {
            this.searchName = '';
            this.isSearch = false;
        },
        searchFocus: function () {
            var field = this.$refs.searchName;
            this.isSearch && field.focus();
        },
        delConversation: function () {
            var context = this;
            var conversationType = utils.conversationType.GROUP;
            var groupId = context.group.id;
            conversationApi.clearUnReadCount(conversationType, groupId);
            conversationApi.remove(conversationType, groupId);
        },
        quitGroup: function(callback){
            var groupId = this.group.id;
            dataModel.Group.quit(groupId, callback);
        },
        dismissGroup: function(callback){
            dataModel.Group.dismiss(this.group.id, callback);
        },
        delAndQuit: function () {
            delAndQuit(this, im.$router);
        },
        addMember: function () {
            dialog.createGroup(this.group.id, this.group.members);
        },
        removeMembers: function () {
            dialog.groupRemoveMembers(this.group.id);
        },
        close: function () {
            this.$emit('hidepanel');
            im.$off('imclick', this.close);
        },
        userProfile: dialog.user
    };
}

// function toggleSave(groupApi, checked, groupId) {
//     var action = checked ? 'addToFav': 'removeFromFav';
//     groupApi[action]([groupId], function (errorCode) {
//         if(errorCode) {
//             return common.handleError(errorCode);
//         }
//     });
// }

function getFilterMembers(context) {
    var keyword = context.searchName;
    var members = context.group.members;
    if(utils.isEmpty(keyword)) {
        return members;
    }
    return members.filter(function (item) {
        return utils.searchName([item.name, item.alias], keyword);
    });
}

function saveName(context, groupApi, group) {
    var MAX_LENGTH = 16;
    var newGroupName = utils.slice(context.groupNameField, MAX_LENGTH);
    var changed = newGroupName !== context.group.name && !utils.isEmpty(newGroupName);
    if(context.nameEditable && changed) {
        groupApi.rename(group.id, newGroupName, function (errorCode) {
            if(errorCode) {
                return common.handleError(errorCode);
            }
            group.name = newGroupName;
        });
    }
    context.removeEditable();
}

function delAndQuit(context, router) {
    context.quitGroup(function(errorCode/*, result*/) {
        if(errorCode) {
            return common.handleError(errorCode);
        }
        common.messagebox({
            message: common.getErrorMessage('contact-5'),
            callback: function () {
                context.delConversation();
                router.push({
                    name: 'conversation',
                    query: {
                        force: 1
                    }
                });
            },
            closecallback: function () {
                this.callback();
            }
        });
    });
}

})(RongIM, {
    jQuery: jQuery
}, RongIM.components);
