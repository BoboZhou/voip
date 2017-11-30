
## IM 开发引导  
- [基本说明](#Workflow)
- [开发须知](#NoticeBeforeDevelope)
- [申请 App Key](#ApplyAppKey)
- [Server安装说明](#Server)
- [IM配置说明](#IM)
- [PC端打包配置](#PC)


1. <span id="Workflow">基本说明</span>
    <br>RongCloud：融云提供的云服务，开发指南 [http://www.rongcloud.cn/docs/server.html](http://www.rongcloud.cn/docs/server.html)
    <br>Server：应用服务器，访问域名为server.domain，[API文档](./server-api.md)
    <br>IM：包括Web端与PC端的IM产品，访问域名为：web.domain，开发指南 [http://www.rongcloud.cn/docs/web.html](http://www.rongcloud.cn/docs/web.html)

    ![Alt text](assets/images/5.png "流程导图") 
    <font color="red" size="2">注：理解Token：[http://www.rongcloud.cn/docs/server.html#获取_Token_方法](http://www.rongcloud.cn/docs/server.html#获取_Token_方法)</font>

2. <span id="NoticeBeforeDevelope">开发须知</span>
  1. IM 开发引导访问网址 [http://web.hitalk.im/docs/web/index.html](http://web.hitalk.im/docs/web/index.html)
  2. IM使用nodejs，要求4.0以上版本；
  3. Server使用nodejs，要求4.0以上版本；
  4. 桌面打包固定要求5.3.0
  5. npm 全局安装命令(npm install -g)在 Mac 上可能需要管理员权限，如有必要，使用 `sudo npm`
  6. 融云提供的文档，[融云知识库](http://support.rongcloud.cn) [开发文档](http://www.rongcloud.cn/docs/)

3. <span id="ApplyAppKey">申请 App Key</span>引导:
  - 申请开发环境 App Key
      1. 访问融云官网 [http://www.rongcloud.cn](http://www.rongcloud.cn/)，注册开发者帐号
      2. 登录并创建应用
      3. 进入应用，点击左侧"App Key"
  - <span id="ApplyProductAppKey">申请生产环境 App Key</span>
      1. 访问融云开发者后台：[https://developer.rongcloud.cn](https://developer.rongcloud.cn)，申请上线
      2. 申请通过后会生成生产环境的 App Key 和 App Secret
   
4. <span id="Server">Server安装说明</span>
	<br>接口文档： [server-api.md](./server-api.md)
	<br>安装说明： [server-install.md](./#server-install.md)

5. <span id="IM">IM配置说明</span>
	<br>参考 [im.md](./#im.md)
           
6. <span id="PC">PC端打包配置说明</span>
   <br>参考 [desktop-build.md](./#desktop-build.md)

