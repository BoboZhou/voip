'use strict';
(function(RongIM, dependencies, components) {

var utils = RongIM.utils;
var dialog = RongIM.dialog;
var common = RongIM.common;
var $ = dependencies.jQuery;

function getOrg(resolve, reject) {
    var im = RongIM.instance;
    var orgApi = im.dataModel.Organization;
    var options = {
        name: 'contact-org',
        template: 'templates/contact/org.html',
        data: function() {
            return {
                deptName: '',
                company: {
                    id: im.auth.companyId
                },
                breadcrumb: [],
                members: [],
                depts: []
            };
        },
        computed: {
            deptId: function () {
                return this.$route.params.deptId;
            },
            isCompany: function () {
                return this.deptId === 'tree' || this.deptId === 'root';
            }
        },
        mounted: function() {
            getDept(this, orgApi);
        },
        watch: {
            $route: function () {
                getDept(this, orgApi);
            }
        },
        methods: {
            userProfile: dialog.user,
            getUsername: common.getUsername,
            getRoute: getRoute,
            getTypeName: common.getGroupType
        },
        components: {
            avatar: components.getAvatar
        }
    };
    utils.asyncComponent(options, resolve, reject);
}

function getCompany(context, orgApi) {
    orgApi.getCompany(function (errorCode, data) {
        if(errorCode) {
            return common.handleError(errorCode);
        }
        context.$set(context.company, 'name', data.name);
        if(context.isCompany) {
            context.members = data.members;
            context.depts = data.depts;
        }
    });
}

function getDept(context, orgApi) {
    getCompany(context, orgApi);
    if(context.isCompany) {
        return;
    }

    orgApi.getDept(context.deptId, function (errorCode, data) {
        if(errorCode) {
            return common.handleError(errorCode);
        }
        context.deptName = data.deptName;
        context.members = data.members;
        context.depts = data.depts;
        if(utils.isEmpty(data.path)) {
            context.breadcrumb = [];
        } else {
            orgApi.getDeptNames(data.path, deptNameCallback);
        }
    });

    function deptNameCallback(errorCode, list) {
        if(errorCode) {
            return common.handleError(errorCode);
        }
        context.breadcrumb = list;
    }
}

function getRoute(deptId) {
    return {
        name: 'organization',
        params: {
            deptId: deptId
        }
    };
}

$.extend(true, components, {
    contact: {
        getOrg: getOrg
    }
});

})(RongIM, {
    jQuery: jQuery
}, RongIM.components);
