'use strict';
(function (RongIM, dependencies, components) {

var common = RongIM.common;
var utils = RongIM.utils;
var $ = dependencies.jQuery;

function getStar(resolve, reject) {
    var im = RongIM.instance;
    var dataModel = im.dataModel;
    var starApi = dataModel.Star;
    var userApi = im.dataModel.User;
    var options = {
        name: 'star',
        template: 'templates/group/star.html',
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
            created(this, starApi);
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
    var members = context.unifyMembers;
    var memberIds = members.map(function(item){
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

function created(context, starApi) {
    starApi.getList(function (errorCode, list) {
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
        getStar: getStar
    }
});

})(RongIM, {
    jQuery: jQuery
}, RongIM.components);
