'use strict';
(function (RongIM, dependencies, components) {

var common = RongIM.common;
var utils = RongIM.utils;
var $ = dependencies.jQuery;

function getFriend(resolve, reject) {
    var im = RongIM.instance;
    var dataModel = im.dataModel;
    var friendApi = dataModel.Friend;
    var userApi = im.dataModel.User;
    var options = {
        name: 'friend',
        template: 'templates/group/friend.html',
        data: function () {
            return {
                keyword: '',
                searchResult: [],
                members: []
            };
        },
        props: ['selected', 'defaultSelected'],
        computed: {
            unifyMembers: function () {
                this.searchResult.map(function (item) {
                    return common.unifyUser(item);
                });
                return this.searchResult.map(function (item) {
                    return common.unifyUser(item);
                });
            },
            defaultIdList: function () {
                return (this.defaultSelected || []).map(function (item) {
                    return item.id;
                });
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
            },
            checked: {
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
                        userApi.get(context.checked, function(UerrorCode, oldMembers){
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
            }
        },
        components: {
            avatar: components.getAvatar
        },
        watch: {
            keyword: function (keyword) {
                keywordChanged(this, keyword);
            }
        },
        created: function () {
            created(this, friendApi);
        },
        methods: {
            getUsername: function(item) {
                var alias = item.alias;
                var name = item.name;
                var username = alias ? alias + '(' + name + ')' : name;
                return common.highlight(username, this.keyword);
            },
            isDefault: function (item) {
                return this.defaultIdList.indexOf(item.id) >= 0;
            },
            clear: function () {
                this.keyword = '';
            }
        }
    };
    utils.asyncComponent(options, resolve, reject);
}

function getCheckedAll(context) {
    var starChecked = [];
    var checkedIdList = context.checked;
    context.searchResult.forEach(function (item) {
        var existed = checkedIdList.indexOf(item.id) >= 0;
        existed && starChecked.push(item);
    });
    var length = starChecked.length;
    var result;
    if(length > 0) {
        var isAll = length === context.searchResult.length;
        result = isAll ? true : null;
    } else {
        result = false;
    }
    return result;
}

function setCheckedAll(context, value) {
    var memberIds = context.unifyMembers.map(function(item){
        return item.id;
    });
    if(value) {
        context.checked = [].concat(memberIds, context.checked);
    } else {
        context.checked = context.checked.filter(function(id){
            return memberIds.indexOf(id) < 0;
        });
    }
}

function keywordChanged(context, keyword) {
    if(keyword.length === 0) {
        context.searchResult = context.members;
    } else {
        context.searchResult = context.members.filter(function (item) {
            return utils.searchName([item.name, item.alias], keyword);
        });
    }
}

function created(context, friendApi) {
    friendApi.getList(function (errorCode, list) {
        if(errorCode) {
            return common.handleError(errorCode);
        }
        common.sortUsers(list);
        context.members = list;
        context.searchResult = list;
    });
}

$.extend(true, components, {
    group: {
        getFriend: getFriend
    }
});

})(RongIM, {
    jQuery: jQuery
}, RongIM.components);
