'use strict';
/* eslint-disable quotes */

(function (RongIM) {

RongIM.locale.en = {
    "emoji": {
        "key": "en"
    },
    "time": {
        "yesterday": "Yday",
        "morning": "Morning",
        "forenoon": "Forenoon",
        "noon": "Noon",
        "afternoon": "Afternoon",
        "evening": "Evening",
        "week": ["Sun.", "Mon.", "Tues.", "Wed.", "Thur.", "Fri.", "Sat."]
    },
    "tips": {
        "loading": "Loading...",
        "inputText": "Please input text...",
        "searching": "Searching...",
        "searchEmpty": "No more {{0}} related results",
        "msgboxTitle": "Hint",
        "msgboxSubmitText": "Confirm",
        "departmentGroup": "Dpt.",
        "companyGroup": "All",
        "contain": "Include: ",
        "fileUnexist": "File does not exist"
    },
    "btns": {
        "edit": "Edit",
        "send": "Send",
        "startConversation": "Send Messages",
        "save": "Save",
        "full": "FullScreen",
        "normal": "Exit",
        "prev": "Previous",
        "next": "Next",
        "prevPage": "PreviousPage",
        "nextPage": "NextPage",
        "reg": "Sign Up",
        "login": "Login",
        "logining": "Logining...",
        "logout": "Log Out",
        "rememberMe": "Automatic Login",
        "forget": "Forgot Password",
        "remove": "Delete",
        "removeConversation": "Delete Conversation",
        "cancel": "Cancel",
        "close": "Close",
        "confirm": "Confirm",
        "back": "Back",
        "collapse": "PackUp",
        "more": "View All",
        "checkedAll": "Select All",
        "clear": "Clear",
        "search": "Search",
        "recall": "Recall",
        "copy": "Copy",
        "forward": "Forward",
        "untop": "Remove from Top",
        "top": "Sticky on Top",
        "mute": "Mute Notifications",
        "unmute": "Receive new notifications",
        "draft": "Draft",
        "saveContact": "Save to Contacts",
        "add": "Add",
        "inferior": "Subordinate",
        "zoomOut": "Zoom Out",
        "zoomIn": "Zoom In",
        "selectFile": "Upload",
        "groupChat": "Group Chat",
        "addFriend": "Add Friends",
        "createGroup": "Create New Group",
        "maximize": "Maximize",
        "minimize": "Minimize",
        "restore": "Restore",
        "download": "Download",
        "removeQuit": "Delete and Exit",
        "newPin": "New PIN"
    },
    "contact": {
        "contact": "Corporate Contacts",
        "group": "Group Chat",
        "orgContact": "Organization",
        "addressList": "Organization Contacts",
        "star": "Star",
        "friend": "My Friends",
        "selectedMember": "Selected Member({{0}})",
        "emptyMember": "Select Contacts you want to add",
        "expandDept": "Subordinate",
        "person": "Members"
    },
    "conversation": {
        "draft": "Draft",
        "mute": "Mute Notification",
        "atme": "You were mentioned",
        "messageSentFail": "Sent failed",
        "empty": "No Chat"
    },
    "message": {
        "unknown": "The current version doesn't support for the message",
        "read": "Read",
        "unread": "Unread",
        "checkUnread": "ViewUnread",
        "allRead": "All Read",
        "unreadMember": "{{0}}Unread",
        "unreadMessageCount": "{{0}}Unread Messages",
        //以下为群信息提示
        "self": "You",
        "create": "{{0}} created the group",
        "join": "{{0}} join the group",
        "invite": "{{0}} invited {{1}} to join the group",
        "kick": "{{0}} remove {{1}} from the group chat",
        "kicked": "{{1}} were removed from the group chat by {{0}}",
        "rename": "{{0}} changed the group name to “{{1}}”",
        "quit": "{{0}} quitted the group",
        "dismiss": "{{0}} disbanded the group",
        "unSupport": "不支持操作类型",
        //以下位好友验证通过后,聊天页面的提示信息
        "passed": "{{0}} has accepted your friend request. Now let's chat!",
        "pass": "You have accepted {{0}}'s friend request. Now start chat!",
        "recallSelf": "you recalled a message",
        "recallOther": "{{0}} recalled a message",
        "cardSelf": "You shared {{0}}",
        "cardOther": "Shared {{0}}",
        "prefix": {
            "ImageMessage": "[Photo]",
            "LocalImageMessage": "[Photo]",
            "VoiceMessage": "[Audio]",
            "LocationMessage": "[Location]",
            "FileMessage": "[File]",
            "LocalFileMessage": "[File]",
            "SightMessage": "[Video]",
            "RichContentMessage": "[Link]",
            "AudioMessage": "[Audio Call]",
            "VideoMessage": "[Voice Call]",
            "ShareScreenMessage": "[Share Screen]"
        }
    },
    "user": {
        "mobile": "Cel.",
        "signTel": "Phone Number",
        "tel": "Phone",
        "email": "Email",
        "deptName": "Dpt.",
        "dutyName": "Position",
        "supervisorName": "Superior",
        "password": "Password",
        "nickName": "Name",
        "account": "Account"
    },
    "pin": {
        "send": "我发出的",
        "receive": "我收到的"
    },
    "voip": {
        "shareScreen": "Share screen",
        "audio": "Audio Call",
        "video": "Voice Call",
        "unAccept": "missed",
        "end": "ended",
        "audioTip": "Audio call is on. Try again later.",
        "videoTip": "Voice call is on. Try again later.",
        "shareScreenTip": "Share screen is on. Try again later.",
        "summaryCodeMap": {
            1: 'Cancelled',
            2: 'Declined',
            3: 'Duration ',
            4: 'Busy line',
            5: 'No answer',
            6: 'Not support the engine',
            7: 'Network Error',
            8: 'Has been handled by other end',
            11: 'Cancelled',
            12: 'Declined',
            13: 'Duration ',
            14: 'Busy line',
            15: 'No answer',
            16: 'Not support the engine',
            17: 'Network Error',
            18: 'voip unavailable'
        }
    },
    "components": {
        "signup": {
            "title": "Sign Up",
            "nickNameTip": "Please input name",
            "mobileEmptyTip": "Please input mobile number",
            "mobileErrTip": "The mobile nunber is illegal, please input again",
            "captchaTip": "Please input verification code ",
            "captcha": "Verification Code",
            "pwdTip": "Please input password",
            "pwdLenTip": "Please input 6-16 characters",
            "pwdHasSpace": "Please enter a password without spaces",
            "sendCaptcha": "Get code",
            // 界面布局原因这里使用英文括号比较合适
            "sentCaptcha": "Sent ({{0}})"
        },
        "login": {
            "scanLogin": "QR code",
            "pwdLogin": "Password",
            "QRCodeExpired": "The QR code is invalid，",
            "refreshTip": "please refresh to get new QR code",
            "scanTip": "Please use QR code to log in",
            "refresh": "Refresh",
            "mobileEmptyTip": "Please input mobile number",
            "mobileErrTip": "The mobile nunber is illegal, please input again",
            "account": "Phone Number",
            "accountEmptyTip": "Please input Phone Number",
            "noPwdTip": "Please input password",
            "autoLogin": "Automatic login",
            "forgetPwd": "Forgot Password",
            "newRegisty": "Sign Up"
        },
        "search": {
            "chatHistory": "Chat History",
            "resultHistory": "{{0}} message(s) related results",
            "resultHistoryDetail": "{{0}} message(s) related to {{1}}"
        },
        "addFriend": {
            "title": "Add Friends",
            "searchTip": "Mobile phone number/{{0}} account",
            "mobileEmptyTip": "Please input mobile number",
            "mobileErrTip": "The mobile nunber is illegal, please input again",
            "searchEmpty": "The account does not exist"
        },
        "friends": {
            "title": "My Friends"
        },
        "contactGroup": {
            "title": "My Group"
        },
        "contactList": {
            "contactOrg": "Organization Structure",
            "myDept": "My Organization",
            "contactStar": "Star Contacts",
            "newFriend": "New Friends",
            "contactFriend": "My Friends",
            "contactGroup": "My Group"
        },
        "requestFriend": {
            "title": "New Friends",
            "accept": "Accept",
            "sent": "Sent",
            "expired": "Expired",
            "added": "Added"
        },
        "contactStar": {
            "title": "Star Contacts"
        },
        "user": {
            "editAvatar": "Avatar",
            "removeFriend": "Delete Friend",
            "addFriend": "Add Friends",
            "unsetStar": "Cancel Star Contact",
            "setStar": "Mark as Star Contact",
            "aliasEmpty": "Set Name",
            "removeFriendBefore": "Delete the friend while will delete all chat session！"
        },
        "userRequest": {
            "editAvatar": "Change Avatar",
            "removeFriend": "Delete Friend",
            "addFriend": "Add Friend",
            "unsetStar": "Cancel Star Contact",
            "setStar": "Mark as Star Contact",
            "aliasEmpty": "Set Name",
            "accept": "通过验证",
            "removeFriendBefore": "Delete the friend while will delete all chat session.",
            "requestInfo": "，请求加你为好友！"
        },
        "verifyFriend": {
            "title": "Verificaiton Request",
            "tip": "He(She) is not your friend, please requested friend verification fristly and then start to chat.",
            "iam": "I am "
        },
        "ack": {
            "title": "Recipient Detail",
            "unreadMember": "{{0}} unread",
            "readMember": "{{0}} read"
        },
        "atPanel": {
            "everyone": "All"
        },
        "card": {
            "selected": "",
            "empty": ""
        },
        "conversationSetting": {
            "title": "Chat Info",
            "mute": "Mute Notifications",
            "top": "Sticky on Top"
        },
        "conversation": {
            "setting": "Chat Info",
            "groupSetting": "Group Info",
            "history": "historical messages"
        },
        "forward": {
            "forwarded": "Sent"
        },
        "groupSetting": {
            "title": "Group Info",
            "groupName": "Group Name",
            "admin": "Group Owner",
            "mute": "Mute Notifications",
            "top": "Sticky on Top",
            "saveContact": "Save to Contacts",
            "member": "Group Members"
        },
        "history": {
            "title": "Message Records",
            "all": "All",
            "file": "Files",
            "empty": "No chat record"
        },
        "messageInput": {
            "emoji": "Emoji",
            "screenshot": "Screenshot",
            "sendFile": "Send File",
            "sendCard": "Contact Card"
        },
        "previewImage": {
            "title": "Send Image"
        },
        "forgetPassword": {
            "title": "Password Reset"
        },
        "stepPhone": {
            "phone": "Account",
            "phoneEmpty": "Please input mobile phone number",
            "phoneInvalid": "Please input correct mobile phone number!",
            "captchaEmpty": "Please input code",
            "captcha": "Code",
            "sendCaptcha": "Get code",
            "sentCaptcha": "Sent ({{0}})",
            "next": "Next"
        },
        "stepPassword": {
            "passwordEmpty": "Please input password",
            "confirm": "Confirm",
            "passwordInvalid": "Please enter 6-16 characters,case sensitive",
            "newPassword": "New",
            "enterNewPwd": "Confirm",
            "newPwdEmpty": "Please input again",
            "newPwdInvalid": "The two passwords are inconsistent"
        },
        "stepSuccess": {
            "title": "Password Reset successful"
        },
        "onlineStatus": {
            "online": "Online",
            "leave": "Leaving",
            "busy": "Busy",
            "offline": "Offline",
            "mobile": "Mobile phone online"
        },
        "logout": {},
        "welcome": {
            "title": "",
            "motto": "New Day , New Beauty Beginning ",
            "contact": "Contacts",
            "conversation": "Conversations",
            "setup": "Settings"
        },
        "groupCreate": {
            "groupName": "Group Name",
            "tip": "（Not mandatory）",
            "createSuccess": "Create successful",
            "addMemberSuccess": "Add successful",
            "groupNameErr": "Group name should be more than 2 characters"
        },
        "groupRemovemembers": {
            "selectDelTip": "Select contacts you want to delete",
            "delMemberSuccess": "Delete successful",
            "selectNone": "Select one member at least"
        },
        "fileMessage": {
            "openFile": "Open File",
            "openFolder": "Open Folder",
            "downloadFile": "Download",
            "cancelled": "Cancelled",
            "cancel": "Cancel",
            "cancelState": "Cancelled"
        },
        "cardMessage": {
            "businessCard": "Contact Card"
        },
        "unknownMessage": {
            "notSupport": "The current version doesn't support for the message"
        },
        "setting": {
            "title": "Settings",
            "account": "Account",
            "password": "Password",
            "system": "System"
        },
        "settingAccount": {
            "mobile": "Phone Number：",
            "quitTitle": "Log Out",
            "quitMessage": "Exit the current account?"
        },
        "settingSystem": {
            "sysMsgNotify": "System Message Notifications Sound",
            "versionInfo": " Version Information",
            "checkUpdate": "Check Update",
            "language": "Language"
        },
        "settingPassword": {
            "oldPwd": "Original : ",
            "newPwd": "New : ",
            "confirmPwd": "Confirm : ",
            "tipOldPwd": "Please input original password",
            "tipNewPwd": "Please input password",
            "tipPwdLen": "Please enter 6-16 characters",
            "tipConfirmPwd": "Please input again",
            "tipMatchPwd": "The two passwords are inconsistent",
            "errorCode": {
                "10101": "Password error!"
            }
        },
        "editAvatar": {
            "selectPic": "Select Image",
            "getAvatarTokenErr": "Failed to get token"
        },
        "status": {
            "netErr": "Network unavailable, please check your network settings"
        },
        "newPin": {
            "contact": "Star",
            "addressList": "Organization",
            "friend": "My Friends",
            "selectedContact": "已选择联系人",
            "content": "content",
            "attaCount": "{{0}}个附件",
            "addAtta": "添加附件",
            "sendTime": "发送时间",
            "immediatelySend": "立即发送",
            "specificSend": "在指定时间发送",
            "sendType": "发送方式",
            "uploading": "文件正在上传中",
            "pastTime": "不能选择过去的时间",
            "sms": "短信",
            "app": "应用内",
            "mostReceive": "最多只能选择100个接收人",
            "mostAtta": "最多只能添加十个附件",
            "success": "发送成功"
        },
        "addAttachment": {
            "title": "添加附件",
            "add": "添加附件"
        },
        "addReceiver": {
            "selectedContact": "已选择联系人({{0}})",
            "selectedPrompt": "请选择需要添加的联系人"
        },
        "receivedPin": {
            "title": "我收到的 PIN",
            "confirmed": "已确认",
            "unConfirmed": "未确认",
            "reply": "回复({{0}})",
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
            "inputCanNotEmpty": "输入内容不能为空",
            "allConfirmed": "全部确认"
        }
    },
    "errorCode": {
        'kicked-offline-by-otherclient': 'kicked offline by other client',
        'unknown-error': 'Unknown error',

        'old-password-error': 'Password error!',
        'password-changed': 'Password changed, please login again!',

        'message-recall-timeout': 'Recall failed , sent message more than 3 minutes！',

        'network-error': 'Network error',

        'invalid-config': 'Failed to get appkey or server from config.js',
        'invalid-token': 'Invalid token',
        'require-captcha': 'Please get code firstly',

        'card-limit': 'Exceed limits, cannot select',

        'forward-limit': 'Forward maximum limit % d chats',

        'download-404': 'No file, please download again',
        'download-interrupted': 'Download interrupted',
        'download-cancelled': 'Download cancelled',

        'status-1': 'Connecting...',
        'status-2': 'Connection disconnected',
        'status-3': 'Network unavailable',
        'status-4': 'Connection closed',
        'status-6': 'The account logged on other devices',
        'status-12': 'The domain name is incorrect',

        'contact-1': 'Select one member at least',
        'contact-2': 'Create successful',
        'contact-3': 'Delete successful',
        'contact-4': 'Add successful',
        'contact-5': 'Quit successful',
        'contact-6': 'Disband successful',

        'lib--1': 'Request Timeout',
        'lib--2': 'Unknown error',
        'lib-7': 'Network unavailable',
        'lib-22406': 'You are not in this group',

        '10001': 'Insufficient permissions',
        '10002': 'Non-support',
        '10004': 'Unrealized function',
        '10005': 'Server unusual',
        '10006': 'Invalid request parameters',

        '10100': 'The current operation user does not exist',
        '10101': 'Account or password incorrect !',
        '10102': 'User no logged in',
        '10103': 'Incorrect password format',
        '10104': 'Nickname cannot be empty',
        '10105': 'Nickname exceeds maximum length',
        '10106': 'Avatar URL cannot be empty',
        '10107': 'Avatar URL exceeds maximum length',
        '10108': 'User no logged in',
        '10109': 'User name is empty',
        '10110': 'Password is empty',
        '10111': 'Account disabled',
        '10112': 'Get Token failed',
        '10113': 'User ID cannot be empty',
        '10114': 'Password cannot be empty',
        '10115': 'Invalid mobile number',
        '10116': 'Send code too fast',
        '10117': 'Verification code has expired',
        '10118': 'Please send code firstly',
        '10119': 'Please verify code firstly',
        '10120': 'Verification code error',
        '10121': 'User already exist',
        '10122': 'Logon token timeout',
        '10123': 'Login token invalid',
        '10126': 'Original password error',

        '10200': 'Requested department does not exist',
        '10201': 'Department name cannot be empty',
        '10202': 'Invalid department ID',
        '10203': 'No found superior department',
        '10204': 'Creator ID is illegal',
        '10205': 'No found creator ID',
        '10206': 'Invalid ManagerID',
        '10207': 'No found Manager',
        '10208': 'Invalid department member ID',
        '10209': 'Department member is empty',
        '102010': 'Existed department ID',

        // '10400': 'Sort Types not supported',
        // can not add yourself
        '10400': 'you cannot add yourself as friend',
        // request not exist
        '10401': 'Target contact does not exist',
        // friend not found
        '10402': 'Friend does not exist',
        // request is timeout
        '10403': 'Request timeout',
        // friendship is created
        '10404': 'Friendship is created',

        '10500': 'Unknown employee',
        '10501': 'Employee name cannot be empty',
        '10502': 'Employee name already exist',
        '10503': 'Employee mailbox cannot be empty',
        '10504': 'Employee mailbox already exists',
        '10505': 'Invalid employee ID',
        '10506': 'Employee ID already exists',
        '10507': 'Administrator does not exist',
        '10508': 'Please input mobile number',
        '10509': 'Mobile number already exists',

        '10600': 'Requested group does not exist',
        '10601': 'Group name cannot be empty',
        '10602': 'Group name length exceeds limit',
        '10603': 'Member number exceeds the limit',
        '10604': 'Group number which user created exceeds the limit',
        '10605': 'Requested group member does not exist',
        '10606': 'Group member already exist',
        '10607': 'Invalid group ID',
        '10608': 'Invalid group member ID',
        '10609': 'No found corresponding department',
        '10610': 'Invalid corresponding department ID',
        '10611': 'Lack of group type',
        '10612': 'Group ID already exists',
        '10613': 'Official group already exists',
        '10614': 'Company does not exist',
        '10615': 'Invalid company ID',

        '10700': 'No found company',
        '10701': 'Invalid company ID',
        '10702': 'Company ID already exists',
        '10703': 'Empty company name',
        '10704': 'Empty company full name',
        '10705': 'Empty group name',
        '10706': 'Official group exists',
        '10707': 'No official group',

        '10800': 'Invalid collection group ID',
        '10801': 'No found corresponding group',
        '10802': 'Collection group does not exist',

        '10900': 'No found corresponding contact',
        '10901': 'Collection contact does not exist',

        '11000': 'No found scope',
        '11001': 'No found name',

        '12000': 'Invalid topic',

        '13000': 'No found position information'
    }
};

})(RongIM);
