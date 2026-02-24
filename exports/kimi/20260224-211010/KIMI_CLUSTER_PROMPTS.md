# Ready 项目 - Kimi 云端离线协作方案

> 场景: Kimi 云端无法直接访问你的本地目录  
> 核心策略: 本地打包上传 -> 云端解包开发 -> 云端回传补丁包 -> 本地合并验收

---

## 1. 标准开发流程（离线任务包）

1. 在本地生成 `source bundle`（不含 `node_modules/out/dist`）。
2. 准备任务说明 `TASK_BRIEF.md`（从模板复制并填写）。
3. 上传 `source bundle + TASK_BRIEF.md` 到 Kimi。
4. Kimi 在云端解包并执行开发。
5. Kimi 回传 `PATCH.diff + CHANGE_REPORT.md + COMMAND_LOG.md`。
6. 本地应用补丁并执行验收命令。
7. 验收失败时，把失败日志作为下一轮输入继续迭代。

---

## 2. 上传包目录规范

建议每次上传一个任务包目录，结构如下：

```text
kimi-task-pack/
  ready-src-<timestamp>.zip
  TASK_BRIEF.md
  OUTPUT_CONTRACT.md
```

说明：
- `ready-src-<timestamp>.zip`: 项目源码快照。
- `TASK_BRIEF.md`: 本轮任务边界、验收标准、禁改列表。
- `OUTPUT_CONTRACT.md`: 约束 Kimi 回传格式，便于本地自动合并。

---

## 3. 给 Kimi 的主提示词（总控入口）

将下面内容作为 Kimi 会话第一条消息（可直接复制）：

```text
你将收到一个 Ready 项目的源码压缩包和任务说明文件。你无法访问我的本地机器，必须仅基于上传内容工作。

请严格执行以下流程：
1) 解压源码到当前工作目录。
2) 阅读 TASK_BRIEF.md 和 OUTPUT_CONTRACT.md。
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

## 4. 给 Kimi 子 Agent 的分工提示词

### 4.1 Agent A（主进程与 Agent 桥）

```text
你负责主进程 Agent 桥接稳定性。

目标：
1) 真实 Claude 链路与 fallback 明确分流。
2) 统一 IPC 返回结构：{ success, data?, error?, mock? }。
3) 子进程异常、超时、退出码可诊断。

只改与任务相关文件，输出 PATCH.diff + CHANGE_REPORT.md + COMMAND_LOG.md。
```

### 4.2 Agent B（Document 引擎）

```text
你负责 Document 引擎从 mock 到最小可用实现。

目标：
1) docx/xlsx 至少具备真实读取能力。
2) 错误信息可直接传递到渲染层。
3) 变更最小化，不触碰 UI 风格。

若需要新增依赖，必须在 CHANGE_REPORT.md 说明体积与必要性。
```

### 4.3 Agent C（RSS/Calendar）

```text
你负责 RSS 与 Calendar 的 mock 边界清理。

目标：
1) mock/real 逻辑切换一致。
2) 去除死代码和不可达分支。
3) 返回结构统一，便于前端判断数据来源。
```

### 4.4 Agent D（测试与质量闸门）

```text
你负责补最小测试与验证脚本。

目标：
1) 增加轻量测试框架或最小单测。
2) 给出 verify 命令（typecheck + lint + test）。
3) 避免引入重型依赖和复杂基础设施。
```

---

## 5. OUTPUT_CONTRACT.md 模板

你可以把下列内容保存成 `OUTPUT_CONTRACT.md` 一起上传：

```text
# OUTPUT CONTRACT

## 必交付文件
- PATCH.diff
- CHANGE_REPORT.md
- COMMAND_LOG.md

## PATCH 规则
- 必须是 unified diff
- 必须可通过 git apply
- 不包含二进制内容

## CHANGE_REPORT 规则
- 列出修改文件清单
- 列出新增依赖与原因
- 列出风险点与回滚方式

## COMMAND_LOG 规则
- 记录执行命令
- 记录关键报错与最终通过结果
```

---

## 6. 本地合并与验收流程

当 Kimi 回传结果后，在本地执行：

```bash
cd /path/to/ready
git apply PATCH.diff
# 如果当前目录不是 git 仓库，可改用:
# patch -p1 < PATCH.diff
npm install
npm run typecheck
npm run lint
npm run build
```

如果 `git apply` 失败：
1. 先把冲突文件与错误信息发回 Kimi。
2. 要求 Kimi 基于失败日志重发补丁。
3. 不要手工大面积改动，避免引入新偏差。

---

## 7. 推荐合并顺序

1. Agent A（主进程与 Agent 桥）
2. Agent B（Document）
3. Agent C（RSS/Calendar）
4. Agent D（测试闸门）

原因：先打通核心功能链路，再落质量门槛。

---

## 8. 集群并行开发规则（避免冲突）

对于 Kimi 集群并行任务，建议同一轮使用同一个 `ready-src-*.zip` 快照，但每个子任务严格限制文件边界。

推荐分区：

1. A 组仅改 `src/main/modules/claude-bridge/**` 与相关 `preload/store`。
2. B 组仅改 `src/main/modules/document-engine/**` 与必要依赖。
3. C 组仅改 `src/main/modules/rss-engine/**`、`calendar-engine/**` 与对应页面。
4. D 组仅改测试与脚本，不碰 A/B/C 业务实现文件。

回收合并方式：

1. 先收 A/B/C 的补丁，各自本地验收。
2. 若 A/B/C 补丁彼此冲突，先按功能优先级人工择一，再让 Kimi 产出冲突修复补丁。
3. 最后再收 D 的测试补丁，避免测试基线反复变动。
