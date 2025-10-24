根据需求文档，编写`资源替换流程.md`
---
在test目录创建一个最小示例页面，包含在localhost上模拟的remedy.min.css的慢链接，预期替换后结果：
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/cssremedy@0.1.0-beta.2/css/remedy.min.css" integrity="sha256-Dw1XyODgJ9BsZZHV8/XIpkI3Bl+hcUxKsd8/JPh7zeU=" crossorigin="anonymous">
```
---
根据任务文档，使用README.md中的技术栈实现一个MVP，将ts代码放在src目录下，现有的ResourceOverride目录中的代码过于古老，仅供参考
---
安装npm包`@types/chrome`，避免ts文件中出现`(globalThis as any).chrome`类似写法
---
根据任务文档，使用README.md中的技术栈，创建配置页面`src/options.html`，支持配置阈值、最小样本数、镜像列表
---
目录结构已经变化，根据当前工作区更新任务文档中的文件名
---
将Aggregator中的统计信息改为使用IndexedDB存储，遵循docs中文档中的存储格式，aggregator.ts不应直接导入idb模块，数据库操作应封装在storage.ts
---
给types.ts中所有导出的类型添加文档注释
---
实现clearExpired函数，清除过期的统计数据
---
根据需求文档，添加popup.html，显示当前页面每个类型的资源的平均加载时间
---
修改background.ts，确保新添加的规则不会被已有规则再次重定向