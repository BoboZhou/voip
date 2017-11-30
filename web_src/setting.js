var config = {
    locale: 'zh',  //only support zh,en
    /* appkey: 'tdrvipkst7v85',    //appkey
     server: 'http://api.rce.rongcloud.net',  //应用服务器接口域地址*/
    appkey: 'pwe86ga5pwrj6',
    // server: 'http://test.api.rce.rongcloud.net:8080/rce/api'
    server: 'https://et-rce-test-guanyu.rongcloud.net/api',
    sdk: {
        navi : '120.92.118.233:8082',
        api: '120.92.118.233:8081'
        // protobuf: 'lib/protobuf-2.1.5.min.js', //私有部署开启此配置，无需改值
        // navi : '',  //导航地址,私有云格式 '120.92.10.214:80'
        // api: ''  //获取是否有未读消息,私有云格式 '172.20.210.38:81'
    },
    emoji : {
        // imageUri : "modules/emoji/emoji-48.png"  //私有部署开启此配置，无需改值
    },
    voice : {
        // swfobject: "lib/swfobject-2.0.0.min.js",  //私有部署开启此配置，无需改值
        // player: "lib/player-2.0.2.swf"  //私有部署开启此配置，无需改值
    },
    upload: {
        type : "qiniu",   //七牛或私有云自带文件服务器,私有云  RongCloud
        file:{
            // fileSize:  100 * 1024 * 1024,  // 文件上限,私有云需要设置,默认最大100M
            imageSize: 5 * 1024 * 1024,  // 图片上限，到达上限后且小于文件上限转文件发送
            domain: 'http://upload.qiniu.com'   // 图片、文件 上传地址,私有云格式 'http://120.92.10.214:8080'
        },
        base64: {
            size: 5 * 1024 * 1024,   // base64大小, 私有云服务器需设置,默认5M
            domain: 'http://upload.qiniu.com/putb64/-1' // 上传 base64 图片资源,私有云格式 'http://120.92.10.214:8080/base64.php'
        }
    },
    bqmm : true, // 自定义表情需要从公网加载,如果不能访问公网,需设置 false
    recallMessageTimeout: 3,    // 消息撤回设置，单位分钟
    product: {
        name: {
            "zh": "融云企业版",
            "en": "RCE"
        },
        // icon: "//f2e.cn.ronghub.com/desktop-client-qa/css/images/logo.png",   // 应用图标，可使用网络地址，建议大小 32 x 32
        version: '1.0.13'
    }
};