'use strict';
(function (RongIM, dependencies, components) {

var common = RongIM.common;
var utils = RongIM.utils;

RongIM.dialog.groupRemoveMembers = function(targetId){
    var im = RongIM.instance;
    var options = {
        name: 'group-removemembers',
        template: 'templates/group/removemembers.html',
        data: function () {
            return {
                show: true,
                members: [],
                keyword: '',
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
        methods: getMethods(im, targetId)
    };

    common.mountDialog(options);
};

function getFilterList(context) {
    var keyword = context.keyword;
    var filterList;
    if(utils.isEmpty(keyword)) {
        filterList = context.members;
    } else {
        filterList = context.members.filter(function (item) {
            var list = [item.name, item.alias];
            return utils.searchName(list, keyword);
        });
    }
    return filterList;
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
    var result;
    if(length > 0) {
        var isAll = length === context.filterList.length;
        result = isAll ? true : null;
    } else {
        result = false;
    }
    return result;
}

function setCheckedAll(context, value) {
    if(value) {
        context.selected = [].concat(context.filterList, context.selected);
    } else {
        context.selected = common.without(context.selected, context.filterList);
    }
}

function getMethods(im, groupId){
    return {
        getUsername: common.getUsername,
        getGroupMembers: function () {
            var params = {
                groupId: groupId,
                authId: im.auth.id
            };
            getGroupMembers(this, im.dataModel.Group, params);
        },
        remove: function (index) {
            this.selected.splice(index, 1);
        },
        clear: function(){
            this.keyword = null;
        },
        removeMembers: function () {
            removeMembers(this, im.dataModel.Group, groupId);
        },
        close: function () {
            this.show = false;
        }
    };
}

function getGroupMembers(context, groupApi, params) {
    groupApi.getMembers(params.groupId, function(errorCode, members) {
        if(errorCode) {
            return common.handleError(errorCode);
        }
        context.members = members.filter(function(item/*, index, arr*/) {
            return item.id !== params.authId;
        });
    });
}

// function selectAll(val, context) {
//     var arrSelect = [];
//     var arrMembers = $.extend(true, [], context.members);
//     arrMembers.forEach(function (member, index, arr) {
//         if(val){
//             arrSelect.push(member.id);
//         }
//     });
//     context.selected = arrSelect;
//     context.members = arrMembers;
//     context.isSelectAll = val;
// }

function removeMembers(context, groupApi, groupId) {
    if(context.selected.length < 1){
        common.messagebox({
            message: context.locale.selectNone
        });
        return;
    }
    var memberIdList = context.selected.map(function (item) {
        return item.id;
    });
    groupApi.removeMembers(groupId, memberIdList, function(errorCode){
        if(errorCode) {
            return common.handleError(errorCode);
        }
        common.messagebox({
            message: context.locale.delMemberSuccess,
            closecallback: context.close,
            callback: function () {
                context.show = false;
            }
        });
    });
}
})(RongIM, {
    jQuery: jQuery
}, RongIM.components);
