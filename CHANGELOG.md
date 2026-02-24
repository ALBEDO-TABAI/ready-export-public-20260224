# Ready V5 - 更新日志

## [0.1.0] - 2026-02-24

### 新增

#### 项目结构
- 创建完整的 Electron + React + TypeScript 项目结构
- 配置 electron-vite 构建工具
- 配置 TypeScript (tsconfig.json, tsconfig.node.json, tsconfig.web.json)
- 配置 ESLint 和 Prettier

#### 主进程 (Electron Main)
- 实现窗口管理 (index.ts)
- 实现 Agent 管理器 (agent-manager.ts)
  - Agent 生命周期管理
  - 进程间通信
  - Mock 模式支持 (ENABLE_MOCK_SERVICES)
- 实现 Worktree 池 (worktree-pool.ts)
  - Git 工作区管理
  - Agent 配置复制
- 实现数据库模块 (database.ts)
  - SQLite 封装
  - 自动降级到内存数据库
- 实现 IPC 处理器
  - Agent IPC (ipc-handler.ts)
  - 浏览器引擎 IPC (browser-engine/ipc-handler.ts)
  - 文档引擎 IPC (document-engine/ipc-handler.ts)
  - RSS 引擎 IPC (rss-engine/ipc-handler.ts)
  - 日程引擎 IPC (calendar-engine/ipc-handler.ts)

#### 渲染进程 (React)
- 实现应用入口 (App.tsx, main.tsx)
- 实现状态管理 (Zustand)
  - useMode.ts - 模式状态
  - useAgent.ts - Agent 状态
  - useWorkspace.ts - 工作区状态
- 实现布局组件
  - TopBar.tsx - 顶部栏
  - ModeSlider.tsx - 模式切换滑块
  - IconRail.tsx - 图标栏
  - SidePanel.tsx - 侧边栏
  - ChatPanel.tsx - 聊天面板
- 实现页面组件
  - WorkbenchMode.tsx - 工作台模式
  - ReadyMode.tsx - Ready 模式
  - Settings.tsx - 设置页面
- 实现 6 种工作台模式
  - BrowserMode.tsx - 浏览器模式
  - DocumentMode.tsx - 文档模式
  - ImageMode.tsx - 图像模式
  - VideoMode.tsx - 剪辑模式
  - RSSMode.tsx - RSS 模式
  - CalendarMode.tsx - 日程模式

#### 设计系统
- 实现 CSS 变量系统
  - 颜色变量 (bg-*, text-*, color-*)
  - 边框变量 (border-*)
- 配置 Tailwind CSS v4
- 添加动画效果 (fadeIn, slideIn)
- 添加滚动条样式

#### 文档
- CLAUDE.md - Agent 行为规范
- DEVELOPMENT_PLAN.md - 开发计划
- TASK_ASSIGNMENT.md - 任务分配
- LOCAL_HANDOFF.md - 本地处理事项
- CHANGELOG.md - 本文件

### 修复

#### TypeScript
- 修复类型检查错误
- 添加类型声明 (window.electronAPI)
- 配置 skipLibCheck 避免第三方库类型错误

#### 依赖
- 添加缺失依赖 (date-fns, @types/better-sqlite3)
- 更新 package.json scripts

### 变更

#### Mock 模式
- 添加 ENABLE_MOCK_SERVICES 环境变量控制
- 默认走真实链路
- Mock 模式显式标记返回值

#### 脚本
- `dev`: electron-vite dev
- `build`: npm run typecheck && electron-vite build
- `typecheck`: 同时检查 node 和 web
- `lint`: ESLint 检查

### 统计

- 文件数: 45+
- 代码行数: ~5000+
- TypeScript 文件: 29
- 配置文件: 8
- 文档文件: 5

---

## 待办

- [ ] 本地 npm install 验证
- [ ] Electron 启动验证
- [ ] Agent 系统集成测试
- [ ] 图像编辑器图层管理
- [ ] 视频编辑器 FFmpeg 集成
- [ ] 单元测试
- [ ] E2E 测试
- [ ] 代码签名
