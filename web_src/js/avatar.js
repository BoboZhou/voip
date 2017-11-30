'use strict';
(function (RongIM, dependencies, components) {

var utils = RongIM.utils;

components.getAvatar = function (resolve, reject) {
    var im = RongIM.instance;
    var dataModel = im.dataModel;
    var userApi = dataModel.User;
    var options = {
        name: 'avatar',
        template: '#rong-template-avatar',
        props: ['user', 'group', 'online-status'],
        data: function () {
            return {
                userData: {}
            };
        },
        computed: {
            memberAvatars: function () {
                var MAX = 9;
                return this.group ? this.group.memberAvatars.slice(0, MAX) : [];
            }
        },
        filters: {
            slice: function (name) {
                if(!name) {
                    return;
                }
                var isChinese = /^[^\x00-\xff]+$/.test(name);
                return isChinese ? name.slice(-1) : name[0].toUpperCase();
            }
        },
        watch: {
            user: function (newValue) {
                this.userData = newValue;
            }
        },
        mounted: function () {
            this.userData = this.user;
            this.user && userApi.watch(this.userChanged.bind(this));
            this.group && userApi.watch(this.memberChanged.bind(this));
        },
        methods: {
            getThemeIndex: function (id) {
                var LENGTH = 6;
                return id ? (id.slice(-1).charCodeAt(0) % LENGTH) : 0;
            },
            userChanged: function (user) {
                if(!this.user){
                    return;
                }
                if(user.id === this.user.id) {
                    this.userData = user;
                }
            },
            memberChanged: function (user) {
                var group = this.group;
                if (group && group.memberIdList) {
                    var index = group.memberIdList.indexOf(user.id);
                    if(index >= 0 && group) {
                        group.memberAvatars.splice(index, 1, user.avatar);
                    }
                }
            }
        },
        destroyed: function () {
            userApi.unwatch(this.userChanged);
            userApi.unwatch(this.memberChanged);
        }
    };
    utils.asyncComponent(options, resolve, reject);
};

})(RongIM, null, RongIM.components);
