# 开发任务 — MVP 子任务拆分

以下将 MVP 拆分为具体小任务（可逐一实现并提交），每项包含描述、优先级与估时建议。

## 子任务列表

1. 资源发现模块（优先级：高，估时：1-2 天）
   - 功能：监听页面初始资源（script/link/img）与 DOM Mutation，收集带 `integrity` 的资源 URL、类型与元素引用。
   - 交付：`src/monitor.ts`（资源发现脚本），将采集的事件发送到扩展后台或在页面内维护内存队列。

2. 采样计时器（优先级：高，估时：0.5-1 天）
   - 功能：使用 Resource Timing API（优先）或 load 事件记录单次资源加载时间点，写入内存队列。
   - 交付：采样函数与示例数据结构。

3. 聚合与存储层（优先级：高，估时：1 天）
   - 功能：实现按 host 的样本计数与 avgMs 计算、内存缓冲和 30s 节流写入逻辑。使用 `src/storage.ts` 封装或回退到 `chrome.storage.local`。
   - 交付：`stats` 写入/读取 API。

4. integrity 映射表（优先级：中，估时：1 天）
   - 功能：维护以原始 integrity 值（例如 `sha256-...`）为 key 的映射到 urls 列表的内存与持久化实现，支持节流写入与 TTL 更新。
   - 交付：`integrity_map` API。

5. 候选管理与选择策略（优先级：高，估时：1 天）
   - 功能：从配置加载镜像列表，合并 integrity_map 中候选，按 avgMs 排序并选取前 N 随机选择；实现同host并发检查的简单计数器。
   - 交付：`selectCandidate(resource)` 函数。

6. 替换执行与回退（优先级：高，估时：1-2 天）
   - 功能：创建替代元素（script/link/img）, 插入 DOM，监听 load/error，并在成功时移除原元素，失败则回退并标记候选不可用。
   - 交付：`replaceResource(originalEl, candidateUrl)` 函数与单元测试模拟。

7. 最小配置 UI（优先级：中，估时：1 天）
   - 功能：在 `src/options.ts` 或 `options.html` 中提供阈值、minSampleCount、镜像列表编辑功能（可为简单 JSON 文本输入框）。
   - 交付：options 页面修改与保存逻辑。

8. 日志采样（优先级：低，估时：0.5 天）
   - 功能：实现错误事件的采样与限流写入（在配置开启时启用）。

9. 测试页与自动化脚本（优先级：高，估时：1-2 天）
   - 功能：在 `test/` 下添加最小示例页面（两个 host 模拟）和一个简单的自动化脚本（说明如何手动/自动验证）。
   - 交付：`test/replace-flow.html` 与 `test/README.md`。

10. 文档与 PR（优先级：中，估时：0.5 天）
    - 功能：准备 PR 描述、测试步骤、验收检查列表。

日期：2025-10-19
