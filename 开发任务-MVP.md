# 开发任务 — MVP（最小可行产品）

目标：以最小可行功能快速实现资源替换的核心能力，验证流程可工作并满足关键验收条件（统计、阈值判断、基于integrity的安全替换与回退）。

## 1. MVP 范围（必须实现）

- 资源监控：采集页面中带 `integrity` 的静态资源（`script`、`link[rel=stylesheet]`、`img`/图标）的加载时间，使用 Resource Timing API 或 load 事件获取时间戳。
- 统计聚合：按 URL 匹配规则（初期可只实现按 host 聚合）进行样本计数与平均加载时间计算，支持最小样本数配置（默认3）。
- 阈值判断：支持配置阈值（默认300ms），当聚合 avgMs >= 阈值且样本数足够时触发替换判断。
- 安全替换：仅对带 `integrity` 的资源尝试替换；替换通过创建替代元素（保留原 integrity 属性）并监听 load/error 确认成功或失败。失败时回退到原资源。
- 简易候选来源：支持一个用户配置的镜像列表（JSON），以及基于 integrity 映射表的候选优先选择（如果存在）。
- 存储：使用现有 `keyvalDB.js` 或简单的 `chrome.storage.local` 实现短期持久化（stats 和 integrity_map），并实现写入节流（例如 30s 批量写入）。
- 日志：仅记录替换失败的简要信息（默认关闭，可通过配置打开）。

## 2. 验收标准（MVP）

1. 在测试页面上，扩展能收集到至少 3 次相同资源的加载时间并计算 avgMs。
2. 当 avgMs >= 300ms（默认）且样本数 >=3 且资源带 `integrity` 时，扩展会尝试用候选镜像替换资源，并在成功加载时移除原元素。
3. 如果替换后加载失败或 SRI 校验失败，扩展会回退到原资源并记录一次失败事件（若开启日志）。
4. stats 和 integrity_map 能被写入本地存储并在配置的节流窗口后持久化。

## 3. 优先级任务清单（迭代顺序）

优先级高 -> 先实现核心流程，低风险回退。给出建议实现顺序与估时（粗略）：

1. 资源发现与采样（1-2 天）
   - 监听 DOM 初始资源与 mutation（script/link/img）。
   - 用 Resource Timing 或 load 事件采集单次加载时延并缓存到内存队列。

2. 统计聚合与节流写入（1 天）
   - 按 host 聚合样本计数与 avgMs（可扩展到 rule 聚合）。
   - 实现内存缓冲+30s 节流批量写入到 `keyvalDB` 或 `chrome.storage.local`。

3. 候选与 integrity 映射表（1 天）
   - 简化实现：在内存维护 `integrity_map`，并周期性持久化。支持从配置加载一个小镜像列表。

4. 替换执行与回退（1-2 天）
   - 创建替代元素插入 DOM，监听 load/error，成功则移除原元素，失败则回退。
   - 确保替换异步且不会阻塞页面主流程。

5. 简易配置 UI（options 页面最小化）（1 天）
   - 提供阈值、最小样本数、镜像列表（JSON）的编辑与保存。

6. 基本日志（可选开关）（半天）

总计：约 5-8 天（单人开发、含小范围测试）。

## 4. 需要创建或修改的文件列表（MVP）

- 新增/修改（优先按顺序）：
  - `inject/` 下注入脚本（新增或扩展现有注入脚本） — 资源发现、替换执行逻辑。
  - `keyvalDB.js` / `mainStorage.js` — 使用已存在的封装实现持久化；若缺失则轻量实现持久化层。
  - `options.js`（或扩展）— 最小配置界面（阈值、minSampleCount、镜像列表）。
  - `test/` — 新增用于验证替换流程的最小测试页面与脚本（静态 HTML 提供两个不同 host 的相同资源）。

## 5. 简化的数据模型（MVP）

- stats（按 host）： { key: `host:<host>`, samples: number, avgMs: number, firstAt: ISO, lastAt: ISO }
- integrity_map（简化）： { key: `integrity:<val>`, urls: [string], lastSeenAt: ISO }

写入节流：内存队列每 30s 或在页面卸载时写入到 storage。

## 6. 测试用例（基本）

1. 正常路径：在本地创建页面 A，资源从 host1 加载 500ms，从 host2 加载 100ms，资源带相同 integrity。重复访问直到 avgMs 统计触发替换，验证扩展选择 host2 并替换成功。
2. SRI 失败：候选返回内容不匹配 SRI，触发 error，扩展回退到原资源并记录失败。
3. 样本不足：资源仅出现1-2次，不触发替换。

## 7. 风险点与注意事项

- CSP 可能阻止替换（需在日志中捕获相关错误）。
- 动态签名 URL（带时间戳）可能导致匹配困难，建议在写入时归一化查询参数。
- IndexedDB 写入实现复杂时可先用 `chrome.storage.local` 做 MVP，后续迁移到 `keyvalDB`。

---

撰写人：
日期：2025-10-19
