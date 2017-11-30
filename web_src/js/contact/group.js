'use strict';
(function(RongIM, dependencies, components) {

var common = RongIM.common;
var utils = RongIM.utils;
var $ = dependencies.jQuery;

function getGroup(resolve, reject) {
    var im  = RongIM.instance;
    var options = {
        name: 'contact-group',
        template: 'templates/contact/group.html',
        data: function() {
            return {
                groups: []
            };
        },
        mounted: function() {
            initGroup(this, im.dataModel.Group);
        },
        methods: {
            getGroupType: common.getGroupType,
            getGroupName: common.getGroupName,
            startConversation: function(id) {
                startConversation(this, id);
            }
        },
        components: {
            'avatar': components.getAvatar
        }
    };
    utils.asyncComponent(options, resolve, reject);
}

function initGroup(context, groupApi){
    groupApi.getList(function (errorCode, groups) {
        if(errorCode) {
            return common.handleError(errorCode);
        }
        groups.sort(function (a, b) {
            return b.type - a.type;
        });
        context.groups = groups;
    });
}

function startConversation(context, id) {
    var path = {
        name: 'conversation',
        params: {
            targetId: id,
            conversationType: utils.conversationType.GROUP
        }
    };
    context.$router.push(path);
}

$.extend(true, components, {
    contact: {
        getGroup: getGroup
    }
});

})(RongIM, {
    jQuery: jQuery
}, RongIM.components);
