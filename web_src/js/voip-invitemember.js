'use strict';
(function (RongIM, dependencies, components) {

var common = RongIM.common;
var utils = RongIM.utils;
var $ = dependencies.jQuery;

RongIM.dialog.voipInviteMember = function(targetId, memberIdList){
    var im = RongIM.instance;
    var defer = $.Deferred();
    var options = {
        name: 'voip-invitemember',
        template: 'templates/voip-invitemember.html',
        data: function () {
            return {
                show: true,
                members: [],
                keyword: '',
                tip: '',
                defaultSelected: [],
                selected: []
            };
        },
        components: {
            avatar: components.getAvatar
        },
        mounted: function(){
            this.getGroupMembers();
        },
        computed: {
            filterList: function () {
                return getFilterList(this);
            },
            checkedAll: {
                get: function () {
                    return getCheckedAll(this);
                },
                set: function (value) {
                    setCheckedAll(this, value);
                }
            },
            indeterminate: function () {
                return (typeof this.checkedAll) !== 'boolean';
            }
        },
        methods: getMethods(im, targetId, memberIdList, defer)
    };
    common.mountDialog(options);

    return defer.promise();
};

function limitCount(context) {
    clearTimeout(limitCount.timer);
    context.tip = '邀请成员数不可超过 9 人';
    limitCount.timer = setTimeout(function () {
        context.tip = '';
    }, 1500);
}

function getFilterList(context) {
    var keyword = context.keyword;
    if(utils.isEmpty(keyword)) {
        return context.members;
    }
    return context.members.filter(function (item) {
        var list = [item.name, item.alias];
        return utils.searchName(list, keyword);
    });
}

function getCheckedAll(context) {
    var selected = [];
    var selectedIdList = context.selected.map(function (item) {
        return item.id;
    });
    context.filterList.forEach(function (item) {
        var existed = selectedIdList.indexOf(item.id) >= 0;
        existed && selected.push(item);
    });
    var length = selected.length;
    if (length > 0) {
        var isAll = length === context.filterList.length;
        return isAll ? true : null;
    }
    return false;
}

function setCheckedAll(context, value) {
    var switchUser;
    if (value === true || value === null) {
        switchUser = common.without(context.filterList, context.selected);
        context.selected = [].concat(context.selected, switchUser);
    } else {
        switchUser = common.without(context.filterList, context.defaultSelected);
        context.selected = common.without(context.selected, switchUser);
    }
}

function getMethods(im, groupId, memberIdList, defer){
    return {
        getUsername: common.getUsername,
        isDefault: function (item) {
            var idList = this.defaultSelected.map(function (item) {
                return item.id;
            });
            return idList.indexOf(item.id) >= 0;
        },
        getGroupMembers: function () {
            var params = {
                groupId: groupId,
                memberIdList: memberIdList || [im.auth.id]
            };
            getGroupMembers(this, im.dataModel.Group, params);
        },
        remove: function (index) {
            this.selected.splice(index, 1);
        },
        clear: function(){
            this.keyword = null;
        },
        inviteMembers: function () {
            var selected = this.selected;
            var maxMember = 9;
            if (selected.length > maxMember) {
                limitCount(this);
                return;
            }

            var inviteMembers = common.without(selected, this.defaultSelected);
            if (inviteMembers.length > 0) {
                defer.resolve(inviteMembers);
            } else{
                defer.reject();
            }
            this.show = false;
        },
        close: function () {
            defer.reject();
            this.show = false;
        }
    };
}

function getGroupMembers(context, groupApi, params) {
    groupApi.getMembers(params.groupId, function(errorCode, members) {
        if(errorCode) {
            return common.handleError(errorCode);
        }
        context.members = members;

        context.defaultSelected = context.members.filter(function (item) {
            return params.memberIdList.indexOf(item.id) !== -1;
        });

        context.selected = context.defaultSelected;
    });
}

})(RongIM, {
    jQuery: jQuery
}, RongIM.components);
