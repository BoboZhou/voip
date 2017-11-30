'use strict';
(function (RongIM, dependencies, components) {

var common = RongIM.common;
var utils = RongIM.utils;
var $ = dependencies.jQuery;

function getOrg(resolve, reject) {
    var im = RongIM.instance;
    var orgApi = im.dataModel.Organization;
    var userApi = im.dataModel.User;
    var options = {
        name: 'org',
        template: 'templates/group/org.html',
        data: function () {
            return {
                keyword: '',
                breadcrumb: {},
                company: {
                    id: im.auth.companyId
                },
                searchResult: {
                    id: '',
                    deptName: '',
                    members: [],
                    depts: []
                }
            };
        },
        props: ['selected', 'defaultSelected'],
        computed: {
            unifyMembers: function () {
                return this.searchResult.members.map(function (item) {
                    return common.unifyUser(item);
                });
            },
            defaultIdList: function () {
                return (this.defaultSelected || []).map(function (item) {
                    return item.id;
                });
            },
            defaultDeptIdList: function () {
                var deptIdList = [];
                (this.defaultSelected || []).forEach(function (dept) {
                    if(!utils.isEmpty(dept.path)) {
                        deptIdList = dept.path.split(',').concat(deptIdList);
                    }
                });
                return deptIdList;
            },
            hasKeyword: function () {
                return this.keyword.length > 0;
            },
            hasResult: function () {
                var searchResult = this.searchResult;
                var memberLen = searchResult.members.length;
                var deptLen = searchResult.depts.length;
                return memberLen > 0 || deptLen > 0;
            },
            checkedAll: {
                get: function () {
                    return getCheckedAll(this);
                },
                set: function (checked) {
                    setCheckedAll(this, orgApi, checked);
                }
            },
            indeterminate: function () {
                return getIndeterminate(this);
            },
            checkedMembers: {
                get: function () {
                    return this.selected.map(function(item){
                        return item.id;
                    });
                },
                set: function (newMemberIds) {
                    var context = this;
                    userApi.get(newMemberIds, function(errorCode, newMembers){
                        newMembers = [].concat(newMembers);
                        if (errorCode) {
                            return common.handleError(errorCode);
                        }
                        userApi.get(context.checkedMembers, function(UerrorCode, oldMembers){
                            oldMembers = [].concat(oldMembers);
                            if (UerrorCode) {
                                return common.handleError(UerrorCode);
                            }
                            var addedList = common.without(newMembers, oldMembers);
                            addedList.length > 0 && context.$emit('added', addedList);

                            var removedList = common.without(oldMembers, newMembers);
                            var listLen = removedList.length;
                            listLen > 0 && context.$emit('removed', removedList);
                        });
                    });
                }
            },
            checkedDepts: {
                get: function () {
                    var depts = this.searchResult.depts;
                    return getCheckedDepts(depts, this.selected);
                },
                set: function (newDeptIdList) {
                    setCheckedDepts(this, orgApi, newDeptIdList, this.selected);
                }
            }
        },
        components: {
            avatar: components.getAvatar
        },
        watch: {
            keyword: function (keyword) {
                var api = {
                    org: orgApi,
                    user: userApi
                };
                keywordChanged(this, keyword, api);
            }
        },
        created: function () {
            created(this, orgApi);
        },
        methods: {
            clear: function () {
                this.keyword = '';
            },
            getUsername: function(item) {
                var alias = item.alias;
                var name = item.name;
                var username = alias ? alias + '(' + name + ')' : name;
                return common.highlight(username, this.keyword);
            },
            isShowWhenHasAlias: function(item) {
                return item.alias;
            },
            isDefault: function (item) {
                return this.defaultIdList.indexOf(item.id) >= 0;
            },
            excludeMyself: function (item) {
                return item.id !== im.auth.id;
            },
            hasMembers: function (dept) {
                return dept.memberCount > 0;
            },
            changeDept: function (deptId) {
                changeDept(this, orgApi, deptId);
            },
            getDeptStatus: function (dept) {
                return getDeptStatus(dept, this.selected);
            },
            scrollTop: function () {
                var $list = $(this.$refs.list);
                $list.scrollTop(0);
            }
        }
    };
    utils.asyncComponent(options, resolve, reject);
}

function getCheckedAll(context) {
    var currentSelectedCount = getCurrentSelectedCount(context);
    var memberCount = getMemeberCount(context);
    return currentSelectedCount === memberCount;
}

function getCurrentSelectedCount(context) {
    var searchResult = context.searchResult;
    var currentDeptId = searchResult.id;
    var memberCount = 0;
    var isCompany = searchResult.id === context.company.id;

    if(utils.isEmpty(currentDeptId)) {
        // 场景：搜索关键词
        var selectedIdList = context.selected.map(function (item) {
            return item.id;
        });
        var currentIdList = searchResult.members.map(function (item) {
            return item.id;
        });
        return utils.intersection(selectedIdList, currentIdList).length;
    } else if(isCompany) {
        memberCount = context.selected.length;
    } else {
        // 场景：浏览某个部门
        memberCount = context.selected.filter(function (item) {
            return (item.path || '').indexOf(currentDeptId) >= 0;
        }).length;
    }
    return memberCount;
}

function getMemeberCount(context) {
    var memberCount = 0;
    var searchResult = context.searchResult;
    memberCount += searchResult.members.length;
    memberCount += searchResult.depts.map(function (dept) {
            return dept.memberCount;
        }).reduce(function (one, two) {
            return one + two;
        }, 0);
    return memberCount;
}

function getIndeterminate(context) {
    var selectedLength = getCurrentSelectedCount(context);
    var memberCount = getMemeberCount(context);
    var result;
    if(selectedLength > 0) {
        result = selectedLength < memberCount;
    } else {
        result = false;
    }
    return result;
}

function setCheckedAll(context, orgApi, checked) {
    var deptIdList = context.searchResult.depts.map(function (dept) {
        return dept.id;
    });
    getMembers(orgApi, deptIdList, function (errorCode, members) {
        if(errorCode) {
            return common.handleError(errorCode);
        }
        var todoMembers = members.concat(context.unifyMembers);
        var eventType = checked ? 'added' : 'removed';
        context.$emit(eventType, todoMembers);
    });
}

function getCheckedDepts(depts, selected) {
    var count = {};
    selected.forEach(function (item) {
        (item.path || '').split(',').forEach(function (deptId) {
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

function setCheckedDepts(context, orgApi, newDeptIdList/*, selected*/) {
    var oldDeptIdList = context.checkedDepts;

    var addedDeptIdList = withoutIdList(newDeptIdList, oldDeptIdList);
    getMembers(orgApi, addedDeptIdList, function (errorCode, members) {
        if(errorCode) {
            return common.handleError(errorCode);
        }
        // members = members.filter(context.excludeMyself);
        members.length > 0 && context.$emit('added', members);
    });

    var removedDeptIdList = withoutIdList(oldDeptIdList, newDeptIdList);
    getMembers(orgApi, removedDeptIdList, function (errorCode, members) {
        if(errorCode) {
            return common.handleError(errorCode);
        }
        members.length > 0 && context.$emit('removed', members);
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
            // var im = RongIM.instance;
            // var myId = im.auth.id;
            // members = members.filter(function (item) {
            //     return item.id !== myId;
            // });
            callback(null, members);
        }).fail(callback);
    }
}

function withoutIdList(idList, otherIds) {
    return idList.filter(function(id) {
        return otherIds.indexOf(id) < 0;
    });
}

function keywordChanged(context, keyword, api) {
    if(utils.isEmpty(keyword)) {
        context.searchResult = context.company;
    } else {
        api.org.search(keyword, function (errorCode, members) {
            if(errorCode) {
                return common.handleError(errorCode);
            }
            // members = members.filter(function (item) {
            //     return item.id !== authId;
            // });
            common.searchAlias(members, keyword, api.user);
            context.searchResult = {
                members: members,
                depts: []
            };
        });
    }
}

function created(context, orgApi) {
    orgApi.getCompany(function (errorCode, company) {
        if(errorCode) {
            return common.handleError(errorCode);
        }
        company.id = context.company.id;
        context.company = company;
        context.searchResult = company;
    });
}

function changeDept(context, orgApi, deptId){
    var isCompany = context.company.id === deptId;
    if(isCompany) {
        context.searchResult = $.extend(true, {}, context.company);
        return;
    }
    context.clear();
    !isCompany && orgApi.getDept(deptId, function(errorCode, dept) {
        if(errorCode) {
            return common.handleError(errorCode);
        }
        // dept.members = dept.members.filter(context.excludeMyself);
        context.searchResult = dept;
        if(utils.isEmpty(dept.path)) {
            context.breadcrumb = [];
        } else {
            getDeptNames(context, orgApi, dept.path);
        }
        context.scrollTop();
    });
}
function getDeptNames(context, orgApi, deptPath){
    orgApi.getDeptNames(deptPath, function (errorCode, list) {
        if(errorCode) {
            return common.handleError(errorCode);
        }
        context.breadcrumb = list;
    });
}
function getDeptStatus(dept, selected) {
    var memberCount = dept.memberCount;
    var currentSelectedLength = selected.filter(function (item) {
        var pidList = (item.path || '').split(',');
        return pidList.indexOf(dept.id) >= 0;
    }).length;

    return currentSelectedLength > 0 && currentSelectedLength < memberCount;
}

$.extend(true, components, {
    group: {
        getOrg: getOrg
    }
});

})(RongIM, {
    jQuery: jQuery
}, RongIM.components);
