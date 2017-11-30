'use strict';
(function (RongIM, components) {

var common = RongIM.common;
var dialog = RongIM.dialog;

RongIM.dialog.ack = function(memberList, readList) {
    var im = RongIM.instance;
    var options = {
        name: 'ack',
        template: 'templates/conversation/ack.html',
        data: function () {
            return {
                show: true,
                memberList: [],
                tab: 'unread',
                style: ''
            };
        },
        components: {
            avatar: components.getAvatar
        },
        computed: {
            readMember: function () {
                return memberList.filter(function (item) {
                    return readList.indexOf(item.id) !== -1;
                });
            },
            unreadMember: function () {
                return memberList.filter(function (item) {
                    return readList.indexOf(item.id) === -1;
                });
            }
        },
        mounted: function () {
            var context = this;
            var unwatch = im.$watch('$route', function () {
                context.close();
                unwatch();
            });
        },
        methods: {
            close: function () {
                this.show = false;
            },
            getUsername: common.getUsername,
            showUserInfo: function (user) {
                dialog.user(user.id);
            }
        }
    };

    common.mountDialog(options, function (instance) {
        RongIM._ack = instance;
    });
};

})(RongIM, RongIM.components);
