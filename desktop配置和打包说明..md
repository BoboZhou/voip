## desktop 打包配置说明
　　<font color="red">PC 端支持的平台</font>          
　　**OS X**        
　　　　对于 OS X 系统仅有64位的二进制文档，支持的最低版本是 OS X 10.8。

　　**Windows**        
　　　　仅支持 Windows 7 及其以后的版本，之前的版本中是不能工作的。        
　　　　对于 Windows 提供 x86 和 amd64 (x64) 版本的二进制文件。需要注意的是ARM 版本的 Windows 目前尚不支持.

1. 安装 nodejs5.3.0，Windows必须使用32位版本

2. 源码: 压缩文件源码

3. 项目根目录下执行 npm install

4. 修改配置文件（源码中的config.js），以下两项为必填项，更多配置参考config.js中注释：
    *  HOMEPAGE       WebIM 登录页地址域名
    *  REPORT_URL     错误上报页面   
    修改配置后,运行  npm start  开发调试

5. 打包(可参考 README.md)
    * Window: 
   1.   执行 `npm run package:win`
   2.   打开 [inno setup](http://www.jrsoftware.org/isinfo.php) 项目文件，编译制作安装包. 项目目录下有 inno setup 的示例项目文件 desktop_setup.iss 供参考,需修改的主要参数如下
        -  `BaseDir` 做安装包的源文件目录(执行命令 npm run package:win 结果输出目录)
        -  `AppId` 第一次用需要新生成。生成方法： 菜单 Tools/Generate GUID
   3.   安装协议变更：更新项目根目录下 LICENSE 文件内容
    * Mac: 
   1.   确保安装开发者证书(Developer ID certificate)，在 script/codesign.bash 中正确配置签名参数(具体参照 [https://pracucci.com/atom-electron-signing-mac-app.html](https://pracucci.com/atom-electron-signing-mac-app.html))
   2.   执行 `npm run package:mac`
   3.   执行  `npm run installer:mac`


### 重要概念
1. 打包程序依赖的工具
    -    electron-builder    https://github.com/electron-userland/electron-builder/tree/v2.9.3
    -    electron-packager   https://github.com/electron-userland/electron-packager
    -    electron-winstaller https://www.npmjs.com/package/electron-winstaller
    -    gulp                https://www.npmjs.com/package/gulp

2. 签名
    -    Mac app 需要签名(sign your app)，可以参考 https://pracucci.com/atom-electron-signing-mac-app.html
3. 打包命令
    -    package.json
    -    gulpfile.js
