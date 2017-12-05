var im_config = {
    //############ 以下为必改项 ##############
    //http://electron.atom.io/docs/api/crash-reporter/
    REPORT_URL: 'http://report.sealtalk.im',
    //测试环境   
    APP_HOST: 'http:localhost:8090/',
    APP_INDEX: 'desktop.html',
    //############  以上为必改项  ##############
    APP_ID: 'appId',
    HOME: 'home',
    PROTOCAL: 'protocal',
    WINICON: 'app.ico',
    ALWAYS_SHOW_IN_PRIMARY: false,
    ABOUT: 'http://www.rongcloud.cn/product/rce/?click-banner-pc',
    WIN: {
        //  WINDOWS ONLY,TRAY BLINK ON
        //  new Tray,tray.setImage    
        TRAY: 'Windows_icon.png',
        //  WINDOWS ONLY,TRAY BLINK OFF
        //  tray.setImage
        TRAY_OFF: 'Windows_Remind_icon.png',
        //  tray.displayBalloon
        BALLOON_ICON: 'app.png'
    },
    MAC: {
        //HELPER_BUNDLE_ID: 'SealTalk_Ent_Test',
        //  new Tray
        TRAY: 'Mac_Template.png',
        //  tray.setPressedImage
        PRESSEDIMAGE: 'Mac_TemplateWhite.png'
    },
    PACKAGE: {
        //以下参数设置需对照 配置说明 中 4 项列出的工具参数理解
        PRODUCTNAME: 'productName',
        APPNAME: 'appName',
        VERSION: '1.0.0',
        DESCRIPTION: 'description',
        AUTHOR: 'author',
        RUNTIMEVERSION: '1.4.15',
        COPYRIGHT: "",
        WIN: {
            APPICON: 'app.ico',
            ICON_URL: 'http://7i7gc6.com1.z0.glb.clouddn.com/image/sealtalk.ico',
            LOADING_GIF: './res/loading.gif'
        },
        MAC: {
            APPICON: 'app.icns',
            BACKGROUND: 'bg.png'
            //CF_BUNDLE_VERSION: '1.0.3'
        },
        LINUX: {
            APPICON: 'app.png'
        }
    },
    VOIP: {
        INDEX: '/modules/voip/voip.html', //暂时未用
        MINWIDTH: 100,
        MINHEIGHT: 100,
        BOUNDS: {
            X: 0,
            Y: 0,
            WIDTH: 338,
            HEIGHT: 260
        }
    },
    DEBUG: true,
    DEBUGOPTION: {
        VUEPATH: '/Users/zy/Library/Application Support/Google/Chrome/Default/Extensions/nhdogjmejiglipccpnnnanhbledajbpd/3.1.6_0'
    }
};
module.exports = im_config;