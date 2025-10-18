根据需求文档，编写`资源替换流程.md`
---
在test目录创建一个最小示例页面，包含在localhost上模拟的remedy.min.css的慢链接，预期替换后结果：
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/cssremedy@0.1.0-beta.2/css/remedy.min.css" integrity="sha256-Dw1XyODgJ9BsZZHV8/XIpkI3Bl+hcUxKsd8/JPh7zeU=" crossorigin="anonymous">
```
---
根据任务文档，使用README.md中的技术栈实现一个MVP，将ts代码放在src目录下，现有的ResourceOverride目录中的代码过于古老，仅供参考