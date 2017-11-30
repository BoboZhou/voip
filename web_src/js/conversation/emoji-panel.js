'use strict';
(function (RongIM, dependencies, components) {

var utils = RongIM.utils;
var $ = dependencies.jQuery;
var RongIMEmoji = dependencies.RongIMLib.RongIMEmoji;

components.getEmojiPanel = function (resolve, reject) {
    var timer;
    var options =  {
        name: 'emoji-panel',
        template: 'templates/conversation/emoji-panel.html',
        data: function () {
            return {
                list: []
            };
        },
        mounted: function () {
            mounted(this);
        },
        methods: {
            show: function () {
                clearTimeout(timer);
            },
            hide: function () {
                var context = this;
                timer = setTimeout(function () {
                    context.$emit('hideEmojiPanel');
                }, 200);
            },
            selectEmoji: function (emoji) {
                selectEmoji(this, emoji);
            }
        },
        destroyed: function () {
            $(window).off('click.emojiPanel');
        }
    };
    utils.asyncComponent(options, resolve, reject);
};

function mounted(context) {
    context.list = RongIMEmoji.getAllEmoji();
}

function selectEmoji(context, emoji) {
    context.$emit('selectedEmoji', '['+ emoji + ']');
    context.$emit('hideEmojiPanel');
}

})(RongIM, {
    jQuery: jQuery,
    RongIMLib: RongIMLib
}, RongIM.components);
