'use strict';
(function(namespace){

var baseEmojiFactory = {
        "u1F600": { "en": "grinning", "zh": "\u5927\u7B11", "tag": "\uD83D\uDE00" },
        "u1F601": { "en": "grin", "zh": "\u9732\u9F7F\u800C\u7B11", "tag": "\uD83D\uDE01" },
        "u1F602": { "en": "joy", "zh": "\u6B22\u4E50", "tag": "\uD83D\uDE02" },
        "u1F603": { "en": "smile", "zh": "\u5FAE\u7B11", "tag": "\uD83D\uDE03" },
        "u1F605": { "en": "sweat_smile", "zh": "\u8D54\u7B11", "tag": "\uD83D\uDE05" },
        "u1F606": { "en": "satisfied", "zh": "\u6EE1\u610F", "tag": "\uD83D\uDE06" },
        "u1F607": { "en": "innocent", "zh": "\u65E0\u8F9C", "tag": "\uD83D\uDE07" },
        "u1F608": { "en": "smiling_imp", "zh": "\u574F\u7B11", "tag": "\uD83D\uDE08" },
        "u1F609": { "en": "wink", "zh": "\u7728\u773C", "tag": "\uD83D\uDE09" },
        "u1F611": { "en": "expressionless", "zh": "\u9762\u65E0\u8868\u60C5", "tag": "\uD83D\uDE11" },
        "u1F612": { "en": "unamused", "zh": "\u4E00\u8138\u4E0D\u5FEB", "tag": "\uD83D\uDE12" },
        "u1F613": { "en": "sweat", "zh": "\u6C57", "tag": "\uD83D\uDE13" },
        "u1F614": { "en": "pensive", "zh": "\u54C0\u601D", "tag": "\uD83D\uDE14" },
        "u1F615": { "en": "confused", "zh": "\u8FF7\u832B", "tag": "\uD83D\uDE15" },
        "u1F616": { "en": "confounded", "zh": "\u56F0\u60D1\u7684", "tag": "\uD83D\uDE16" },
        "u1F618": { "en": "kissing_heart", "zh": "\u4EB2\u4E00\u4E2A", "tag": "\uD83D\uDE18" },
        "u1F621": { "en": "rage", "zh": "\u6124\u6012", "tag": "\uD83D\uDE21" },
        "u1F622": { "en": "sob", "zh": "\u54ED", "tag": "\uD83D\uDE22" },
        "u1F623": { "en": "persevere", "zh": "\u4F7F\u52B2", "tag": "\uD83D\uDE23" },
        "u1F624": { "en": "triumph", "zh": "\u751F\u6C14", "tag": "\uD83D\uDE24" },
        "u1F628": { "en": "fearful", "zh": "\u53EF\u6015", "tag": "\uD83D\uDE28" },
        "u1F629": { "en": "weary", "zh": "\u538C\u5026", "tag": "\uD83D\uDE29" },
        "u1F630": { "en": "cold_sweat", "zh": "\u51B7\u6C57", "tag": "\uD83D\uDE30" },
        "u1F631": { "en": "scream", "zh": "\u60CA\u53EB", "tag": "\uD83D\uDE31" },
        "u1F632": { "en": "astonished", "zh": "\u60CA\u8BB6", "tag": "\uD83D\uDE32" },
        "u1F633": { "en": "flushed", "zh": "\u5446\u4F4F", "tag": "\uD83D\uDE33" },
        "u1F634": { "en": "sleeping", "zh": "\u7761\u7720", "tag": "\uD83D\uDE34" },
        "u1F635": { "en": "dizzy_face", "zh": "\u65AD\u7535\u4E86", "tag": "\uD83D\uDE35" },
        "u1F636": { "en": "no_mouth", "zh": "\u65E0\u53E3", "tag": "\uD83D\uDE36" },
        "u1F637": { "en": "mask", "zh": "\u75C5\u4E86", "tag": "\uD83D\uDE37" },
        "u1F3A4": { "en": "microphone", "zh": "KTV", "tag": "\uD83C\uDFA4" },
        "u1F3B2": { "en": "game_die", "zh": "\u8272\u5B50", "tag": "\uD83C\uDFB2" },
        "u1F3B5": { "en": "musical_note", "zh": "\u97F3\u4E50", "tag": "\uD83C\uDFB5" },
        "u1F3C0": { "en": "basketball", "zh": "\u7BEE\u7403", "tag": "\uD83C\uDFC0" },
        "u1F3C2": { "en": "snowboarder", "zh": "\u5355\u677F\u6ED1\u96EA", "tag": "\uD83C\uDFC2" },
        "u1F3E1": { "en": "house_with_garden", "zh": "\u623F\u5B50", "tag": "\uD83C\uDFE1" },
        "u1F004": { "en": "mahjong", "zh": "\u9EBB\u5C06", "tag": "\uD83C\uDC04" },
        "u1F4A1": { "en": "bulb", "zh": "\u706F\u6CE1", "tag": "\uD83D\uDCA1" },
        "u1F4A2": { "en": "anger", "zh": "\u7206\u7B4B", "tag": "\uD83D\uDCA2" },
        "u1F4A3": { "en": "bomb", "zh": "\u70B8\u5F39", "tag": "\uD83D\uDCA3" },
        "u1F4A4": { "en": "zzz", "zh": "ZZZ", "tag": "\uD83D\uDCA4" },
        "u1F4A9": { "en": "shit", "zh": "\u72D7\u5C41", "tag": "\uD83D\uDCA9" },
        "u1F4AA": { "en": "muscle", "zh": "\u808C\u8089", "tag": "\uD83D\uDCAA" },
        "u1F4B0": { "en": "moneybag", "zh": "\u94B1\u888B", "tag": "\uD83D\uDCB0" },
        "u1F4DA": { "en": "books", "zh": "\u4E66\u7C4D", "tag": "\uD83D\uDCDA" },
        "u1F4DE": { "en": "telephone_receiver", "zh": "\u7535\u8BDD", "tag": "\uD83D\uDCDE" },
        "u1F4E2": { "en": "loudspeaker", "zh": "\u6269\u97F3\u5668", "tag": "\uD83D\uDCE2" },
        "u1F6AB": { "en": "stop", "zh": "\u505C\u6B62", "tag": "\uD83D\uDEAB" },
        "u1F6BF": { "en": "shower", "zh": "\u6DCB\u6D74", "tag": "\uD83D\uDEBF" },
        "u1F30F": { "en": "earth_asia", "zh": "\u571F", "tag": "\uD83C\uDF0F" },
        "u1F33B": { "en": "sunflower", "zh": "\u5411\u65E5\u8475", "tag": "\uD83C\uDF3B" },
        "u1F35A": { "en": "rice", "zh": "\u996D", "tag": "\uD83C\uDF5A" },
        "u1F36B": { "en": "chocolate_bar", "zh": "\u5DE7\u514B\u529B", "tag": "\uD83C\uDF6B" },
        "u1F37B": { "en": "beers", "zh": "\u5564\u9152", "tag": "\uD83C\uDF7B" },
        "u270A": { "en": "fist", "zh": "\u62F3\u5934", "tag": "\u270A" },
        "u1F44C": { "en": "ok_hand", "zh": "\u6CA1\u95EE\u9898", "tag": "\uD83D\uDC4C" },
        "u1F44D": { "en": "1", "zh": "\u5F3A", "tag": "\uD83D\uDC4D" },
        "u1F44E": { "en": "-1", "zh": "\u5F31", "tag": "\uD83D\uDC4E" },
        "u1F44F": { "en": "clap", "zh": "\u62CD", "tag": "\uD83D\uDC4F" },
        "u1F46A": { "en": "family", "zh": "\u5BB6\u5EAD", "tag": "\uD83D\uDC6A" },
        "u1F46B": { "en": "couple", "zh": "\u60C5\u4FA3", "tag": "\uD83D\uDC6B" },
        "u1F47B": { "en": "ghost", "zh": "\u9B3C", "tag": "\uD83D\uDC7B" },
        "u1F47C": { "en": "angel", "zh": "\u5929\u4F7F", "tag": "\uD83D\uDC7C" },
        "u1F47D": { "en": "alien", "zh": "\u5916\u661F\u4EBA", "tag": "\uD83D\uDC7D" },
        "u1F47F": { "en": "imp", "zh": "\u6076\u9B54", "tag": "\uD83D\uDC7F" },
        "u1F48A": { "en": "pill", "zh": "\u836F", "tag": "\uD83D\uDC8A" },
        "u1F48B": { "en": "kiss", "zh": "\u543B", "tag": "\uD83D\uDC8B" },
        "u1F48D": { "en": "ring", "zh": "\u6212\u6307", "tag": "\uD83D\uDC8D" },
        "u1F52B": { "en": "gun", "zh": "\u67AA", "tag": "\uD83D\uDD2B" },
        "u1F60A": { "en": "blush", "zh": "\u8138\u7EA2", "tag": "\uD83D\uDE0A" },
        "u1F60B": { "en": "yum", "zh": "\u998B", "tag": "\uD83D\uDE0B" },
        "u1F60C": { "en": "relieved", "zh": "\u5B89\u5FC3", "tag": "\uD83D\uDE0C" },
        "u1F60D": { "en": "heart_eyes", "zh": "\u8272\u8272", "tag": "\uD83D\uDE0D" },
        "u1F60E": { "en": "sunglasses", "zh": "\u58A8\u955C", "tag": "\uD83D\uDE0E" },
        "u1F60F": { "en": "smirk", "zh": "\u50BB\u7B11", "tag": "\uD83D\uDE0F" },
        "u1F61A": { "en": "kissing_closed_eyes", "zh": "\u63A5\u543B", "tag": "\uD83D\uDE1A" },
        "u1F61C": { "en": "stuck_out_tongue_winking_eye", "zh": "\u641E\u602A", "tag": "\uD83D\uDE1C" },
        "u1F61D": { "en": "stuck_out_tongue_closed_eyes", "zh": "\u6076\u4F5C\u5267", "tag": "\uD83D\uDE1D" },
        "u1F61E": { "en": "disappointed", "zh": "\u5931\u671B\u7684", "tag": "\uD83D\uDE1E" },
        "u1F61F": { "en": "anguished", "zh": "\u82E6\u6DA9", "tag": "\uD83D\uDE1F" },
        "u1F62A": { "en": "sleepy", "zh": "\u56F0", "tag": "\uD83D\uDE2A" },
        "u1F62B": { "en": "tired_face", "zh": "\u6293\u72C2", "tag": "\uD83D\uDE2B" },
        "u1F62C": { "en": "grimacing", "zh": "\u9B3C\u8138", "tag": "\uD83D\uDE2C" },
        "u1F62D": { "en": "cry", "zh": "\u54ED\u6CE3", "tag": "\uD83D\uDE2D" },
        "u1F62F": { "en": "hushed", "zh": "\u5BC2\u9759", "tag": "\uD83D\uDE2F" },
        "u1F64A": { "en": "speak_no_evil", "zh": "\u4E0D\u8BF4\u8BDD", "tag": "\uD83D\uDE4A" },
        "u1F64F": { "en": "pray", "zh": "\u7948\u7977", "tag": "\uD83D\uDE4F" },
        "u1F319": { "en": "moon", "zh": "\u6708\u4EAE", "tag": "\uD83C\uDF19" },
        "u1F332": { "en": "evergreen_tree", "zh": "\u6811", "tag": "\uD83C\uDF32" },
        "u1F339": { "en": "rose", "zh": "\u73AB\u7470", "tag": "\uD83C\uDF39" },
        "u1F349": { "en": "watermelon", "zh": "\u897F\u74DC", "tag": "\uD83C\uDF49" },
        "u1F356": { "en": "meat_on_bone", "zh": "\u8089", "tag": "\uD83C\uDF56" },
        "u1F366": { "en": "icecream", "zh": "\u51B0\u6DC7\u6DCB", "tag": "\uD83C\uDF66" },
        "u1F377": { "en": "wine_glass", "zh": "\u9152", "tag": "\uD83C\uDF77" },
        "u1F381": { "en": "gift", "zh": "\u793C\u7269", "tag": "\uD83C\uDF81" },
        "u1F382": { "en": "birthday", "zh": "\u751F\u65E5", "tag": "\uD83C\uDF82" },
        "u1F384": { "en": "christmas_tree", "zh": "\u5723\u8BDE", "tag": "\uD83C\uDF84" },
        "u1F389": { "en": "tada", "zh": "\u793C\u82B1", "tag": "\uD83C\uDF89" },
        "u1F393": { "en": "mortar_board", "zh": "\u6BD5\u4E1A", "tag": "\uD83C\uDF93" },
        "u1F434": { "en": "horse", "zh": "\u9A6C", "tag": "\uD83D\uDC34" },
        "u1F436": { "en": "dog", "zh": "\u72D7", "tag": "\uD83D\uDC36" },
        "u1F437": { "en": "pig", "zh": "\u732A", "tag": "\uD83D\uDC37" },
        "u1F451": { "en": "crown", "zh": "\u738B\u51A0", "tag": "\uD83D\uDC51" },
        "u1F484": { "en": "lipstick", "zh": "\u53E3\u7EA2", "tag": "\uD83D\uDC84" },
        "u1F494": { "en": "broken_heart", "zh": "\u4F24\u5FC3", "tag": "\uD83D\uDC94" },
        "u1F525": { "en": "fire", "zh": "\u706B\u4E86", "tag": "\uD83D\uDD25" },
        "u1F556": { "en": "time", "zh": "\u65F6\u95F4", "tag": "\uD83D\uDD56" },
        "u1F648": { "en": "see_no_evil", "zh": "\u4E0D\u770B", "tag": "\uD83D\uDE48" },
        "u1F649": { "en": "hear_no_evil", "zh": "\u4E0D\u542C", "tag": "\uD83D\uDE49" },
        "u1F680": { "en": "rocket", "zh": "\u706B\u7BAD", "tag": "\uD83D\uDE80" },
        "u2B50": { "en": "star", "zh": "\u661F\u661F", "tag": "\u2B50" },
        "u23F0": { "en": "alarm_clock", "zh": "\u949F\u8868", "tag": "\u23F0" },
        "u23F3": { "en": "hourglass_flowing_sand", "zh": "\u6C99\u6F0F", "tag": "\u23F3" },
        "u26A1": { "en": "zap", "zh": "\u95EA\u7535", "tag": "\u26A1" },
        "u26BD": { "en": "soccer", "zh": "\u8DB3\u7403", "tag": "\u26BD" },
        "u26C4": { "en": "snowman", "zh": "\u96EA\u4EBA", "tag": "\u26C4" },
        "u26C5": { "en": "partly_sunny", "zh": "\u591A\u4E91", "tag": "\u26C5" },
        "u261D": { "en": "point_up", "zh": "\u7B2C\u4E00", "tag": "\u261D" },
        "u263A": { "en": "relaxed", "zh": "\u8F7B\u677E", "tag": "\u263A" },
        "u1F44A": { "en": "punch", "zh": "\u62F3", "tag": "\uD83D\uDC4A" },
        "u270B": { "en": "hand", "zh": "\u624B", "tag": "\u270B" },
        "u270C": { "en": "v", "zh": "v", "tag": "\u270C" },
        "u270F": { "en": "pencil2", "zh": "\u7B14", "tag": "\u270F" },
        "u2600": { "en": "sunny", "zh": "\u6674\u6717", "tag": "\u2600" },
        "u2601": { "en": "cloud", "zh": "\u4E91", "tag": "\u2601" },
        "u2614": { "en": "umbrella", "zh": "\u4F1E", "tag": "\u2614" },
        "u2615": { "en": "coffee", "zh": "\u5496\u5561", "tag": "\u2615" },
        "u2744": { "en": "snowflake", "zh": "\u96EA\u82B1", "tag": "\u2744" }
    };

var utils = {
        extend: function() {
            if (arguments.length === 0) {
                return;
            }
            var obj = arguments[0];
            for (var i = 1, len = arguments.length; i < len; i++) {
                var other = arguments[i];
                for (var item in other) {
                    obj[item] = other[item];
                }
            }
            return obj;
        },
        dom: function(html) {
            var div = document.createElement('div');
            div.innerHTML = html;
            return div.childNodes[0];
        },
        subs: function(template, data, regexp) {
            if (!(Object.prototype.toString.call(data) === "[object Array]")) {
                data = [data];
            }
            var ret = [];
            for (var i = 0, j = data.length; i < j; i++) {
                ret.push(replaceAction(data[i]));
            }
            return ret.join("");

            function replaceAction(object) {
                return template.replace(regexp || (/\\?\{\{([^}]+)\}\}/g), function(match, name) {
                    if (match.charAt(0) == '\\') return match.slice(1);
                    return (object[name] != undefined) ? object[name] : '';
                });
            }
        },
        getCssText: function(cssObj){
            var cssText = '';
            for (var key in cssObj) {
                cssText += key + ":" + cssObj[key] + ";";
            }
            return cssText
        },
        documentAddCSS: function(css) {
            var head = document.getElementsByTagName("head")[0];
            var style = document.createElement("style");
            style.type = "text/css";
            style.innerHTML = css;
            head.appendChild(style);
        }
    };


var isSupportEmoji = (function() {
    return false;
})();

var cssTpl = ".rong-emoji-content { vertical-align: text-bottom;}" +
            ".rong-emoji-yes,.rong-emoji-no { display: inline-block; text-align: center; line-height: 1; }" +
            ".rong-emoji-yes { background-image:none !important; }" +
            ".rong-emoji-no { font-size: 0  !important; overflow: hidden;}";

// imageUri 修改为绝对路径资源防止其他非首页引用此 js 时找不到资源
var options = {
    imageUri: '//f2e.cn.ronghub.com/sdk/emoji-48.png',
    size: 24
};// emoji 配置

function init(opt) {
    if (emojis.length > 0) {
        console.warn("emoji 插件只需初始化一次");
        return;
    }

    options.support = isSupportEmoji ? 'yes' : 'no';
    options = utils.extend(options, opt);

    var baseCss = utils.subs(cssTpl, {size:options.size});
    utils.documentAddCSS(baseCss);

    addBaseData(baseEmojiFactory, "base", function(emoji, index){
        return getEmojiStyle.base(emoji, index, options.size);
    });

}

var emojiHtmlTpl = '<span class="rong-emoji-content rong-emoji-{{support}} rong-emoji-{{en}}" style="{{style}}" name="[{{zh}}]">{{tag}}</span>';
function getEmojiHtml(emoji, style) {
    var data = {
        support:options.support,
        en:emoji.en,
        zh:emoji.zh,
        tag:emoji.tag,
        style:utils.getCssText(style)
    };
    var html = utils.subs(emojiHtmlTpl, data);
    return html;
}

var getEmojiStyle = {
    base: function(emoji, index, size) {
        var offset = index * size;
        return {
            "width": size + "px",
            "height": size + "px",
            "font-size": size + "px",
            "background-size": "auto " + size + "px",
            "background-image": "url(" + options.imageUri + ")",
            "background-position": "-" + offset + "px 0"
        };
    },
    expand: function(emoji, index, size) {
        throw Error('扩展 emoji 未提供获取样式回调');
    }
}

var tagRegStr = ''; // 用于 emoji 正则匹配
var unicodeUTF16Map = {};// 解码使用 unicode 字集和 utf-16 码表
var emojiArr = [];// emoji 对象缓存

var emojis = [];
function addBaseData(emojiFactory, type, callback) {
    
    var index = 0;
    for (var key in emojiFactory) {
        var emoji = emojiFactory[key];
        var style = callback(emoji, index);

        emojiArr.push({
            index: index,
            name: "[" + emoji.zh + "]",
            tag: emoji.tag,
            zh: emoji.zh,
            en: emoji.en,
            type: type,
            html: getEmojiHtml(emoji, style)
        });
        unicodeUTF16Map[key] = emoji.tag;
        tagRegStr += escape(emoji.tag) + '|';

        index++;
    }

    // TODO: 兼容之前版本
    var domArr = emojiArr.map(function(item){
        return utils.dom(item.html);
    });
    [].splice.apply(emojis,[0,0].concat(domArr));
}

var getExpandEmojiStyle = null;

function expand(emojiFactory, callback) {
    addBaseData(emojiFactory, "expand",function(emoji, index){
        return callback(emoji, index, options.size);
    });
    getEmojiStyle["expand"] = callback;
}

function calculateUTF(char) {
    if (61440 < char.charCodeAt(0)) {
        var tag = unicodeUTF16Map[escape(char).replace("%u", "u1")];
        if (tag) {
            return tag;
        }
    }
    return char;
}

function messageDecode(message) {
    return message.replace(/[\uf000-\uf700]/g, function(em) {
        return calculateUTF(em);
    });
}

function getTagRegExp() {
    var regStr = tagRegStr.substring(0, tagRegStr.length - 1);
    regStr = regStr.replace(/%/g,'\\');
    return new RegExp(regStr,'g');
}

function replaceEmoji(message, callback) {
    return message.replace(getTagRegExp(), function(emojiChar) {
        for (var i = 0, len = emojiArr.length; i < len; i++) {
            var emoji = emojiArr[i];
            if (emoji.tag == emojiChar) {
                return callback(emoji);
            }
        }
        return emojiChar;
    });
}

function emojiToHtml(message, size) {
    message = messageDecode(message);
    return replaceEmoji(message, function(emoji) {
        if (size) {
            var style = getEmojiStyle[emoji.type](emoji, emoji.index, size);
            return getEmojiHtml(emoji, style);
        } else {
            return emoji.html;   
        }
    });
}

function emojiToSymbol(message) {
    message = messageDecode(message);
    return replaceEmoji(message, function(emoji) {
        return emoji.name;
    });
}

function getEmojiBySymbol(symbol) {
    for (var i = 0, len = emojiArr.length; i < len; i++) {
        var emoji = emojiArr[i];
        if (emoji.en == symbol || emoji.zh == symbol) {
            return emoji;
        }
    }
    return {};
}

function getEmojisBySymbol(symbolArr) {
    if (Object.prototype.toString.call(symbolArr) !== '[object Array]') {
        return [];
    }

    var emojisDom = [];
    for (var i = 0, len = symbolArr.length; i < len; i++) {
        var emoji = getEmojiBySymbol(symbolArr[i]);
        if (emoji.tag) {
            emojisDom.push(utils.dom(emoji.html));
        }
    }
    return emojisDom;
}

function symbolToEmoji(message, reg) {
    if (Object.prototype.toString.call(reg) !== '[object RegExp]') {
        reg = /\[([^\[\]]+?)\]/g;
    }
    return message.replace(reg, function(str, symbol) {
        var emoji = getEmojiBySymbol(symbol);
        return emoji.tag || str;
    });
}

function getAllEmoji() {
    return emojiArr;
}

namespace.RongIMEmoji = {
    init: init,
    emojis: emojis,
    getAllEmoji:getAllEmoji,
    getEmojisBySymbol: getEmojisBySymbol,
    emojiToHTML: emojiToHtml,
    symbolToEmoji: symbolToEmoji,
    emojiToSymbol: emojiToSymbol,
    messageDecode: messageDecode,
    expand:expand
}

})(window.RongIMLib||window);