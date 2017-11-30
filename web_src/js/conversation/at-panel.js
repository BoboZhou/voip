'use strict';
(function(RongIM, dependencies, components) {

var utils = RongIM.utils;

components.getAtPanel = function(resolve, reject) {
    var options = {
        name: 'at-panel',
        template: '#rong-template-at-panel',
        components: {
            avatar: components.getAvatar
        },
        data: function() {
            return {
                positionStyle: {},
                list: [],
                isShow: false,
                value: null
            };
        },
        mounted: function () {
            mounted(this);
        },
        methods: getMethods()
    };
    utils.asyncComponent(options, resolve, reject);
};

function mounted(context) {
    var im = RongIM.instance;
    im.$on('imclick', function () {
        context.isShow = false;
    });
}

function getMethods() {
    return {
        getValue: function() {
            return this.value;
        },
        render: function(memberList, position, atKeyword) {
            render(this, memberList, position, atKeyword);
        },
        prev: function() {
            var result = getNextOrPrev(this, this.list, this.value, -1);
            this.value = result.item;
            this._scroll(result.index);
        },
        next: function() {
            var result = getNextOrPrev(this, this.list, this.value, +1);
            this.value = result.item;
            this._scroll(result.index);
        },
        clickSelect: function(member) {
            this.$emit('atPanelClickSelect', member);
            this.isShow = false;
            this.value = null;
        },
        _scroll: function (index) {
            scroll(this, index);
        },
        isAtAll: function (user) {
            return user.id === 0;
        }
    };
}

function getNextOrPrev(context, list, item, opt) {
    if (isNaN(opt)) {
        return;
    }
    item.selected = false;
    var index = list.indexOf(item);
    var length = list.length;
    index += opt;
    if (index < 0) {
        index = length - 1;
    }
    if (index > length - 1) {
        index = 0;
    }
    var resultItem = list[index];
    resultItem.selected = true;
    context.$set(list, index, resultItem);
    return {
        item: resultItem,
        index: index
    };
}

function render(context, memberList, position, atKeyword) {
    if (memberList.length === 0) {
        context.isShow = false;
        return;
    }
    var list = memberList.map(function(item) {
        item.selected = false;
        return item;
    });

    if(atKeyword && atKeyword.text.length === 0) {
        list.unshift({
            id:0,
            name: context.locale.everyone,
            avatar:''
        });
    }

    var selectedMember = list[0];
    selectedMember.selected = true;

    context.value = selectedMember;
    context.positionStyle = position;
    context.list = list;
    context.isShow = true;
}

function scroll(context, index) {
    var container = context.$el;
    var curEle = container.children[index];
    var top = curEle.offsetTop;
    var containerHeight = container.offsetHeight + container.scrollTop;
    if (top + curEle.offsetHeight > containerHeight) {
        var scrollTop = top - container.offsetHeight + curEle.offsetHeight;
        container.scrollTop = scrollTop;
    } else if (top < container.scrollTop) {
        container.scrollTop = top;
    }
}

})(RongIM, {
    jQuery: jQuery
}, RongIM.components);
