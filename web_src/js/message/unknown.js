'use strict';
(function(RongIM, components){

var utils = RongIM.utils;

components.getUnknownMessage = function (resolve, reject) {
    var options = {
        name: 'unknown-message',
        props:['message'],
        template:'#rong-template-unknown'
    };
    utils.asyncComponent(options, resolve, reject);
};

})(RongIM, RongIM.components);
