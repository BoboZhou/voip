'use strict';
(function(RongIM, components){

var common = RongIM.common;
var utils = RongIM.utils;
var dialog = RongIM.dialog;

components.getCardMessage = function (resolve, reject) {
    var options = {
        name: 'card-message',
        props:['message'],
        template:'#rong-template-card',
        computed: {
            user: function () {
                return this.message.user;
            },
            content: function () {
                var content = this.message.content;
                content.id = content.userId;
                content.avatar = content.portraitUri;
                return content;
            }
        },
        components: {
            avatar: components.getAvatar
        },
        methods: {
            getUsername: common.getUsername,
            userProfile: dialog.user
        }
    };
    utils.asyncComponent(options, resolve, reject);
};

})(RongIM, RongIM.components);
