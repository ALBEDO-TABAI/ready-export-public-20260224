# Ready V5 - 任务分配

> 按 Agent 角色拆分任务

---

## 前端 Agent (@frontend)

### 职责
负责渲染进程的所有 UI 组件和页面。

### 当前任务
- [x] 工作台模式页面
- [x] Ready 模式页面
- [x] 设置页面
- [x] 6 种工作台模式
- [x] 布局组件 (TopBar, SidePanel, ChatPanel)
- [x] 状态管理 (Zustand)

### 待办
- [ ] 图像编辑器图层管理
- [ ] 视频编辑器时间轴优化
- [ ] 主题切换功能
- [ ] 响应式布局适配

---

## 主进程 Agent (@main)

### 职责
负责 Electron 主进程的所有模块。

### 当前任务
- [x] 窗口管理
- [x] IPC 通信
- [x] Agent 管理器
- [x] Worktree 池
- [x] 浏览器引擎
- [x] 文档引擎
- [x] RSS 引擎
- [x] 日程引擎

### 待办
- [ ] FFmpeg 集成
- [ ] 视频处理模块
- [ ] 自动更新
- [ ] 崩溃报告

---

## 数据层 Agent (@data)

### 职责
负责数据库和数据持久化。

### 当前任务
- [x] SQLite 数据库封装
- [x] RSS 数据表
- [x] 日历数据表
- [x] Agent 知识表

### 待办
- [ ] 数据迁移脚本
- [ ] 数据库索引优化
- [ ] 数据备份/恢复
- [ ] 数据加密

---

## 测试 Agent (@test)

### 职责
负责测试用例和自动化测试。

### 当前任务
- [x] TypeScript 类型检查
- [x] ESLint 配置

### 待办
- [ ] 单元测试 (Jest)
- [ ] E2E 测试 (Playwright)
- [ ] 性能测试
- [ ] 测试覆盖率报告

---

## 文档 Agent (@docs)

### 职责
负责项目文档和维护。

### 当前任务
- [x] CLAUDE.md (Agent 规范)
- [x] LOCAL_HANDOFF.md (本地事项)
- [x] DEVELOPMENT_PLAN.md (开发计划)
- [x] TASK_ASSIGNMENT.md (任务分配)

### 待办
- [ ] API 文档
- [ ] 用户手册
- [ ] 部署文档
- [ ] 更新日志

---

## 任务优先级

| 优先级 | 任务 | 负责 Agent |
|--------|------|-----------|
| P0 | npm 依赖安装 | @main |
| P0 | Agent 系统集成 | @main |
| P1 | 图像编辑器增强 | @frontend |
| P1 | 数据库完善 | @data |
| P2 | 视频编辑器 | @frontend + @main |
| P2 | RSS/日历同步 | @data |
| P2 | 测试用例 | @test |
| P3 | 文档完善 | @docs |

---

## 协作流程

1. **每日同步**: 各 Agent 汇报进度
2. **阻塞上报**: 遇到阻塞立即上报
3. **代码审查**: 关键模块需交叉审查
4. **文档同步**: 代码变更同步更新文档

---

## 联系方式

- 前端: @frontend
- 主进程: @main
- 数据层: @data
- 测试: @test
- 文档: @docs
