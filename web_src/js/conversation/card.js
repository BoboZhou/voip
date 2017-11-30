'use strict';
(function (RongIM, components) {

var common = RongIM.common;

RongIM.dialog.card = function() {
    var im = RongIM.instance;
    var dataModel = im.dataModel;
    var options = {
        name: 'card',
        template: 'templates/conversation/card.html',
        data: function () {
            return {
                show: true,

                // 'star' or 'org'
                tab: 'org',
                tip: '',
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
        watch: {
            selected: function (newValue, oldValue) {
                limitCount(this, newValue, oldValue);
            }
        },
        created: function () {
            if(!this.isStaff){
                this.tab = 'star';
            }
        },
        methods: getMethods(dataModel, im)
    };

    common.mountDialog(options);
};

function limitCount(context, newValue, oldValue) {
    var MAX = 1;
    if(newValue.length > MAX) {
        context.$nextTick(function () {
            context.selected = oldValue;
        });
        clearTimeout(limitCount.timer);
        context.tip = common.getErrorMessage('card-limit');
        limitCount.timer = setTimeout(function () {
            context.tip = '';
            context.selected = oldValue;
        }, 1500);
    }
}

function getMethods(dataModel, im) {
    return {
        close: function () {
            this.show = false;
        },
        setTab: function (tab) {
            this.tab = tab;
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
        getUsername: common.getUsername,
        submit: function () {
            var routeParams = im.$route.params;
            var conversationType = parseInt(routeParams.conversationType);
            var targetId = routeParams.targetId;
            var user = this.selected[0];
            var params = {
                conversationType: conversationType,
                targetId: targetId,
                user: {
                    userId: user.id,
                    name: user.name,
                    portraitUri: user.avatar,
                    sendUserId: im.loginUser.id,
                    sendUserName: im.loginUser.name,
                    extra: ''
                }
            };
            submit(this, dataModel.Message, params);
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
    context.selected = context.selected.filter(function (item) {
        return idList.indexOf(item.id) < 0;
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

function submit(context, messageApi, params) {
    if(submit.busy) {
        return;
    }
    submit.busy = true;
    messageApi.sendCard(params, function (errorCode) {
        submit.busy = false;
        if(errorCode) {
            return common.handleError(errorCode);
        }
    });
    context.close();
}

})(RongIM, RongIM.components);
