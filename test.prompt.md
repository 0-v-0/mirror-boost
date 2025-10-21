写一个启动慢资源服务器的脚本slowServer.js，默认延迟2000ms，放在test目录
---
添加一个测试页面，引用`http://localhost:7888/not-exists.js`，带有`integrity="sha256-Dw1XyODgJ9BsZZHV8/XIpkI3Bl+hcUxKsd8/JPh7zeU="`，测试原资源加载失败时的行为
---