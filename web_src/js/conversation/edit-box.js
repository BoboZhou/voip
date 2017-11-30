'use strict';
(function(RongIM, dependencies, components) {

var utils = RongIM.utils;
var KEYCODE = utils.keyCode;
var $ = dependencies.jQuery;

components.getEditBox = function(resolve, reject) {
    var im = RongIM.instance;
    var conversationApi = im.dataModel.Conversation;
    var options = {
        name: 'edit-box',
        template: 'templates/conversation/edit-box.html',
        props: {
            atMembers: {
                type: Array,
                required: false
            },
            draft: {
                type: String
            },
            autoFocus: {
                type: Boolean,
                required: false,
                default: true
            }
        },
        data: function() {
            return {
                value: '',
                at: {},
                atPanel: {},
                atFilterMembers: [],
                atSelectedMembers: []
            };
        },
        mounted: function() {
            mounted(this);
        },
        watch: {
            atFilterMembers: function() {
                atFilterMembersChanged(this);
            },
            value: function() {
                this.$emit('editBoxChange', this.getValue().text);
            }
        },
        methods: getMethods(conversationApi, im)
    };
    utils.asyncComponent(options, resolve, reject);
};

function mounted(context) {
    if (context.autoFocus) {
        context.$el.focus();
    }

    context.$watch('draft', function(newValue) {
        if (newValue !== context.value) {
            context.value = newValue;
        }
    });

    $(context.$el).on('paste', function(event){
        context.$emit('paste', event.originalEvent);
    });

    context.at = new At(context.$el);

    components.getAtPanel(function(option) {
        var AtPanel = Vue.extend(option);
        var atPanelInstance = new AtPanel();
        atPanelInstance.$on('atPanelClickSelect', function(data) {
            context.selectAtMember(data);
        });
        atPanelInstance.$mount();
        context.$el.parentNode.insertBefore(atPanelInstance.$el, context.$el);
        context.atPanel = atPanelInstance;
    });
}

function atFilterMembersChanged(context) {
    var height = document.body.clientHeight;
    var cursorPostion = context.at.getCursorPos();
    var left = cursorPostion.left;
    var bottom = height - cursorPostion.top;
    var atPanelStyle = {
        position: 'fixed',
        left: left + 'px',
        bottom: bottom + 'px'
    };
    context.atPanel.render(context.atFilterMembers, atPanelStyle, context.at.matchStr);
}

function insertText(context, str) {
    var cursorOffset = getCursorOffset(context.$el);
    var text = context.$el.value;

    var beforeCursorStr = text.substring(0, cursorOffset);
    var afterCursorStr = text.substring(context.$el.selectionEnd);

    text = beforeCursorStr + str + afterCursorStr;
    context.$el.value = text;

    cursorOffset += str.length;
    context.$el.focus();
    context.$el.setSelectionRange(cursorOffset, cursorOffset);

    context.value = text;
}

function getMethods(conversationApi, im) {
    return {
        reset: function() {
            reset(this);
        },
        focus: function() {
            this.$el.focus();
        },
        getValue: function() {
            return {
                text: this.value,
                at: this.atSelectedMembers
            };
        },
        insertText: function(str) {
            insertText(this, str);
        },
        saveDraft: function () {
            var params = this.$route.params;
            var conversationType = params.conversationType;
            var targetId = params.targetId;
            var draft = this.value;
            if(utils.isEmpty((this.value || '').trim())){
                draft = '';
            }
            conversationApi.setDraft(conversationType, targetId, draft);
        },
        searchAtShowMembers: function() {
            searchAtShowMembers(this, im);
        },
        selectAtMember: function(member) {
            selectAtMember(this, member);
        },
        findIndexSelectedMemberByName: function(name) {
            return findIndexSelectedMemberByName(this, name);
        },
        searchAtRemove: function(event) {
            searchAtRemove(this, event);
        },
        enter: function() {
            this.$emit('enter', this.getValue());
        },
        keydown: function(event) {
            keydown(this, event);
        },
        keyup: function(event) {
            keyup(this, event);
        },
        prepareinput: function () {
            this.$emit('prepareinput');
        }
    };
}

function reset(context) {
    context.value = context.draft || '';
    context.atSelectedMembers = [];
    if (context.autoFocus) {
        context.$el.focus();
    }
}

function searchAtShowMembers(context, im) {
    var atStr = context.at.inputMatch();
    if (utils.isEmpty(atStr)) {
        context.atFilterMembers = [];
        return;
    }
    var members = searchMember(context.atMembers, atStr.text);
    var myId = im.auth.id;
    context.atFilterMembers = members.filter(function (item) {
        return item.id !== myId;
    });
}

function selectAtMember(context, member) {
    context.atSelectedMembers.push(member);
    var text = context.at.insert(member.name);
    context.value = text;
    context.atFilterMembers = [];
}

function findIndexSelectedMemberByName(context, name) {
    var arr = context.atSelectedMembers;
    for (var i = 0, len = arr.length; i < len; i++) {
        if (name === arr[i].name) {
            return i;
        }
    }
    return -1;
}

function searchAtRemove(context, event) {
    var atStr = context.at.removeMatch();
    if (utils.isEmpty(atStr)) {
        return;
    }

    var index = context.findIndexSelectedMemberByName(atStr.text);
    if (index > -1) {
        event.preventDefault();
        context.atSelectedMembers.splice(index, 1);
        context.value = context.at.remove(atStr);
    }
}

function keydown(context, event) {
    utils.console.log(event.keyCode);
    switch (event.keyCode) {
        case KEYCODE.enter:
            enter(context, event);
            break;
        case KEYCODE.up:
            up(context, event);
            break;
        case KEYCODE.down:
            down(context, event);
            break;
        case KEYCODE.esc:
            context.atFilterMembers = [];
            break;
        case KEYCODE.backspace:
        case KEYCODE.delete:
            context.searchAtRemove(event);
            break;
        case KEYCODE.q:
            if (event.ctrlKey) {
                context.$emit('shareScreen');
            }
            break;
        default:
            $.noop();
            break;
    }
}

function up(context, event) {
    if (context.atFilterMembers.length) {
        event.preventDefault();
        context.atPanel.prev();
    }
}

function down(context, event) {
    if (context.atFilterMembers.length) {
        event.preventDefault();
        context.atPanel.next();
    }
}

function enter(context, event) {
    if (!event.ctrlKey && !event.shiftKey) {
        event.preventDefault();
        if (context.atFilterMembers.length) {
            context.selectAtMember(context.atPanel.getValue());
        } else {
            context.enter();
        }
    }
}

function keyup(context, event) {
    switch (event.keyCode) {
        case KEYCODE.up:
            break;
        case KEYCODE.down:
            break;
        case KEYCODE.esc:
            break;
        default:
            context.searchAtShowMembers();
            break;
    }
}

function searchMember(members, keyword) {

    if (!$.isArray(members) || $.type(keyword) !== 'string') {
        return [];
    }
    // 深拷贝一个数组防止修改原来数组内对象
    members = $.extend(true, [], members);
    if (utils.isEmpty(keyword)) {
        return members;
    }

    var resultArr = [];
    // eg.  As中文 => as中文
    keyword = keyword.toLowerCase();
    for (var i = 0, len = members.length; i < len; i++) {
        var user = members[i];
        if(matchUser(user, keyword)) {
            resultArr.push(user);
        }
    }
    return resultArr;
}
// 此 at 字符串是否可以匹配到此用户
function matchUser(user, keyword) {
    var name = user.name;
    var nameLetter = utils.convertToABC(name);
    var alias = user.alias || '';
    var aliasLetter = utils.convertToABC(alias);
    var sign = '\u0000';
    var matchList = [
        name,
        nameLetter.pinyin,
        nameLetter.first,
        alias,
        aliasLetter.pinyin,
        aliasLetter.first
    ];
    var str = matchList.join(sign);
    return str.toLowerCase().indexOf(keyword) !== -1;
}

function getCursorOffset(el) {
    return el.selectionStart;
}

function At(el) {
    this.el = el;
    this.matchStr = {};
}

At.prototype.inputMatch = function() {
    var cursorOffset = getCursorOffset(this.el);
    var text = this.el.value;
    var beforeCursorStr = text.slice(0, cursorOffset);

    var reg = new RegExp('(?:[^0-9a-z]|^)@([^\u0020@]*)$', 'i');
    var atMatch = reg.exec(beforeCursorStr);
    if (atMatch) {
        var atText = atMatch[1];
        var start = cursorOffset - atText.length;
        this.matchStr = {
            text: atText,
            start: start,
            end: cursorOffset
        };
        return this.matchStr;
    }
};

// 获取光标 相对页面位置
At.prototype.getCursorPos = function() {
    var cursorPostion = $(this.el).caret('offset', this.matchStr.start - 1);
    return cursorPostion;
};

At.prototype.insert = function(str) {

    var text = this.el.value;
    var end = Math.max(this.matchStr.start, 0);
    var beforeAtStr = text.substring(0, end);
    var atText = str + ' ';
    var afterAtStr = text.substring(this.matchStr.end);

    text = beforeAtStr + atText + afterAtStr;
    this.el.value = text;
    this.el.focus();
    var cursorOffset = beforeAtStr.length + atText.length;
    $(this.el).caret('pos', cursorOffset);

    return text;
};

At.prototype.removeMatch = function() {
    var text = this.el.value;
    var cursorOffset = getCursorOffset(this.el);

    var afterCursorStr = text.substring(cursorOffset);

    // 匹配光标在 atText 中间或之前,将光标移至 atText 之后
    var afterReg = /(^[^\u0020@]*\u0020)|(^@[^\u0020@]+\u0020)/;
    var afterCursorAtMatch = afterReg.exec(afterCursorStr);

    if (afterCursorAtMatch) {
        cursorOffset += afterCursorAtMatch[0].length;
        // 移动光标重新获取
        afterCursorStr = text.substring(cursorOffset);
    }

    var beforeCursorStr = text.substring(0, cursorOffset);

    // 匹配光标后的 atText
    var allReg = /@([^\u0020@]+)\u0020$/;
    var atMatch = allReg.exec(beforeCursorStr);

    if (atMatch) {
        var atText = atMatch[1];
        return {
            text: atText,
            start: cursorOffset - atMatch[0].length,
            end: cursorOffset
        };
    }
};

At.prototype.remove = function(matchStr) {

    var text = this.el.value;
    var beforeCursorStr = text.substring(0, matchStr.start);
    var afterCursorStr = text.substring(matchStr.end);
    var value = beforeCursorStr + afterCursorStr;

    this.el.value = value;
    this.el.focus();
    $(this.el).caret('pos', matchStr.start);

    return value;
};

})(RongIM, {
    jQuery: jQuery
}, RongIM.components);
