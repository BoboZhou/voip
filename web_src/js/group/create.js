'use strict';
(function (RongIM, dependencies, components) {

var common = RongIM.common;
var utils = RongIM.utils;
var $ = dependencies.jQuery;
var counter = 0;

RongIM.dialog.createGroup = function(groupId, members) {
    members = members.map(function (item) {
        return common.unifyUser(item);
    });
    var im = RongIM.instance;
    var dataModel = im.dataModel;
    var options = {
        name: 'group-create',
        template: 'templates/group/create.html',
        data: function () {
            return {
                groupId: groupId,
                show: true,
                groupName: '',
                // 'star' or 'org'
                tab: 'org',
                defaultSelected: $.extend(true, [], members),
                busy: false,
                selected: [],
                isStaff: im.auth.isStaff
            };
        },
        components: {
            avatar: components.getAvatar,
            star: components.group.getStar,
            org: components.group.getOrg,
            friend: components.group.getFriend
        },
        computed: {
            groupIdExisted: function () {
                return !utils.isEmpty(this.groupId);
            }
        },
        created: function () {
            this.selected = [].concat(this.defaultSelected);
            if(!this.isStaff){
                this.tab = 'star';
            }
        },
        directives: {
            autoScroll: function (el) {
                counter++;
                if(counter < 4){
                    return;
                }
                Vue.nextTick(function () {
                    var $el = $(el);
                    var height = $el.children().outerHeight();
                    $el.scrollTop(height);
                });
            }
        },
        methods: getMethods(dataModel, im)
    };
    common.mountDialog(options, function (instance) {
        RongIM._groupInstance = instance;
    });
};

function getMethods(dataModel, im) {
    return {
        close: function () {
            this.show = false;
        },
        setTab: function (tab) {
            this.tab = tab;
        },
        isDefault: function (item) {
            var idList = this.defaultSelected.map(function (_item) {
                return _item.id;
            });
            return idList.indexOf(item.id) >= 0;
        },
        removeMembers: function (members) {
            removeMembers(this, members);
        },
        added: function (members) {
            added(this, members);
        },
        removed: function (members) {
            removed(this, members);
        },
        getGroupName: function () {
            return getGroupName(this);
        },
        getUsername: common.getUsername,
        createGroup: function () {
            createGroup(this, dataModel.Group, im);
        },
        addMembers: function () {
            addMembers(this, dataModel.Group, this.groupId);
        }
    };
}

function added(context, members) {

    var selectedIdList = context.selected.map(function (item) {
        return item.id;
    });
    var addedList = members.filter(function (item) {
        return selectedIdList.indexOf(item.id) < 0;
    });
    context.selected = context.selected.concat(addedList);
}

function removed(context, members) {
    var idList = members.map(function (item) {
        return item.id;
    });
    var reservedIdList = context.defaultSelected.map(function (item) {
        return item.id;
    });
    context.selected = context.selected.filter(function (item) {
        var reserved = reservedIdList.indexOf(item.id) >= 0;
        return reserved || idList.indexOf(item.id) < 0;
    });
}

function removeMembers(context, members) {
    members = [].concat(members);
    var idList = members.map(function (item) {
        return item.id;
    });
    context.selected = context.selected.filter(function (item) {
        return idList.indexOf(item.id) < 0;
    });
}

function getGroupName(context) {
    var groupName;
    if(context.groupName) {
        groupName = context.groupName;
    } else {
        var MAX_LENGTH = 16;
        var memberNames = context.selected;
        memberNames = memberNames.slice(0, MAX_LENGTH)
            .map(function (item) {
                return item.name;
            });
        var group = {
            memberNames: memberNames
        };
        groupName = common.getGroupName(group);
    }
    return groupName;
}

function createGroup(context, groupApi, im) {
    if (context.busy) {
        return;
    }
    var groupNameLength = context.groupName.length;
    if(groupNameLength > 0 && context.groupName.length < 2) {
        return common.messagebox({
            message: context.locale.groupNameErr
        });
    }
    var memberIdList = context.selected.map(function (item) {
        return item.id;
    });

    var group = {
        // 0: 自建群, 1: 官方群
        type: 0,
        name: context.getGroupName(),
        member_ids: memberIdList
    };

    context.busy = true;
    groupApi.create(group, function (errorCode, result) {
        context.busy = false;
        if(errorCode) {
            return common.handleError(errorCode);
        }

        context.show = false;
        common.messagebox({
            message: context.locale.createSuccess,
            closecallback: context.close,
            callback: function () {
                var path = {
                    name: 'conversation',
                    params: {
                        targetId: result.id,
                        conversationType: utils.conversationType.GROUP
                    }
                };
                im.$router.push(path);
            }
        });
    });
}

function addMembers(context, groupApi, groupId) {
    if (context.busy) {
        return;
    }
    var memberIdList = common.without(context.selected, context.defaultSelected)
        .map(function (item) {
            return item.id;
        });
    if(memberIdList.length < 1) {
        return context.close();
    }
    context.busy = true;
    groupApi.addMembers(groupId, memberIdList, function (errorCode) {
        context.busy = false;
        if(errorCode) {
            return common.handleError(errorCode);
        }
        common.messagebox(({
            message: context.locale.addMemberSuccess,
            closecallback: context.close,
            callback: context.close
        }));
    });
}

})(RongIM, {
    jQuery: jQuery
}, RongIM.components);
