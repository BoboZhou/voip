'use strict';
(function (RongIM, dependencies, components) {

var common = RongIM.common;
var utils = RongIM.utils;
var $ = dependencies.jQuery;

RongIM.dialog.forward = function(message) {
    var im = RongIM.instance;
    var dataModel = im.dataModel;
    var orgApi = dataModel.Organization;
    var userApi = dataModel.User;
    var options = {
        name: 'forward',
        template: 'templates/conversation/forward.html',
        data: function () {
            return {
                show: true,
                tip: '',

                // 'contacts' or 'groups'
                currentView: '',
                keyword: '',
                companyId: im.auth.companyId,
                companyName: '',
                deptId: '',
                deptName: '',
                members: [],
                depts: [],
                groups: [],
                selected: []
            };
        },
        computed: {
            isEmpty: function () {
                var noResult = this.members.length + this.depts.length + this.groups.length === 0;
                return this.keyword.length > 0 && noResult;
            },
            showContacts: function () {
                if(utils.isEmpty(this.currentView)) {
                    return this.members.length + this.depts.length > 0;
                }
                return this.currentView === 'contacts';
            },
            showGroups: function () {
                if(utils.isEmpty(this.currentView)) {
                    return this.groups.length > 0;
                }
                return this.currentView === 'groups';
            },
            checkedDepts: {
                get: function () {
                    var selected = this.selected.filter(function (item) {
                        return !utils.isEmpty(item.path);
                    });
                    return getCheckedDepts(this.depts, selected);
                },
                set: function (newDeptIdList) {
                    setCheckedDepts(this, orgApi, newDeptIdList);
                }
            }
        },
        components: {
            avatar: components.getAvatar
        },
        directives: {
            autoScroll: function (el) {
                Vue.nextTick(function () {
                    var $el = $(el);
                    var height = $el.children().outerHeight();
                    $el.scrollTop(height);
                });
            }
        },
        created: function () {
            this.getContacts();
            this.getGroups();
        },
        watch: {
            currentView: function (newValue, oldValue) {
                var context = this;
                context.$nextTick(function () {
                    var el = context.$refs[newValue || oldValue];
                    el && $(el).scrollTop(0);
                });
            },
            selected: function (newValue, oldValue) {
                limitCount(this, newValue, oldValue);
            },
            checkedDepts: function (newValue, oldValue) {
                limitCount(this, newValue, oldValue);
            },
            keyword: function () {
                this.getContacts();
                this.getGroups();
            },
            deptId: function (value) {
                this.getContacts();
                if(utils.isEmpty(value)) {
                    this.deptName = '';
                }
            }
        },
        methods: {
            close: function () {
                this.show = false;
            },
            isGroup: function (data) {
                return data.memberCount > 0;
            },
            isMyself: function (item) {
                return item.id === im.auth.id;
            },
            getContacts: function () {
                getContacts(this, orgApi, userApi);
            },
            getDeptStatus: function (dept) {
                var selected = this.selected.filter(function (item) {
                    return !utils.isEmpty(item.path);
                });
                return getDeptStatus(dept, selected);
            },
            getGroups: function () {
                getGroups(this, dataModel.Group);
            },
            showGroupType: function (group) {
                return group && group.type > 0;
            },
            getUsername: common.getUsername,
            getHighlightUsername: function (user) {
                return common.highlight(common.getUsername(user), this.keyword);
            },
            getGroupName: common.getGroupName,
            getGroupType: common.getGroupType,
            getHighlightGroupName: function (group) {
                return common.highlight(common.getGroupName(group), this.keyword);
            },
            getMatchedMembers: function (group) {
                return getMatchedMembers(this, group);
            },
            remove: function (item) {
                var index = this.selected.indexOf(item);
                index >= 0 && this.selected.splice(index, 1);
            },
            clear: function () {
                this.keyword = '';
            },
            submit: function () {
                submit(this, dataModel.Message, message);
            }
        }
    };

    common.mountDialog(options, function (instance) {
        RongIM._forword = instance;
    });
};

function limitCount(context, newValue, oldValue) {
    var MAX = 10;
    if(newValue.length > MAX) {
        context.$nextTick(function () {
            context.selected = oldValue;
        });
        clearTimeout(limitCount.timer);
        context.tip = common.getErrorMessage('forward-limit');
        limitCount.timer = setTimeout(function () {
            context.tip = '';
        }, 1500);
        context.selected = oldValue;
    }
}

function getContacts(context, orgApi, userApi) {
    var deptId = context.deptId;

    if(context.keyword) {
        orgApi.search(context.keyword, function (errorCode, members) {
            if(errorCode) {
                return common.handleError(errorCode);
            }
            common.searchAlias(members, context.keyword, userApi);
            context.members = members;
            context.depts = [];
        });
        return;
    }

    if(utils.isEmpty(deptId)) {
        orgApi.getCompany(function (errorCode, company) {
            if(errorCode) {
                return common.handleError(errorCode);
            }
            context.companyName = company.name;
            context.members = company.members;
            context.depts = company.depts.filter(function (dept) {
                return dept.memberCount > 0;
            });
        });
    } else {
        orgApi.getDept(deptId, function(errorCode, dept) {
            if(errorCode) {
                return common.handleError(errorCode);
            }

            context.deptName = dept.deptName;
            if(utils.isEmpty(dept.path)) {
                context.breadcrumb = [];
            } else {
                orgApi.getDeptNames(dept.path, function (errorCode, list) {
                    if(errorCode) {
                        return common.handleError(errorCode);
                    }
                    context.breadcrumb = list;
                });
            }

            context.members = dept.members;
            context.depts = dept.depts.filter(function (dept) {
                return dept.memberCount > 0;
            });
        });
    }
}

function getDeptStatus(dept, selected) {
    var memberCount = dept.memberCount;
    var currentSelectedLength = selected.filter(function (item) {
        var pidList = item.path.split(',');
        return pidList.indexOf(dept.id) >= 0;
    }).length;

    var myDeptId = RongIM.instance.auth.deptId;
    if(dept.id === myDeptId) {
        memberCount--;
    }

    return currentSelectedLength > 0 && currentSelectedLength < memberCount;
}

function getCheckedDepts(depts, selected) {
    var count = {};
    var me = RongIM.instance.loginUser;
    selected.concat(me).forEach(function (item) {
        item.path.split(',').forEach(function (deptId) {
            count[deptId] = count[deptId] || 0;
            count[deptId]++;
        });
    });

    var checkedDepts = depts.filter(function (dept) {
        return count[dept.id] >= dept.memberCount;
    });
    return checkedDepts.map(function (dept) {
        return dept.id;
    });
}

function setCheckedDepts(context, orgApi, newDeptIdList) {
    var oldDeptIdList = context.checkedDepts;

    var addedDeptIdList = withoutIdList(newDeptIdList, oldDeptIdList);
    getMembers(orgApi, addedDeptIdList, function (errorCode, members) {
        if(errorCode) {
            return common.handleError(errorCode);
        }
        members.length > 0 && addMemebers(context, members);
    });

    var removedDeptIdList = withoutIdList(oldDeptIdList, newDeptIdList);
    getMembers(orgApi, removedDeptIdList, function (errorCode, members) {
        if(errorCode) {
            return common.handleError(errorCode);
        }
        members.length > 0 && removeMembers(context, members);
    });
}

function getMembers(orgApi, deptIdList, callback) {
    if(deptIdList.length < 1) {
        return callback(null, []);
    }

    var promiseList = [];
    if(deptIdList.length > 0) {
        deptIdList.forEach(function (deptId) {
            var defer = $.Deferred();
            promiseList.push(defer.promise());
            orgApi.getMembers(deptId, function (errorCode, members) {
                if(errorCode) {
                    return defer.reject(errorCode);
                }
                defer.resolve(members);
            });
        });
        $.when.apply(null, promiseList).then(function () {
            var args = [].slice.call(arguments);
            var members = args.reduce(function (one, two) {
                return one.concat(two);
            });
            var im = RongIM.instance;
            var myId = im.auth.id;
            members = members.filter(function (item) {
                return item.id !== myId;
            });
            callback(null, members);
        }).fail(callback);
    }
}

function addMemebers(context, members) {
    var selectedIdList = context.selected.map(function (item) {
        return item.id;
    });
    var addedList = members.filter(function (item) {
        return selectedIdList.indexOf(item.id) < 0;
    });
    context.selected = context.selected.concat(addedList);
}

function removeMembers(context, members) {
    var idList = members.map(function (item) {
        return item.id;
    });
    context.selected = context.selected.filter(function (item) {
        return idList.indexOf(item.id) < 0;
    });
}

function withoutIdList(idList, otherIds) {
    return idList.filter(function(id) {
        return otherIds.indexOf(id) < 0;
    });
}

function getGroups(context, groupApi) {
    groupApi.getList(function (errorCode, groups) {
        if(errorCode) {
            return common.handleError(errorCode);
        }

        context.groups = groups.filter(function (group) {
            var matchName = utils.searchName([group.name, context.getGroupName(group)], context.keyword);
            var matchMembers = getMatchedMembers(context, group).length > 0;
            return matchName || matchMembers;
        });
    });
}

function getMatchedMembers(context, group) {
    var keyword = context.keyword;
    if(utils.isEmpty(keyword)) {
        return '';
    }
    var members = group.memberNames.filter(function (name) {
        return utils.searchName([name], keyword);
    }).map(function (name) {
        return common.highlight(name, keyword);
    });

    if(members.length > 0) {
        return members.join('，');
    }
    return '';
}

function submit(context, messageApi, message) {
    var msg = {
        messageType:message.messageName,
        content: message
    };
    message = messageApi.create(msg);
    var paramList = context.selected.map(function (item) {
        var conversationType = utils.conversationType.PRIVATE;
        if (context.isGroup(item)) {
            conversationType = utils.conversationType.GROUP;
        }
        return  {
            conversationType: conversationType,
            targetId: item.id,
            content: message
        };
    });
    var index = 0;
    var timer = setInterval(function () {
            if(index < paramList.length) {
                try {
                    messageApi.send(paramList[index]);
                } catch (error) {
                    clearInterval(timer);
                }
                index++;
            } else {
                clearInterval(timer);
            }
        }, 1000 / 5);
        common.messagebox({
            message: context.locale.forwarded
        });
    context.close();
}

})(RongIM, {
    jQuery: jQuery
}, RongIM.components);
