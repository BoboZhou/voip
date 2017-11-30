'use strict';
(function(RongIM, dependencies, components){

var common = RongIM.common;
var utils = RongIM.utils;
var CallType = common.CallType;

components.getShareScreenMessage = function (resolve, reject) {
    var userApi = RongIM.dataModel.User;
    var options = {
        name: 'shareScreenMessage',
        props:['message'],
        template:'templates/message/share-screen.html',
        computed: {
            content: function () {
                var content = this.message.content;
                var str = this.locale.voip.summaryCodeMap[content.code];
                // 已接通 显示通话时间
                var isActive = [3, 13].indexOf(content.code) !== -1;
                if (isActive) {
                   str += utils.secondToMinute(content.duration / 1000);
                }
                return this.locale.message.prefix.ShareScreenMessage + str;
            }
        },
        methods: {
            invite: function () {
                var conversation = {
                    conversationType: this.message.conversationType,
                    targetId: this.message.targetId
                };
                var params = {
                    conversation: conversation,
                    type: CallType.MEDIA_VEDIO,
                    isShareScreen: true,
                    isPrivate: true
                };
                RongIM.voip.invite(params, userApi);
            }
        }
    };
    utils.asyncComponent(options, resolve, reject);
};

})(RongIM, {
    jQuery: jQuery
}, RongIM.components);
