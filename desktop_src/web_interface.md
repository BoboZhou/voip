1. updateBadgeNumber
web --> pc,web 同步未读信息给 pc

2. 截屏
web <--> pc

3. Notification click

4. 被踢

5. 退出
pc --> web [pc 端异常时通知 web 断开链接]

6. dock 闪烁 [mac]  
web --> pc
7. 窗口抖动 [win]
web --> pc

8. 搜索好友 [需知道 web 获取搜索焦点的代码]

9. 下载 
pc --> web
chDownloadProgress(url, state, progress) 参数说明:下载链接,下载状态[progressing, interrupted], 进度
chDownloadState(url, state) 参数说明:下载链接,下载状态[completed, cancelled, interrupted]

10. openFile
web --> pc

11. openFileDir
web --> pc

12. getImgByPath 获取拷贝到剪切板里的图片
web --> pc

13. uploadFile
web --> pc  获取拷贝到剪切板里的文件