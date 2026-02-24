# Kimi 云端任务简报 — Sprint B 批次

> **日期**: 2026-02-25
> **项目 GitHub**: https://github.com/ALBEDO-TABAI/ready-export-public-20260224
> **分支**: main
> **约束**: 遵循 OUTPUT_CONTRACT.md，每人只改指定文件

---

## 总控提示词（发给 Kimi 会话第一条）

```text
你将基于 GitHub 仓库 https://github.com/ALBEDO-TABAI/ready-export-public-20260224 代码进行修改。
请先 clone 该仓库，然后按照下面的 TASK_BRIEF 执行。

严格执行以下流程：
1) clone 仓库到当前工作目录。
2) 阅读 TASK_BRIEF 内容。
3) 仅在允许修改的文件范围内改动。
4) 先给出执行计划，再实施改动。
5) 最终输出必须包含：
   - PATCH.diff（统一 diff 格式，git apply 可用）
   - CHANGE_REPORT.md（改动摘要、风险、回滚点）
   - COMMAND_LOG.md（你执行过的命令与关键输出）

质量门槛：
- 不允许只给伪代码，必须给可合并补丁。
- 不允许修改任务外文件。
- 不允许引入大规模重构。
- 必须给最小可验证的验收步骤。
```

---

## 任务 1：RSS 前端适配统一响应结构

**分配给**: Kimi Agent 1
**优先级**: P1
**预计工作量**: 2-3 小时

### 背景
后端 RSS 引擎的 IPC 响应结构已从不一致的格式统一为 `{ success, mock, data }` 结构。
前端 `RSSMode.tsx` 需要同步适配这个变化。

### 允许修改的文件
- `src/renderer/pages/modes/RSSMode.tsx`

### 具体任务
1. 将所有 `result.sources` 改为 `result.data`
2. 将所有 `result.items` 改为 `result.data`
3. 将所有 `result.id` 改为 `result.data.id`
4. 添加 `result.mock` 判断，在 mock 模式下显示一个小提示 badge
5. 错误状态（`result.success === false`）时显示友好的错误提示 UI

### 验收标准
- `npm run typecheck` 通过
- RSS 页面渲染不报错
- Mock 数据正常显示
- 错误时显示错误提示而非空白页

### 参考
当前后端返回结构：
```typescript
// 成功
{ success: true, mock: boolean, data: T }
// 失败
{ success: false, mock: false, error: string }
```

---

## 任务 2：Calendar 前端适配统一响应结构

**分配给**: Kimi Agent 2
**优先级**: P1
**预计工作量**: 2-3 小时

### 背景
同任务 1，Calendar 引擎也已统一为 `{ success, mock, data }` 结构。

### 允许修改的文件
- `src/renderer/pages/modes/CalendarMode.tsx`

### 具体任务
1. 将所有 `result.sources` 改为 `result.data`
2. 将所有 `result.events` 改为 `result.data`
3. 将所有 `result.id` 改为 `result.data.id`
4. 添加 `result.mock` 判断
5. 日程模式交互完善：
   - 今日高亮准确显示
   - 当前时间线正确定位
   - 事件块样式美化

### 验收标准
- `npm run typecheck` 通过
- Calendar 页面渲染不报错
- 周视图中今天有高亮
- 当前时间线可见

---

## 任务 3：VideoMode 时间轴稳定性修复

**分配给**: Kimi Agent 3
**优先级**: P2
**预计工作量**: 3-4 小时

### 允许修改的文件
- `src/renderer/pages/modes/VideoMode.tsx`

### 具体任务
1. 审查时间轴操作逻辑（分割/复制/删除）
2. 修复分割操作可能破坏轨道数据的问题
3. 修复删除片段后时间轴不自动更新的问题
4. 确保复制操作生成唯一 ID
5. 播放控制：播放/暂停/跳转操作的边界处理

### 验收标准
- `npm run typecheck` 通过
- 时间轴上的分割操作不会导致轨道数据损坏
- 删除片段后时间轴自动重排
- 复制片段有唯一 ID

---

## 任务 4：ImageMode 图层管理 UI

**分配给**: Kimi Agent 4
**优先级**: P2
**预计工作量**: 3-4 小时

### 允许修改的文件
- `src/renderer/pages/modes/ImageMode.tsx`

### 具体任务
1. 实现图层列表面板（右侧属性面板下方）
2. 图层项展示：缩略图 + 名称 + 可见性切换 + 锁定
3. 拖拽排序图层顺序
4. 选中图层高亮同步到画布
5. 右键菜单：复制图层/删除图层/合并图层

### 验收标准
- `npm run typecheck` 通过
- 图层列表可见
- 点击图层可选中（高亮）
- 可见性眼睛图标可以切换

---

## 合并顺序

```
1. 任务 1（RSS）和 任务 2（Calendar）可并行
2. 任务 3（Video）和 任务 4（Image）可并行
3. 先合入 1+2，再合入 3+4
```

## 回传格式要求

每个任务回传 3 个文件：
- `PATCH.diff` — 可 `git apply` 的补丁
- `CHANGE_REPORT.md` — 改动摘要
- `COMMAND_LOG.md` — 执行过的命令
