'use strict';
(function (RongIM, dependencies) {

var utils = RongIM.utils;
var RongIMEmoji = dependencies.RongIMLib.RongIMEmoji;
var emojiToHTML = RongIMEmoji.emojiToHTML;
var $ = dependencies.jQuery;

function textMessageFormat(content) {
    if(content.length === 0){
        return '';
    }

    //要处理的到底是message？还是message里的content？
    //str到处都是？
    //传入依赖
    //if-else只处理差异化部分

    content = utils.encodeHtmlStr(content);

    content = utils.replaceUri(content, function(uri, protocol) {
        var link = uri;
        if (!protocol) {
            link = 'http://' + uri;
        }
        return '<a class="rong-link-site" target="_blank" href="'+ link +'">' + uri + '</a>';
    });

    content = utils.replaceEmail(content, function(email) {
        return '<a class="rong-link-email" href="mailto:' + email + '">' + email + '<a>';
    });
    return emojiToHTML(content, 18);
}

function convertMessage(text) {
    if(utils.isEmpty(text)) {
        return text;
    }
    var content = RongIMEmoji.messageDecode(text.trim());
    content = content.replace(/\n/g, '');
    content = utils.encodeHtmlStr(content);
    content = RongIMEmoji.symbolToEmoji(content);
    var SIZE_PX = 16;
    return RongIMEmoji.emojiToHTML(content, SIZE_PX);
}

var buildMessage = {
    TextMessage: function (context) {
        return new RongIMLib.TextMessage(context);
    },
    ImageMessage: function (context) {
        return new RongIMLib.ImageMessage(context);
    },
    FileMessage: function (context) {
        return new RongIMLib.FileMessage(context);
    },
    VoiceMessage: function (context) {
        return new RongIMLib.VoiceMessage(context);
    },
    LocationMessage: function (context) {
        return new RongIMLib.LocationMessage(context);
    },
    CardMessage: function (context) {
        return new RongIMClient.RegisterMessage.CardMessage(context);
    },
    SightMessage: function (context) {
        return new RongIMClient.RegisterMessage.SightMessage(context);
    }
};

var smoothScroll = {
    data: function () {
        return {
            overflow: 'hidden',
            scrollTimer: null
        };
    },
    methods: {
        smoothScroll: function () {
            var context = this;
            context.overflow = 'auto';
            clearTimeout(context.scrollTimer);
            context.scrollTimer = setTimeout(function () {
                context.overflow = 'hidden';
            }, 100);
        }
    }
};

function messagebox(params) {
    var options = {
        name: 'messagebox',
        template: $('#rong-messagebox').html(),
        data: function () {
            return {
                type: params.type || 'alert',
                title: params.title,
                message: params.message,
                submitText: params.submitText,
                show: true
            };
        },
        created: function () {
            this.title = params.title || this.locale.tips.msgboxTitle;
            this.submitText = params.submitText || this.locale.tips.msgboxSubmitText;
        },
        methods: {
            close: function () {
                params.closecallback && params.closecallback();
                this.show = false;
            },
            confirm: function () {
                params.callback && params.callback();
                this.show = false;
            }
        },
        directives: {
            autofocus: {
                inserted: function (el) {
                    Vue.nextTick(function () {
                        el.focus();
                    });
                }
            }
        }
    };
    var locale = {
        computed: {
            locale: function () {
                var locale = RongIM.instance.locale;
                var name = utils.kebabToCamel(options.name);
                return $.extend(true, {}, locale, locale.components[name]);
            }
        }
    };
    options.mixins = options.mixins || [];
    options.mixins.push(locale);
    var Messagebox = Vue.extend(options);
    var instance = new Messagebox({
        el: document.createElement('div')
    });
    var wrap = RongIM.instance.$el.firstChild;
    $(wrap).append(instance.$el);
}

function getErrorMessage(errorCode, defaultMessage) {
    var locale = RongIM.instance.locale;
    if (utils.isEmpty(defaultMessage)) {
        defaultMessage = locale.errorCode['unknown-error'];
    }
    var message = locale.errorCode[errorCode] || defaultMessage;
    utils.console.warn(message + '（错误码：' + errorCode + '）');
    return message;
}

function handleError(errorCode, defaultMessage) {
    var noLoginCodeList = [10102, 10108];
    if(noLoginCodeList.indexOf(errorCode) >= 0) {
        var $router = RongIM.instance.$router;
        $router.push({name: 'login'});
    } else {
        var message = getErrorMessage(errorCode, defaultMessage);
        message && messagebox({
            message: message
        });
    }
}

function getGroupType(type) {
    var locale = RongIM.instance.locale;
    var map = {
        // '0': '自建群',
        '1': locale.tips.departmentGroup,
        '2': locale.tips.companyGroup
    };
    return map[type];
}

function getUsername(user) {
    user = user || {};
    return user.alias || user.name;
}

function unifyUser(user) {
    var keys = ['alias', 'avatar', 'createDt', 'deptId', 'id', 'name', 'path', 'star'];
    var result = {};
    var cacheUser = RongIM.dataModel._Cache.user[user.id] || {};
    keys.forEach(function (key) {
        if (key === 'star') {
            result[key] = user[key] || cacheUser[key] || false;
        } else {
            result[key] = user[key] || cacheUser[key] || '';
        }
    });
    return result;
}

function getSearchUsername(user) {
    user = user || {};
    return user.alias ? user.alias + '(' + user.name + ')' : user.name;
}

function getGroupName(group) {
    if(!utils.isEmpty(group.name)) {
        return group.name;
    }
    var limit = 10;
    var list = [];
    $.each(group.memberNames, function (i, item) {
        var length = utils.getLength(list.concat(item).join(','));
        if(length > limit) {
            return false;
        }
        list.push(item);
    });
    return list.join(',');
}

function sortUsers(users) {
    return users.sort(function (one, another) {
        return getFirstCharCode(one) - getFirstCharCode(another);
    });
}

function getFirstCharCode(user) {
    var letters = utils.convertToABC(getUsername(user)).pinyin.toLocaleLowerCase();
    return letters.charCodeAt(0);
}

// 返回一个删除所有others值后的members副本
function without(members, others) {
    var otherIds = others.map(function (item) {
        return item.id;
    });
    return members.filter(function(item) {
        return otherIds.indexOf(item.id) < 0;
    });
}

function groupNotificationFormat(operation){
    var locale = RongIM.instance.locale;
    var template = '';
    switch (operation) {
        case 'Create':
            template = locale.message.create;
            break;
        case 'Join':
            template = locale.message.join;
            break;
        case 'Invite':
            template = locale.message.invite;
            break;
        case 'Kick':
            template = locale.message.kick;
            break;
        case 'Kicked':
            template = locale.message.kicked;
            break;
        case 'Rename':
            template = locale.message.rename;
            break;
        case 'Quit':
            template = locale.message.quit;
            break;
        case 'Dismiss':
            template = locale.message.dismiss;
            break;
        default:
            template = locale.message.unSupport;
            utils.console.log('不支持操作类型' + operation);
            break;
    }
    return template;
}

function getGroupNotification(message, authId) {
    var locale = RongIM.instance.locale;
    var self = locale.message.self;
    var actionMap = {
        GroupMemChangedNotifyMessage: {
            '1': 'Invite',
            '2': 'Join',
            '3': 'Kick',
            '4': 'Quit'
        },
        GroupNotifyMessage: {
            '1': 'Create',
            '2': 'Dismiss',
            '4': 'Rename'
        }
    };
    var content = message.content;
    var action = actionMap[message.messageType][content.action];

    var operator = content.operatorUser.name || '';
    if(content.operatorUser.id === authId){
        operator = self;
    }

    var targetUsers = content.targetUsers || [];
    var includeMe = targetUsers.filter(function (item) {
        return item.id === authId;
    }).length > 0;
    targetUsers = targetUsers.map(function (item) {
        return item.id === authId ? self : item.name;
    }).join('、');
    if(action === 'Kick' && includeMe) {
        action = 'Kicked';
    }

    var targetGroupName = content.targetGroup.name;
    var format = groupNotificationFormat(action);
    return utils.templateFormat(format, operator, targetUsers || targetGroupName);
}

function getContactNotification(content, authId) {
    var locale = RongIM.instance.locale;
    var actionMap = {
        '1': 'Add',
        '2': 'Accept',
        '3': 'Reject',
        '4': 'Delete'
    };
    var action = actionMap[content.actionType];
    if(action !== 'Accept'){
        return '';
    }
    var targetId = content.operator.userId;
    var targetName = content.operator.name;
    var notificaiton = locale.message.passed;
    if(content.operator.userId === authId){
        targetId = content.target.userId;
        targetName = content.target.name;
        notificaiton = locale.message.pass;
    }
    notificaiton = utils.templateFormat(notificaiton, targetName || targetId);
    return notificaiton;
}

function playSound(){
    if(!playSound.audio) {
        playSound.audio = document.createElement('audio');
        playSound.audio.src = 'data:audio/mp3;base64,SUQzAwAAAAAAI1RTU0UAAAAPAAAATGF2ZjU1LjE5LjEwMAAAAAAAAAAAAAAA//NgwAAAAAAAAAAAAEluZm8AAAAHAAAAIAAADawAExMTGhoaIiIiKSkpMTExOTk5QEBASEhIUFBQUFdXV19fX2dnZ25ubnZ2dn5+foWFhY2NjY2UlJScnJykpKSrq6uzs7O7u7vCwsLKysrK0tLS2dnZ4eHh6enp8PDw+Pj4////TGF2ZjU1LjE5LjEwMAAAAAAAAAAAJAAAAAAA//NAxAAMqAKxf0AQANJEtGaZAWqBCt4gOBjDAkdBA4CGCHKO8o7hjlHJwQ85B9+sH+XeD/+H/wQccq/9GULggvq3bO9O+9oIIy8HHaRGqKZnb2h9HsQEkS5TUXAig2jQO0mJAmzw5Rz/80LEKB2DcswBmGgAw8EScZpVJJTY0M3TW9T0eiZkuJmVHUZ0uE418nBwoKqXp7v//+zvUZD0PM7Lf8xq/9/0L1qrrXTc1Ez/27Ljt//6hPySNUVf/+PYW/4apAcjDkTtlkDCf4dXle3/80DEDhc7MuJfz2gCRbUFBvp7nUdli1pfzUxFrojgNndNFSZbQZlrRWtmU9TUv/0mJoTY1PXffpV30G0rP/r/3/66RnOtq6ra0Pa31t9bf//6+qupS1GKRw171YAYChUiiAppXFNwBf/zQsQMF2MSrZ7bWrkKUwUlF5RR5ZFe5bpr3nVtJyCSKnc0ALYeBOOpJqOjwWYMTEE0GmrpLZS1E1//Ty8NAWBapKjbu6/bVqdv+/ZX/9kZp//9v/11///+32mNMDnFaAdtUttottDYW//zQMQKFose5l5bRL9W2gFkaHcQwms1F0hHAwGhOIZzWJKtaJq6LEigTlmxqeZtaBtrmz9errcwcrDyS6RtXS10//////0ocUKVGbdv/v//9Py//3ezvMICh0HGxSqwmW11yWyi0ezn//NCxAoXMybyXnoKvoeQIYcLPe+GSG5w5t2LvASCg8R0/DgT7CYUH2LEd/wji9kGU6JTu7wjwic27iACLvmRK/sd/Pp/Sc7odyEZT+8hGump1/////////+6yEUxgt4y/8t26rVBiUpt//NAxAkWoc6wANPWlJsRL/Jq42t5xB1I+jVrv43WFiM5RoMazzNc6k2JwPF6YD8kqaneTU1dpHpSNrls36BbDnc1dRzX8V9/z/FtqHQQIbVKJ2ApLdH////9odOioCrRr7a27/7j0eX/80LECRXLGwJeetS7m826jHTWJC2j+OyBF1m3H2FEPpn6FW1kyx/xqOHoIa1f/0SHtayuKtKboC8CTFjzVc+636fSi/1NGIhW/5reZQnKN7/////////2rQli1cBfA/PPMcKvaOpGDOj/80DEDRPptrGVWVAA2TwWsObbjDIEvV8/x/XIl27ercjMZiOjl5uYgrgkhK6nq5qR6/OnNqepxCR1R7t///99hmgWV+XFf////8kFgsGQEvpPp/mSFgCxglECGmEIjY4uREHgRFbdDf/zQsQYGePGtAGZOABSujmuymjpFmnDYJUlRkwfPOZ0fq8bkz0bonzeGAXiWJYlng//y3+eTjc+N3b9f/5v757nvIFSYrB3/////uDsuYJbsTz889P//+3//+Th+vj5zg6wcB4l2MolaP/zQMQMFsJi0AGPUACg6BJAaoDIfp6mEJ9Xj0x0tepKUHu/nIkoOdQPdQgECw+UgImIjtEleuROdOnH///zH0orkpMDaLX+slAOf/scJLDYmDoiAz2MDtH9X4UpsZhVttltstGM28tW//NCxAwTwk72X89QAtHbDz0ark8LkJf/X37Ut9rYSC5djnsjNpCeSIY9nfY+RAPAHj0mLneqqTTRYJnvdK///b0Lf///+9TTWiIFp////5rwA/k//zuWvj27iWki34ebOgLAzBp/ajFx//NAxBkTulK1lMKOuMadqe6nuexKddke80HRq3TTMzgLnc1Nb1RXEva5t3P//9fR+yf//+eeqznOB2SNNxTR7v/600H35/9+h7VQHQJUsgqzYlZfQ8ylfkvL5cI77PWtIkGdjLdFb7H/80LEJRSqbqTK0064oGE1rXu2ydRWFwRUgyFNJVNq4w71pdP///vt/1//zy83wMGlWU2R7aWCP+38mv/f1NaEQnKdyoOao1FQuEHGhK/rJgxLnTldiqQnu7O+612Bl2K6JpTUFkw4nNP/80DELhPaTpwA2pS4WedOMOiCLZx3c7//fv2////6OaiTSgT7Rc+G+7Rf9v1ilRomnrtpttdR5LtCaH6xeRUI8KxarnqC2r4ljqgf9E2qXqCkTmEXxpHr9hf7mftal7kMm7Qg8kKz9v/zQsQ5EqE+8l5rUHIiKJF53/+GXUmHFHvtu/9PZoX/39jswX6ilSCgifYtlzD1M1mRcnmA6rQVRQUs8FyLFW199RMPoo7qtqaH0TYzRPI00HIVksAi7NZ3vX9f3/1r///4kjKuwGHkU//zQMRKFApSlADTSrgEQzIf//WqtaYdltltttGqfUdDZ0w8OsSYRb1Let7JXhbV1K0qTrmiJONalOpnXZG54NRqkmn01Y02obvOPtp//+2j1/9//9J6NaeMD6kAlvfLoSp9+5nqllUV//NCxFQUqlbeXmtOuqSVdtttstHl1FQgj4cdQuglE+1V12EZ82i9tBLLMqmqpzLPqDwBqEBEN1R3V1aoOTndUY5NkVP/fts//1//6GtO1GjWD3fr2+zypZSVKpY6ZrtZttth86W0creG//NAxF0Tik7aXmqOupS4agm1up9Vnase55J361tSUeFVrK9ts4L+3qRGNoHias6fVv7/Vm753///STmtpNBfDQJNL3VvvLX/Y8Y99ppUrlR9/6n3cLQWCz92sGF6kyQgAkMvbaGpnef/80LEaRRqTuJeW1S6MDaedT3PfYMXe6Nt6C8AIY5IruxGjs9hHtY5aW//3X53////qaxy6gOjVjhAb1ff/v2j5VUWOiWWWW220ecRUDAUqIcwxODsKHmsj5vFz99H9hHLtNnob0xgAir/80DEcxLSToAA0pS4hx77ZyXMJtsYm///7bLp/r//oqyyM6BUMKImTzaL1zPXXnLbn1NQ5Cn/q93ngr9s2E0gfLI6ksbsrLtpokf9LJdH/ZthHkNnSstn9EdwGOYGKSabLS1WacV7u//zQsSCE/JKyl5qjrp//+n3X////RbPzgJhLF1BxibHf9exUerrqV39/3P19ClTL+3VwVZQOgnHM8dIYeJjaqdqKrtd8zerBNBPWqo6rVBLAJD9zTd26XITX0Z9//+m2/T/+/b6XllNw//zQMSOEvJSdADLTrgz4xAFd7yNFe6vE2i91KJBDSgVddktskHvUMxtkuaFobgPqFataKzM01FT3U/Q9aA63QqmCDV4xQhSgqXTR3ST4JH6UKYvVe+XVO4CynM32tL3XLbS7C0LQw5l//NCxJ0Uckp0KsqUuBf3pvclH82pb19xyIgsAjACjc92zaH/z+fSprtmwrM1yqpvHOjIubS6+/rpo3nb4//9GQoCX8TEHf0kwOAKmzQThvCLzZFEKlAmRzEQrmOKEUysje52qyKjizKl//NAxKcWOk6qXmtEul8qPSxCm5JZmiGKLzj1uMbPfkVfWSCbi/rkahpRuIgc+trLXVbbveuVTwAKlzd1GXywuG4vN78upa36uimIYbmspKm2g7E4KdFlpFH2i/oUuRVSkDpW7V55uNr/80LEqRoSTnpeysq4tZ+U5if+G+P6mbSnlebVlNF/mhUNuEgSHFxHGNKDzS5iQSQePN6SuSXJrVUkgNqX7ayEa66huG1FE8Ww9UAMKN4+mcf77k59D9Ozj8bbuyln0t0BrAmRsZLJQor/80DEnBraUmA+01C4nNVtxh2uLIXK6sV0/ROx0VWqqKVqdN3L9W0mR9QgDDCtaEl2N2IFTzRo56zLqCulJuQOfUyy/kXsctdrPCOoDvp11VXHohh3257b/20f9X7TQEWzumnX/R9Naf/zQsSLF/JOcb6jSrj6M9yju9X9Kb9ffT2ZHww9tucrbL4qqhdf7/llK+UGmTUAVqKpkwGzgaNUM2XEEyI7/o8v/3/X8YDPFh1SbKPkeZZsUtVvrtqCeoevsvlauvsRzzN1yEl0KhQRc//zQMSHEaJKVBTShLhb6wMnsAyJPAUUgdJqHAlczLBbak/0s4a3y96pyr9BX54tu8rjeLZ776kGiy0Ddkk/6g64cpi3FdQSdYZjmoEyVPQQDAVWGpNXGzuNMFSGMNcuLMnYm5WoXmMD//NCxJsPCPpUFC0KcBIYzUeExU6ye195UrbU//KqHjCy867zp6dOqPFUdx0O9MCgEJHjv2laSRUsSEQmEqZMQU1FMy45OS41qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NAxLoRgP44CjUEcKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/80LEzxIwkhAAG8RMqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqo=';
    }
    playSound.audio.play();
}

function mountDialog(options, callback) {
    var src = options.template;
    if(mountDialog[src] === 'busy') {
        return;
    }
    mountDialog[src] = 'busy';
    var promise;
    var isDOM = options.template[0] === '#';
    if(isDOM) {
        var html = $(options.template).html();
        promise = $.Deferred().resolve(html).promise();
    } else {
        promise = $.get(src);
    }
    promise.then(function (html) {
        $.extend(options, {template: html});
        options.mixins = options.mixins || [];
        var locale = {
            computed: {
                locale: function () {
                    var locale = RongIM.instance.locale;
                    var name = utils.kebabToCamel(options.name);
                    return $.extend(true, {}, locale, locale.components[name]);
                }
            },
            methods: {
                localeFormat: utils.templateFormat
            }
        };
        options.mixins.push(locale);

        var Dialog = Vue.extend(options);
        var instance = new Dialog({
            el: document.createElement('div')
        });
        var wrap = RongIM.instance.$el.firstChild;
        $(wrap).append(instance.$el);
        $.isFunction(callback) && callback(instance);
    }).always(function () {
        delete mountDialog[src];
    });
}

function highlight(string, keyword) {
    if(utils.isEmpty(keyword)) {
        return string;
    }
    var pattern = new RegExp('(' + keyword + ')', 'ig');
    return string.replace(pattern, '<mark>$1</mark>');
}

function equalMessage(messageA, messageB) {
    var result;
    if (messageA.messageId) {
        result = messageA.messageId === messageB.messageId;
    }  else {
        result = messageA.messageUId === messageB.messageUId;
    }
    return result;
}

function createNotificationMessage(conversationType, targetId, content) {
    var msg = new RongIMLib.InformationNotificationMessage({message: content});
    var params = {
        conversationType: conversationType,
        targetId: targetId,
        objectName: 'RC:InfoNtf',
        content: msg,
        sentStatus: utils.sentStatus.SENT
    };
    return params;
}

function searchAlias(users, keyword, userApi) {
    var searchedIdList = users.map(function (item) {
        return item.id;
    });
    var aliasList = userApi.getAlias();

    $.each(aliasList, function(key, value) {
        var user = {
            id: key,
            alias: value
        };
        if(!user.alias){
            return;
        }
        var match = utils.searchName([user.alias], keyword);
        if(!match){
           return;
        }
        var existed = searchedIdList.indexOf(user.id) >= 0;
        if(existed){
            return;
        }
        userApi.get(user.id, function (errorCode, user) {
            if (errorCode) {
                utils.console.log('userApi.get failed:' + errorCode + ', userid:' + user.id);
                return;
            }
            users.push(user);
        });
    });
}

var CallType = {
    MEDIA_AUDIO: 1,
    MEDIA_VEDIO: 2
};

var RCCallStatus = {
     /*!
      初始状态
      */
    //RCCallIdle      =  0,
    /*!
      正在呼出
      */
    RCCallDialing: 1,
    /*!
      正在呼入
      */
    RCCallIncoming: 2,
    /*!
      收到一个通话呼入后，正在振铃
      */
    RCCallRinging: 3,
    /*!
      正在通话
      */
    RCCallActive: 4,
    /*!
      已经挂断
      */
    RCCallHangup: 5
};

// 文件消息是否取消上传
function isCanceled(message) {
    return message.messageType === 'LocalFileMessage' && message.content.status === 0;
}

function sameConversaton(one, another) {
    var oneConversationType = +one.conversationType;
    var anotherConversationType = +another.conversationType;
    var sameConversationType = oneConversationType === anotherConversationType;
    var sameTargetId = one.targetId === another.targetId;
    return sameConversationType && sameTargetId;
}

var UserType = {
    STAFF: 0,
    VISITOR: 1
};

var FriendState = {
    //邀请 0
    INVITE: 0,
    //受邀 1
    INVITEE: 1,
    //接受 2
    ACCEPT: 2,
    //被接受 3
    ACCEPTEE: 3
};

RongIM.common = {
    CallType: CallType,
    RCCallStatus: RCCallStatus,
    sameConversaton: sameConversaton,
    textMessageFormat: textMessageFormat,
    convertMessage: convertMessage,
    buildMessage: buildMessage,
    smoothScroll: smoothScroll,
    messagebox: messagebox,
    getErrorMessage: getErrorMessage,
    handleError: handleError,
    getGroupType: getGroupType,
    getUsername: getUsername,
    unifyUser: unifyUser,
    getSearchUsername: getSearchUsername,
    getGroupName: getGroupName,
    sortUsers: sortUsers,
    without: without,
    // showGroupNotification: showGroupNotification,
    getGroupNotification: getGroupNotification,
    playSound: playSound,
    mountDialog: mountDialog,
    highlight: highlight,
    equalMessage: equalMessage,
    createNotificationMessage: createNotificationMessage,
    searchAlias: searchAlias,
    isCanceled: isCanceled,
    UserType: UserType,
    FriendState: FriendState,
    getContactNotification: getContactNotification
};

})(RongIM, {
    RongIMLib: RongIMLib,
    jQuery: jQuery
});
