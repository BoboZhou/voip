'use strict';
(function (RongIM, dependencies, components) {

function getFullscreen() {
    return {
        computed: {
            fullscreenElementName: function () {
                return getSuppportFnName([
                    'fullscreenElement',
                    'webkitFullscreenElement',
                    'mozFullScreenElement'
                ]);
            },
            requestFullscreenName: function () {
                return getSuppportFnName([
                    'requestFullscreen',
                    'webkitRequestFullscreen',
                    'mozRequestFullScreen'
                ]);
            },
            onfullscreenchangeName: function () {
                return getSuppportFnName([
                    'onfullscreenchange',
                    'onwebkitfullscreenchange',
                    'onmozfullscreenchange'
                ]);
            },
            exitFullscreenName: function () {
                return getSuppportFnName([
                    'exitFullscreen',
                    'webkitExitFullscreen',
                    'mozCancelFullScreen'
                ]);
            }
        },
        methods: {
            toggleFullScreen: function (el) {
                if (!document[this.fullscreenElementName]) {
                    el[this.requestFullscreenName]();
                } else {
                    if (document[this.exitFullscreenName]) {
                        document[this.exitFullscreenName]();
                    }
                }
            }
        }
    };
}

function getSuppportFnName(list) {
    var undef;
    var result;
    list.forEach(function (name) {
        var fn = document[name] !== undef ? document[name] : document.documentElement[name];
        if(fn !== undef) {
            result = name;
        }
    });
    return result;
}

components.getFullscreen = getFullscreen;

})(RongIM, null, RongIM.components);
