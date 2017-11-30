'use strict';
(function (RongIM, dependencies, components) {

var utils = RongIM.utils;
var $ = dependencies.jQuery;

function getContextMenu(options) {
    return {
        data: function () {
            return {
                context: null
            };
        },
        components: {
            'contextmenu': function (resolve, reject) {
                getChildComponent(options, resolve, reject);
            }
        },
        methods: {
            showContextmenu: function (event, context, fixOffset) {
                var im = RongIM.instance;
                im.$emit('imclick', event);
                fixOffset = $.extend({left: 0, top: 0}, fixOffset);
                var offset = $(this.$el).offset();
                var top = event.pageY - offset.top + fixOffset.top;
                var bottom = document.documentElement.offsetHeight - event.clientY;
                var throttle = 100;
                if(bottom < throttle) {
                    top = 'auto';
                } else {
                    bottom = 'auto';
                }
                var left = event.pageX - offset.left + fixOffset.left;
                var style = {
                    left: getStyleValue(left),
                    top: getStyleValue(top),
                    bottom: getStyleValue(bottom)
                };
                this.context = $.extend({
                    style: style
                }, context);
            },
            closeContextmenu: function () {
                this.context = null;
            }
        }
    };
}

function getStyleValue(prop) {
    return isNaN(prop) ? prop : prop + 'px';
}

function getChildComponent(options, resolve, reject) {
    var im = RongIM.instance;
    var defaultOptions = {
        name: 'contextmenu',
        props: ['context'],
        mounted: function () {
            var self = this;
            im.$on('imclick', function (event) {
                var isOuter = $(event.target).closest('.rong-menu').length < 1;
                isOuter && self.$emit('close');
            });
            im.$on('imrightclick', function () {
                self.$emit('close');
            });
        }
    };
    options = $.extend(defaultOptions, options);

    return utils.asyncComponent(options, resolve, reject);
}

components.getContextMenu = getContextMenu;

})(RongIM, {
    jQuery: jQuery
}, RongIM.components);
