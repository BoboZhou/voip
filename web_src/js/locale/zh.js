'use strict';
/* eslint-disable quotes */
/*
desktop locales: https://electron.atom.io/docs/api/locales/

从三位维度进行配置
1. user, conversation, contact, message 等业务数据对象
2. btns, tips 等全局通用的组件
3. components 下逐个 vue 组件进行配置

加载 RongIM.locale.xx 交给 vue 处理
components 下严格对应 vue 组件名称 options.name (组件加载器 asyncComponent 会将组件名称转为驼峰命名 a-b => aB)
组件经加载器处理增加计算属性 locale 和方法 localeFormat
各组件可通过 locale 直接访问对应组件下 key 值(例: signup 组件下可以这样写 locale.title, locale.btns )

使用方法：
根据需要加载语言包 js/locale 下文件
配置支持语言包
value 语言包文件名称（语言缩写）
name 对应说明（语言全称）
RongIM.config.supportLocales = [{
    value: 'zh',
    name: '中文'
}]

// 示例模板 templates/onle-status.html
<ul v-if="showMenu" class="rong-nav-status-menu" :class="['rong-nav-status-' + status]">
    <li class="rong-nav-online"><a href="#" @click.prevent="setStatus('online') ">{{locale.online}}</a></li>
    <li class="rong-nav-leave"><a href="" @click.prevent="setStatus('leave') ">{{locale.leave}}</a></li>
    <li class="rong-nav-busy"><a href="" @click.prevent="setStatus('busy') ">{{locale.busy}}</a></li>
</ul>

如新增加语言包 Afrikaans
1.在 js/locale 新增文件 af.js
(function (RongIM) {

RongIM.locale.af = {};

})(RongIM);
2.在 config.js 中增加对应配置
var supportLocales = [
    ...
    {
        // 对应文件名称
        value: 'af',
        name: 'Afrikaans'
    }
]
*/
(function (RongIM) {
RongIM.locale.zh = {
    "emoji": {
        "key": "zh"
    },
    "time": {
        "yesterday": "昨天",
        "morning": "凌晨",
        "forenoon": "上午",
        "noon": "中午",
        "afternoon": "下午",
        "evening": "晚上",
        "week": ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]
    },
    "tips": {
        "loading": "正在加载...",
        "inputText": "请输入文字...",
        "searching": "正在搜索...",
        "searchEmpty": "没有搜索到{{0}}相关结果",
        "msgboxTitle": "提示",
        "msgboxSubmitText": "确定",
        "departmentGroup": "部门",
        "companyGroup": "全员",
        "contain": "包含: ",
        "fileUnexist": "文件不存在"
    },
    "btns": {
        "edit": "编辑",
        "send": "发送",
        "startConversation": "发起会话",
        "save": "保存",
        "full": "全屏",
        "normal": "退出全屏",
        "prev": "上一张",
        "next": "下一张",
        "prevPage": "上一页",
        "nextPage": "下一页",
        "reg": "注册",
        "login": "登录",
        "logining": "登录中...",
        "logout": "退出登录",
        "rememberMe": "自动登录",
        "forget": "忘记密码",
        "remove": "删除",
        "removeConversation": "删除会话",
        "cancel": "取消",
        "close": "关闭",
        "confirm": "确定",
        "back": "返回",
        "collapse": "收起",
        "more": "查看全部",
        "checkedAll": "全选",
        "clear": "清空",
        "search": "搜索",
        "recall": "撤回",
        "copy": "复制",
        "forward": "转发",
        "untop": "取消置顶",
        "top": "置顶",
        "mute": "消息免打扰",
        "unmute": "允许消息通知",
        "draft": "草稿",
        "saveContact": "保存到通讯录",
        "add": "添加",
        "inferior": "下级",
        "zoomOut": "缩小",
        "zoomIn": "放大",
        "selectFile": "本地上传",
        "groupChat": "发起群聊",
        "addFriend": "添加好友",
        "createGroup": "创建群组",
        "maximize": "最大化",
        "minimize": "最小化",
        "restore": "还原",
        "download": "下载",
        "removeQuit": "删除并退出",
        "confirmReply": "确认并回复",
        "newPin": "新建PIN"
    },
    "contact": {
        "contact": "联系人",
        "group": "群组",
        "orgContact": "企业通讯录",
        "addressList": "企业通讯录",
        "star": "星标联系人",
        "friend": "我的好友",
        "selectedMember": "已选择联系人（{{0}}）",
        "emptyMember": "请选择需要添加的联系人",
        "expandDept": "下级",
        "person": "人"
    },
    "conversation": {
        "draft": "草稿",
        "mute": "消息免打扰",
        "atme": "有人@我",
        "messageSentFail": "消息发送失败",
        "empty": "暂无会话"
    },
    "message": {
        "unknown": "当前版本暂不支持查看此消息",
        "read": "已读",
        "unread": "未读",
        "checkUnread": "查看未读",
        "allRead": "全部已读",
        "unreadMember": "{{0}}人未读",
        "unreadMessageCount": "{{0}}条未读消息",
        //以下为群信息提示
        "self": "你",
        "create": "{{0}}创建了群组",
        "join": "{{0}}加入了群组",
        "invite": "{{0}}邀请{{1}}加入了群组",
        "kick": "{{0}}将{{1}}移出了群组",
        "kicked": "{{1}}被{{0}}移出了群组",
        "rename": "{{0}}修改群名称为“{{1}}”",
        "quit": "{{0}}退出了群组",
        "dismiss": "{{0}}解散了群组",
        "unSupport": "不支持操作类型",
        //以下位好友验证通过后,聊天页面的提示信息
        "passed": "{{0}}通过了你的好友验证请求，现在可以开始聊天了",
        "pass": "你通过了{{0}}的验证请求，现在可以开始聊天了",
        "recallSelf": "你撤回了一条消息",
        "recallOther": "{{0}}撤回了一条消息",
        "cardSelf": "你推荐了{{0}}",
        "cardOther": "向你推荐了{{0}}",
        "prefix": {
            "ImageMessage": "[图片]",
            "LocalImageMessage": "[图片]",
            "VoiceMessage": "[语音]",
            "LocationMessage": "[位置]",
            "FileMessage": "[文件]",
            "LocalFileMessage": "[文件]",
            "SightMessage": "[小视频]",
            "RichContentMessage": "[图文]",
            "AudioMessage": "[语音通话]",
            "VideoMessage": "[视频通话]",
            "ShareScreenMessage": "[屏幕共享]"
        }
    },
    "user": {
        "mobile": "手机",
        "signTel": "手机号",
        "tel": "电话",
        "email": "邮箱",
        "deptName": "部门",
        "dutyName": "职位",
        "supervisorName": "上级",
        "password": "密码",
        "nickName": "昵称",
        "account": "登录名"
    },
    "pin": {
        "send": "我发出的",
        "receive": "我收到的"
    },
    "voip": {
        "shareScreen": "屏幕共享",
        "audio": "语音通话",
        "video": "视频通话",
        "unAccept": "未接听",
        "end": "已结束",
        "audioTip": "正在语音通话中！",
        "videoTip": "正在视频通话中！",
        "shareScreenTip": "正在屏幕共享中！",
        "summaryCodeMap": {
            1: '已取消',
            2: '已拒绝',
            3: '通话时长 ',
            4: '己方忙碌',
            5: '未接听',
            6: '己方不支持当前引擎',
            7: '己方网络出错',
            8: '其他设备已处理',
            11: '对方已取消',
            12: '对方已拒绝',
            13: '通话时长 ',
            14: '对方忙碌中',
            15: '对方无应答',
            16: '对方不支持当前引擎',
            17: '对方网络错误',
            18: 'voip 不可用'
        }
    },
    "components": {
        "signup": {
            "title": "注册",
            "nickNameTip": "请输入昵称",
            "mobileEmptyTip": "请输入手机号",
            "mobileErrTip": "请检查手机号格式",
            "captchaTip": "请输入验证码",
            "captcha": "短信验证码",
            "pwdTip": "请输入密码",
            "pwdLenTip": "密码长度为6-16位",
            "pwdHasSpace": "密码不能包含空格",
            "sendCaptcha": "发送验证码",
            // 界面布局原因这里使用英文括号比较合适
            "sentCaptcha": "已发送 ({{0}})"
        },
        "login": {
            "scanLogin": "扫码登录",
            "pwdLogin": "密码登录",
            "QRCodeExpired": "您的二维码已经失效，",
            "refreshTip": "请点击下方的刷新按钮",
            "scanTip": "请扫描二维码登录",
            "refresh": "刷新",
            "mobileEmptyTip": "请输入手机号",
            "mobileErrTip": "请检查手机号格式",
            "account": "输入手机号/帐号",
            "accountEmptyTip": "请输入手机号/帐号",
            "noPwdTip": "请输入密码",
            "autoLogin": "自动登录",
            "forgetPwd": "忘记密码",
            "newRegisty": "新用户注册"
        },
        "search": {
            "chatHistory": "聊天记录",
            "resultHistory": "{{0}}条相关聊天记录",
            "resultHistoryDetail": "{{0}}条与 {{1}} 相关聊天记录"
        },
        "addFriend": {
            "title": "添加好友",
            "searchTip": "输入手机号/{{0}}帐号",
            "mobileEmptyTip": "请输入手机号",
            "mobileErrTip": "请检查手机号格式",
            "searchEmpty": "无法找到该用户，请检查输入帐号"
        },
        "friends": {
            "title": "我的好友"
        },
        "contactGroup": {
            "title": "我的群组"
        },
        "contactList": {
            "contactOrg": "组织架构",
            "myDept": "我的部门",
            "contactStar": "星标联系人",
            "newFriend": "新的好友",
            "contactFriend": "我的好友",
            "contactGroup": "我的群组"
        },
        "requestFriend": {
            "title": "新的好友",
            "accept": "接受",
            "sent": "已发送",
            "expired": "已过期",
            "added": "已添加"
        },
        "contactStar": {
            "title": "星标联系人"
        },
        "user": {
            "editAvatar": "修改头像",
            "removeFriend": "删除好友",
            "addFriend": "添加好友",
            "unsetStar": "取消星标联系人",
            "setStar": "设为星标联系人",
            "aliasEmpty": "添加备注名",
            "removeFriendBefore": "将该好友删除，将同时删除与该好友的聊天记录。"
        },
        "userRequest": {
            "editAvatar": "修改头像",
            "removeFriend": "删除好友",
            "addFriend": "添加好友",
            "unsetStar": "取消星标联系人",
            "setStar": "设为星标联系人",
            "aliasEmpty": "添加备注名",
            "accept": "通过验证",
            "removeFriendBefore": "将该好友删除，将同时删除与该好友的聊天记录！",
            "requestInfo": "，请求加你为好友！"
        },
        "verifyFriend": {
            "title": "验证申请",
            "tip": "你需要发送验证请求，对方通过后才能添加其好友。",
            "iam": "我是"
        },
        "ack": {
            "title": "消息接收人详情",
            "unreadMember": "{{0}}人未读",
            "readMember": "{{0}}人已读"
        },
        "atPanel": {
            "everyone": "所有人"
        },
        "card": {
            "selected": "",
            "empty": ""
        },
        "conversationSetting": {
            "title": "聊天设置",
            "mute": "消息免打扰",
            "top": "置顶聊天"
        },
        "conversation": {
            "setting": "聊天设置",
            "groupSetting": "群设置",
            "history": "历史消息"
        },
        "forward": {
            "forwarded": "已转发"
        },
        "groupSetting": {
            "title": "群设置",
            "groupName": "群名称",
            "admin": "管理员",
            "mute": "消息免打扰",
            "top": "置顶聊天",
            "saveContact": "保存到通讯录",
            "member": "群成员"
        },
        "history": {
            "title": "消息记录",
            "all": "全部",
            "file": "文件",
            "empty": "暂无聊天记录"
        },
        "messageInput": {
            "emoji": "表情",
            "screenshot": "截图",
            "sendFile": "传送文件",
            "sendCard": "发送名片"
        },
        "previewImage": {
            "title": "发送图片"
        },
        "forgetPassword": {
            "title": "重置密码"
        },
        "stepPhone": {
            "phone": "手机号",
            "phoneEmpty": "请输入手机号",
            "phoneInvalid": "请检查手机号格式",
            "captchaEmpty": "请输入验证码",
            "captcha": "验证码",
            "sendCaptcha": "发送验证码",
            "sentCaptcha": "已发送 ({{0}})",
            "next": "下一步"
        },
        "stepPassword": {
            "passwordEmpty": "请输入密码",
            "confirm": "完成",
            "passwordInvalid": "密码长度为6-16位",
            "newPassword": "新密码",
            "enterNewPwd": "确认新密码",
            "newPwdEmpty": "请再次输入密码",
            "newPwdInvalid": "两次密码输入不一致"
        },
        "stepSuccess": {
            "title": "密码重置成功"
        },
        "onlineStatus": {
            "online": "在线",
            "leave": "离开",
            "busy": "忙碌",
            "offline": "离线",
            "mobile": "手机在线"
        },
        "logout": {},
        "welcome": {
            "title": "| 融云企业版",
            "motto": "新的一天 新的开始",
            "contact": "通讯录",
            "conversation": "会话",
            "setup": "设置"
        },
        "groupCreate": {
            "groupName": "群名称",
            "tip": "（非必填项）",
            "createSuccess": "创建群成功",
            "addMemberSuccess": "添加群成员成功",
            "groupNameErr": "群名称不少于2个字"
        },
        "groupRemovemembers": {
            "selectDelTip": "请选择需要删除的联系人",
            "delMemberSuccess": "删除群成员成功",
            "selectNone": "至少要选择1个成员"
        },
        "fileMessage": {
            "openFile": "打开文件",
            "openFolder": "打开文件夹",
            "downloadFile": "下载文件",
            "cancelled": "已取消",
            "cancel": "取消",
            "cancelState": "已取消"
        },
        "cardMessage": {
            "businessCard": "个人名片"
        },
        "unknownMessage": {
            "notSupport": "当前版本暂不支持查看此消息"
        },
        "setting": {
            "title": "设置",
            "account": "帐号设置",
            "password": "密码设置",
            "system": "系统设置"
        },
        "settingAccount": {
            "mobile": "手机号：",
            "quitTitle": "退出登录",
            "quitMessage": "是否确定退出当前帐号"
        },
        "settingSystem": {
            "sysMsgNotify": "系统消息通知提示音",
            "versionInfo": "版本信息",
            "checkUpdate": "检查更新",
            "language": "语言设置"
        },
        "settingPassword": {
            "oldPwd": "原密码：",
            "newPwd": "新密码：",
            "confirmPwd": "确认密码：",
            "tipOldPwd": "请输入原密码",
            "tipNewPwd": "请输入密码",
            "tipPwdLen": "密码长度为6-16位",
            "tipConfirmPwd": "请再次输入密码",
            "tipMatchPwd": "两次密码输入不一致",
            "errorCode": {
                "10101": "原密码错误"
            }
        },
        "editAvatar": {
            "selectPic": "请选择图片",
            "getAvatarTokenErr": "获取上传 token 失败"
        },
        "status": {
            "netErr": "当前网络不可用，请检查你的网络设置"
        },
        "newPin": {
            "contact": "星标联系人",
            "addressList": "企业通讯录",
            "friend": "我的好友",
            "selectedContact": "已选择联系人 ({{0}})",
            "content": "内容",
            "attaCount": "{{0}}个附件",
            "addAtta": "添加附件",
            "sendTime": "发送时间",
            "immediatelySend": "立即发送",
            "specificSend": "在指定时间发送",
            "sendType": "发送方式",
            "sms": "短信",
            "app": "应用内",
            "uploading": "文件正在上传中",
            "pastTime": "不能选择过去的时间",
            "mostReceive": "最多只能选择100个接收人",
            "mostAtta": "最多只能添加十个附件",
            "success": "发送成功"
        },
        "addAttachment": {
            "title": "添加附件",
            "add": "添加附件"
        },
        "addReceiver": {
            "selectedContact": "已选择联系人 ({{0}})",
            "selectedPrompt": "请选择需要添加的联系人"
        },
        "receivedPin": {
            "title": "我收到的 PIN",
            "confirmed": "已确认",
            "unConfirmed": "未确认",
            "reply": "回复( {{0}} )",
            "replyNone": "回复",
            "confirmReceived": "确认收到"
        },
        "sendPin": {
            "title": "我发出的 PIN",
            "unConfirmed": "{{0}}人未确认"
        },
        "pinDetail": {
            "title": "PIN详情",
            "confirmed": "已确认 ({{0}})",
            "unConfirmed": "未确认 ({{0}})",
            "confirmDetail": "确认详情",
            "receiver": "接收人",
            "input":"请输入回复内容",
            "unConfirmedCount": "{{0}}人未确认",
            "inputCanNotEmpty": "回复内容不能为空",
            "allConfirmed": "全部确认"
        }
    },
    "errorCode": {
        'kicked-offline-by-otherclient': '您的账号已经在其他设备登录',
        'unknown-error': '未知错误',

        'old-password-error': '原密码错误',
        'password-changed': '密码已修改，请重新登录！',

        'message-recall-timeout': '撤回失败，该消息的发送时间超过 3 分钟！',

        'network-error': '网络错误',

        'invalid-config': '未能从config.js里取得appkey或server',
        'invalid-token': '无效的token',
        'require-captcha': '请先获取验证码',

        'card-limit': '超过限制，不能选择',

        'forward-limit': '转发消息数量不能超过10个聊天',

        'download-404': '未找到文件，请重新下载',
        'download-interrupted': '下载中断',
        'download-cancelled': '已取消下载',

        'status-1': '连接中',
        'status-2': '连接已断开',
        'status-3': '网络不可用',
        'status-4': '连接已关闭',
        'status-6': '帐号在其他设备已登录',
        'status-12': '域名不正确',

        'contact-1': '至少要选择1个成员',
        'contact-2': '创建群成功',
        'contact-3': '删除成员成功',
        'contact-4': '添加成员成功',
        'contact-5': '退出群成功',
        'contact-6': '解散群成功',

        'lib--1': '请求超时',
        'lib--2': '未知错误',
        'lib-7': '网络不可用',
        'lib-22406': '您当前不在此群组',

        '10001': '权限不足',
        '10002': '不支持',
        // '10003': '一般错误',
        '10004': '功能未实现',
        '10005': '服务端异常',
        '10006': '无效的请求参数',

        '10100': '当前操作用户不存在',
        '10101': '用户名和密码不匹配',
        '10102': '用户未登录',
        '10103': '密码格式不对',
        '10104': '昵称不能为空',
        '10105': '昵称超过最大长度',
        '10106': '头像URL不能为空',
        '10107': '头像URL超过最大长度',
        '10108': '用户未登录',
        '10109': '用户名为空',
        '10110': '用户密码为空',
        '10111': '帐户被禁用',
        '10112': '获取token失败',
        '10113': '用户id不能为空',
        '10114': '密码不能为空',
        '10115': '无效的手机号码',
        '10116': '发送验证码频率过快',
        '10117': '验证码已过期',
        '10118': '请先发送验证码',
        '10119': '请先校验验证码',
        '10120': '验证码错误',
        '10121': '用户已存在',
        '10122': '登录token超时',
        '10123': '登录token无效',
        '10126': '原密码错误',

        '10200': '所请求部门不存在',
        '10201': '部门名不能为空',
        '10202': '无效的部门ID',
        '10203': '上级部门未找到',
        '10204': '非法的创建者ID',
        '10205': '创建者ID未找到',
        '10206': '无效的ManagerID',
        '10207': 'Manager未找到',
        '10208': '无效的部门成员ID',
        '10209': '部门成员为空',
        '102010': '已经存在的部门ID',

        // '10400': '不支持的排序类型',
        // can not add yourself
        '10400': '不能加自己为好友',
        // request not exist
        '10401': '目标联系人不存在',
        // friend not found
        '10402': '朋友不存在',
        // request is timeout
        '10403': '请求已过期',
        // friendship is created
        '10404': '已是朋友关系',

        '10500': '未知员工',
        '10501': '员工姓名不能为空',
        '10502': '员工名已经存在',
        '10503': '员工邮箱不能为空',
        '10504': '员工邮箱已经存在',
        '10505': '无效的员工ID',
        '10506': '员工ID已经存在',
        '10507': '管理员不存在',
        '10508': '请填写手机号码',
        '10509': '手机号码已存在',

        '10600': '所请求群组不存在',
        '10601': '群名称不能为空',
        '10602': '群名称长度超过限制',
        '10603': '群成员总数超过限制',
        '10604': '当前操作用户所能建立的群组个数超过限制',
        '10605': '所请求群成员不存在',
        '10606': '群成员已经存在',
        '10607': '无效的群组ID',
        '10608': '无效的群组成员ID',
        '10609': '对应的部门未找到',
        '10610': '无效的对应部门ID',
        '10611': '缺少群组类型',
        '10612': '群组ID已经存在',
        '10613': '官方群已存在',
        '10614': '公司不存在',
        '10615': '无效的公司ID',

        '10700': '公司未找到',
        '10701': '无效的公司ID',
        '10702': '公司ID已经存在',
        '10703': '空的公司名',
        '10704': '空的公司全名',
        '10705': '空的群组名',
        '10706': '官方群已存在',
        '10707': '无官方群',

        '10800': '无效的收藏群组ID',
        '10801': '对应的群组未找到',
        '10802': '收藏群组不存在',

        '10900': '对应联系人未找到',
        '10901': '收藏的联系人不存在',

        '11000': '未找到scope',
        '11001': '未找到名称',

        '12000': '无效的话题',

        '13000': '未找到职位信息',

        '11400': "不在收件人列表",
        '11401': "不是pin的创建者",
        '11402': "未确认",
        '11403': "pin已经被删除",
        '11404': "pin已经发送"
    }
};

})(RongIM);
