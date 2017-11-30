'use strict';
(function (RongIM, dependencies, components) {

var common = RongIM.common;
var utils = RongIM.utils;
var $ = dependencies.jQuery;

function getList(resolve, reject) {
    var im = RongIM.instance;
    var dataModel = im.dataModel;
    var options = {
        name: 'contact-list',
        template: '#rong-template-contact-list',
        data: function () {
            return {
                expand: true,
                auth: im.auth,
                company: {},
                isStaff: im.auth.isStaff
            };
        },
        computed: {
            companyId: function () {
                return this.auth.companyId;
            },
            myDeptId: function () {
                return this.auth.deptId || 'root';
            },
            requestUnReadCount: function () {
                return im.requestUnReadCount;
            }
        },
        components: {
            'search': components.getSearch
        },
        created: function () {
            getCompany(this, dataModel.Organization);
        },
        methods:{
            toggleList: function () {
                toggleList(this);
            }
        }
    };
    utils.asyncComponent(options, resolve, reject);
}

function getCompany(context, orgApi) {
    orgApi.getCompany(function (errorCode, data) {
        if(errorCode) {
            return common.handleError(errorCode);
        }
        context.company = data;
    });
}

function toggleList(context) {
    context.expand = !context.expand;
}

$.extend(true, components, {
    contact: {
        getList: getList
    }
});

})(RongIM, {
    jQuery: jQuery
}, RongIM.components);
