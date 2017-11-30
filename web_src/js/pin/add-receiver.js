'use strict';
(function(RongIM, dependencies, components) {
    var common = RongIM.common;
    var $ = dependencies.jQuery;
    var dataModel = RongIM.dataModel;
    var pinApi = dataModel.Pin;

    RongIM.dialog.addReceivers = function(defaultMembers, pinDetail) {
        var options = {
            name: 'add-receiver',
            template: 'templates/pin/add-receiver.html',
            data: function() {
                return {
                    tab: 'org',
                    show: true,
                    selected: [],
                    defaultSelected: $.extend(true, [], defaultMembers)
                };
            },
            components: {
                avatar: components.getAvatar,
                org: components.group.getOrg,
                star: components.group.getStar,
                friend: components.group.getFriend
            },
            computed: {
                isStarSelected: function() {
                    return this.tab === 'star';
                },
                isOrgSelected: function() {
                    return this.tab === 'org';
                },
                isFriendSelected: function() {
                    return this.tab === 'friend';
                }
            },
            methods: getMethods(defaultMembers, pinDetail)
        };
        common.mountDialog(options);
    };

    function getMethods(defaultMembers, pinDetail) {
        return {
            getUsername: common.getUsername,
            close: function() {
                this.selected = [];
                this.show = false;
            },
            selectTab: function(tab) {
                this.tab = tab;
            },
            added: function(members) {
                added(this, members, defaultMembers);
            },
            removed: function(members) {
                removed(this, members);
            },
            removeMembers: function(member) {
                removed(this, [member]);
            },
            addReceivers: function() {
                addReceivers(this, pinDetail, pinApi);
            }
        };
    }

    function addReceivers(context, pinContext, pinApi) {
        var newReciverIds = context.selected.map(function(item) {
            return item.id;
        });
        pinApi.addReceivers(pinContext.pinUid, newReciverIds, function(errorCode) {
            if (errorCode) {
                return common.handleError(errorCode);
            }
            context.close();
            common.messagebox({
                message: '加入成功',
                closecallback: context.close
            });
            sendNewReceiverMessage(pinApi, pinContext.pinUid);
        });
    }

    function sendNewReceiverMessage(pinApi, uid) {
        var message = {
            messageType: pinApi.MessageType.PinNewReciverMessage,
            content: {pinUid: uid}
        };
        pinApi.observerList.notify(message);
    }

    function added(context, members, defaultMembers) {
        var selected = context.selected.concat(defaultMembers);
        var selectedIdList = selected.map(function(item) {
            return item.id;
        });
        var addedList = members.filter(function(item) {
            return selectedIdList.indexOf(item.id) < 0;
        });

        context.selected = context.selected.concat(addedList);
    }

    function removed(context, members) {
        var idList = members.map(function(item) {
            return item.id;
        });
        var reservedIdList = context.defaultSelected.map(function(item) {
            return item.id;
        });
        context.selected = context.selected.filter(function(item) {
            var reserved = reservedIdList.indexOf(item.id) >= 0;
            return reserved || idList.indexOf(item.id) < 0;
        });
    }

})(RongIM, {
    jQuery: jQuery
}, RongIM.components);
