'use strict';
(function(RongIM, dependencies, components) {

var common = RongIM.common;
var utils = RongIM.utils;
var dialog = RongIM.dialog;

components.getConversationSetting = function (resolve, reject) {
    var im = RongIM.instance;
    var dataModel = im.dataModel;
    var conversationApi = dataModel.Conversation;
    var options = {
        name: 'conversation-setting',
        template: 'templates/conversation/conversation-setting.html',
        props: ['user'],
        data: function () {
            var params = im.$route.params;
            return {
                conversation: {
                    conversationType: params.conversationType,
                    targetId: params.targetId
                }
            };
        },
        components: {
            avatar: components.getAvatar
        },
        mounted: function () {
            mounted(this, im, dataModel.Conversation);
        },
        computed: {
            isTop: {
                get: function () {
                    return this.conversation.isTop;
                },
                set: function (checked) {
                    var action = checked ? 'top' : 'untop';
                    var conversation = this.conversation;
                    conversationApi[action](conversation.conversationType, conversation.targetId);
                }
            },
            isMute: {
                get: function () {
                    return this.conversation.notificationStatus;
                },
                set: function (checked) {
                    var action = checked ? 'mute' : 'unmute';
                    var conversation = this.conversation;
                    conversationApi[action](conversation.conversationType, conversation.targetId);
                }
            }
        },
        methods: {
            getUsername: common.getUsername,
            addMembers: function () {
                var members = [im.loginUser, this.user];
                dialog.createGroup(null, members);
            },
            close: function () {
                this.$emit('hidepanel');
                im.$off('imclick', this.close);
            },
            userProfile: dialog.user
        }
    };
    utils.asyncComponent(options, resolve, reject);
};

function mounted(context, im, conversationApi) {
    im.$on('imclick', context.close);
    conversationApi.getOne(context.conversation.conversationType, context.conversation.targetId, function (errorCode, conversation) {
        context.conversation = conversation;
    });
}

})(RongIM, {
    jQuery: jQuery
}, RongIM.components);
