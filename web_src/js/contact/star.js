'use strict';
(function(RongIM, dependencies, components) {

var utils = RongIM.utils;
var dialog = RongIM.dialog;
var common = RongIM.common;
var $ = dependencies.jQuery;

function getStar(resolve, reject) {
    var im = RongIM.instance;
    var dataModel = im.dataModel;
    var starApi = dataModel.Star;
    var userApi = dataModel.User;

    var options = {
        name: 'contact-star',
        template: 'templates/contact/star.html',
        data: function() {
            return {
                stars: []
            };
        },
        mounted: function() {
            mounted(this, starApi, userApi);
        },
        destroyed: function () {
            cleanup(starApi, userApi);
        },
        methods: {
            getUsername: common.getUsername,
            userProfile: dialog.user
        },
        components: {
            'avatar': components.getAvatar
        }
    };
    utils.asyncComponent(options, resolve, reject);
}

function mounted(context, starApi, userApi) {
    getList(context, starApi);
    starApi.watch(function () {
        getList(context, starApi);
    });
    userApi.watch(function () {
        getList(context, starApi);
    });
}

function getList(context, starApi){
    starApi.getList(function(errorCode, list) {
        if(errorCode) {
            return common.handleError(errorCode);
        }
        common.sortUsers(list);
        context.stars = list;
    });
}

function cleanup(starApi, userApi) {
    starApi.unwatch();
    userApi.unwatch();
}

$.extend(true, components, {
    contact: {
        getStar: getStar
    }
});

})(RongIM, {
    jQuery: jQuery
}, RongIM.components);
