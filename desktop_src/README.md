# sealtalk-desktop

## Support OS

We do support Windows, Mac OS X

## Supported Languages

+ 简体中文
+ ... keep adding :)

## Setup Environment

Because we use npm to maintain our third party libraries, you have to make sure before doing anything, these needed stuffs are all installed already.

```
  npm install
  npm start
```
- 特别说明

  a. 运行前务必认真读取 [PC端打包配置说明](http://web.hitalk.im/docs/web/#desktop-build.md)

  b. 运行前务必将 config.js 中配置参数修改,REPORT_URL: crash report 地址, APP_HOST: 网站地址

  c. Windows 下制作安装包前请修改安装包项目文件中的参数(desktop_setup.iss).项目文件中除了修改必要的参数,还需要修改 AppId(方法: 菜单中 Tools/Generate GUID).

  d.  mac 打包后文件(*.app)内如果有任何文件改动,需重新签名,签名方法: npm run codesign;否则 .app 文件下载后会提示 “.app”已损坏，打不开。 您应该将它移到废纸篓。"

- 打包

    OS X

    ```
    gulp build -p mac
    ```
    Windows

    ```
    gulp build -p win32
    ```

- 制作安装包:

    OS X

    ```
    npm run installer:mac
    ```
    Windows

    ```
     打开项目文件 desktop_setup.iss, 选择菜单 Build/Compile
    ```
