## 项目简介
Mirror Boost是一个能自动统计并优化页面中SRI资源加载时间的浏览器扩展。仓库使用 TypeScript、Vite 进行构建。

根目录重要项说明：
- `css/`：样式文件
- `public/`：静态资源与 `manifest.json`
- `src/`：业务代码
- `test/`：测试

## 开发环境
- 包管理器：pnpm
- Node 版本：与 pnpm 相兼容的 LTS

## 常用命令
```sh
pnpm dev       # 启动 vite 开发服务器（用于调试扩展页面 / popup 等）
pnpm build     # 打包
pnpm lint      # 代码检查
pnpm typecheck # 类型检查
pnpm test      # 运行测试
```

在提交前务必执行类型检查、lint 与测试：

```sh
pnpm typecheck && pnpm lint && pnpm test
```

## 开发环境与调试
- 推荐 Node 版本：与 pnpm 10 相兼容的 LTS（例如 22/24）。
- 编辑器建议：VS Code + 插件列表（EditorConfig、Oxc、TypeScript）。
- 格式化与 lint：遵循仓库的 `.editorconfig` 与 ESLint 配置。

调试建议：
- 在浏览器扩展中开启开发者模式，将 `dist` 目录作为已解压的扩展加载。
- 如果使用 Vite 的热更新（HMR），请在 `pnpm dev` 运行期间打开扩展页面并指向本地开发服务器。

## 代码规范
- 文件命名：页面/目录使用 kebab-case（例如 `popup.html`, `content-script/`），TypeScript 文件使用小驼峰。
- TypeScript：开启严格模式，所有公共导出应添加注释说明其用途。
- 风格：参照 `.editorconfig` 配置。
