'use strict';
(function (RongIM) {

var common = RongIM.common;
var utils = RongIM.utils;

RongIM.dialog.previewImage = function (base64, hasStr, callback) {
    if (typeof hasStr === 'function') {
        callback = hasStr;
        hasStr = false;
    }

    var options = {
        name: 'preview-image',
        template: 'templates/conversation/preview-image.html',
        data: function () {
            return {
                show: true,
                src: base64,
                hasStr: hasStr
            };
        },
        created: function () {
            window.addEventListener('keyup', this.keyup);
        },
        beforeDestroy: function () {
            removeKeyupListener(this.keyup);
        },
        directives: {
            autoFocus: function (el) {
                Vue.nextTick(function () {
                    el.focus();
                });
            }
        },
        methods: {
            close: function () {
                this.show = false;
                removeKeyupListener(this.keyup);
            },
            submit: function () {
                this.close();
                callback();
            },
            convertStr: function () {
                this.close();
                callback(true);
            },
            keyup: function (event) {
                var keyCode = utils.keyCode;
                switch (event.keyCode) {
                    case keyCode.enter:
                        this.submit();
                    break;
                    case keyCode.esc:
                        this.close();
                    break;
                    default:
                }
            }
        }
    };
    common.mountDialog(options, function (instance) {
        RongIM._previewImage = instance;
    });
};

function removeKeyupListener(event){
    window.removeEventListener('keyup', event);
}

})(RongIM);
