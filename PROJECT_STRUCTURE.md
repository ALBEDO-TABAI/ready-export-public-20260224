# Ready V5 - 项目结构

> 更新日期: 2026-02-25 | 代码统计: 39 文件, 9365 行

```
ready/
├── .env                           # 环境变量 (ENABLE_MOCK_SERVICES)
├── .gitignore                     # Git 忽略规则
├── package.json                   # 依赖和脚本
├── electron.vite.config.ts        # Electron + Vite 构建配置
├── electron-builder.yml           # 打包配置 (AppImage/DMG/NSIS)
├── tsconfig.json                  # TS 共享配置
├── tsconfig.node.json             # 主进程 TS (ESNext + CommonJS)
├── tsconfig.web.json              # 渲染进程 TS (ESNext + React JSX)
├── eslint.config.mjs              # ESLint flat config
├── prettier.config.mjs            # Prettier 格式化
│
├── CLAUDE.md                      # ★ AI Agent 开发指引 (必读)
├── PROJECT_STRUCTURE.md           # 本文件
├── DEVELOPMENT_PLAN.md            # 开发计划与进度
├── CHANGELOG.md                   # 变更日志
├── DELIVERY_REPORT.md             # 初始交付报告
│
├── src/
│   ├── main/                      # === Electron 主进程 (2196行) ===
│   │   ├── index.ts               # [160行] 窗口管理 + local-file:// 协议
│   │   └── modules/
│   │       ├── database.ts              # [203行] SQLite (better-sqlite3)
│   │       ├── browser-engine/
│   │       │   └── ipc-handler.ts       # [298行] BrowserView 多标签管理
│   │       ├── calendar-engine/
│   │       │   └── ipc-handler.ts       # [183行] 日历 CRUD + mock
│   │       ├── claude-bridge/
│   │       │   ├── agent-manager.ts     # [451行] Agent 生命周期管理
│   │       │   ├── worktree-pool.ts     # [260行] Git Worktree 池
│   │       │   └── ipc-handler.ts       # [105行] Agent IPC
│   │       ├── document-engine/
│   │       │   └── ipc-handler.ts       # [347行] 文件读写/docx/xlsx 解析
│   │       └── rss-engine/
│   │           └── ipc-handler.ts       # [189行] RSS 订阅 CRUD + mock
│   │
│   ├── preload/
│   │   └── index.ts               # IPC API 桥接 (contextBridge)
│   │
│   └── renderer/                  # === React 渲染进程 (6644行) ===
│       ├── App.tsx                # [~50行] React Router: /workbench, /ready, /settings
│       ├── main.tsx               # [~20行] React 挂载入口
│       ├── index.html             # HTML + CSP 安全策略
│       │
│       ├── stores/                # --- Zustand 状态管理 (5个, 803行) ---
│       │   ├── useMode.ts         # [30行] 模式切换 + 分屏状态
│       │   ├── useDocTabs.ts      # [145行] 文档标签管理 (多标签/拖拽/分栏)
│       │   ├── useAgent.ts        # [201行] Agent 通信 + 消息历史
│       │   ├── useWorkspace.ts    # [384行] 文件树 + pinned folders + CRUD
│       │   └── useTheme.ts        # [43行] 亮/暗主题切换
│       │
│       ├── components/            # --- UI 组件 ---
│       │   ├── layout/
│       │   │   ├── TopBar.tsx         # [129行] 模式切换 + 搜索 + 分屏按钮
│       │   │   ├── IconRail.tsx       # [66行] 左侧图标导航栏
│       │   │   ├── SidePanel.tsx      # [710行] ★ 文件管理器 (树形/搜索/右键菜单/拖拽)
│       │   │   ├── StatusBar.tsx      # [44行] 底部状态栏
│       │   │   ├── ModeSlider.tsx     # [47行] 模式滑块指示器
│       │   │   └── ContextMenu.tsx    # [97行] 通用右键菜单
│       │   ├── agent/
│       │   │   └── ChatPanel.tsx      # [277行] AI 助手对话界面
│       │   └── ErrorBoundary.tsx      # [89行] React 错误边界
│       │
│       ├── pages/                 # --- 页面组件 ---
│       │   ├── WorkbenchMode.tsx  # [~200行] 工作台容器 (含分屏渲染)
│       │   ├── ReadyMode.tsx      # [~300行] Ready 模式四面板概览
│       │   ├── Settings.tsx       # [~100行] 设置页面
│       │   └── modes/             # --- 6种工作台子模式 ---
│       │       ├── DocumentMode.tsx   # [710行] ★ 文档编辑器 (标签栏/md/图片/视频/xlsx/pdf)
│       │       ├── BrowserMode.tsx    # [~374行] 浏览器 (BrowserView + 多标签)
│       │       ├── ImageMode.tsx      # [838行] 图像编辑器 (画布/图层)
│       │       ├── VideoMode.tsx      # [575行] 视频编辑器 (时间线/轨道)
│       │       ├── RSSMode.tsx        # [311行] RSS 订阅管理
│       │       └── CalendarMode.tsx   # [~200行] 日历视图
│       │
│       ├── hooks/
│       │   └── useKeyboardShortcuts.ts  # [54行] 全局快捷键 (Cmd+1~6 模式切换)
│       ├── types/
│       │   └── electron.d.ts       # Electron preload API 类型定义
│       └── styles/
│           └── index.css           # [323行] CSS Variables + Tailwind 自定义
│
├── scripts/
│   └── verify.ts                  # 验证脚本
│
└── resources/                     # 静态资源
    └── icon.png
```

## 文件统计

| 类别 | 文件数 | 代码行数 | 说明 |
|------|--------|---------|------|
| 主进程 | 9 | ~2200 | 窗口、数据库、5个 IPC 模块、Agent 管理 |
| 预加载脚本 | 1 | ~150 | contextBridge API 暴露 |
| 状态管理 | 5 | ~800 | Zustand stores |
| 布局组件 | 7 | ~1200 | TopBar、SidePanel、IconRail 等 |
| 页面组件 | 9 | ~3300 | 工作台/Ready 模式 + 6种子模式 |
| 钩子/类型 | 2 | ~200 | 快捷键、Electron API 类型 |
| 样式 | 1 | ~320 | CSS Variables 设计系统 |
| 测试 | 3 | ~300 | 基础架构测试 |
| **总计** | **39** | **~9400** | TypeScript + TSX + CSS |
