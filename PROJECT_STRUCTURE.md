# Ready V5 - 项目结构

```
ready/
├── .gitignore                    # Git 忽略规则
├── package.json                  # 项目依赖和脚本
├── electron.vite.config.ts       # Electron + Vite 配置
├── tsconfig.json                 # TypeScript 基础配置
├── tsconfig.node.json            # 主进程 TS 配置
├── tsconfig.web.json             # 渲染进程 TS 配置
├── eslint.config.mjs             # ESLint 配置
├── prettier.config.mjs           # Prettier 配置
│
├── CLAUDE.md                     # Agent 行为规范
├── LOCAL_HANDOFF.md              # 本地处理事项清单
├── DOCUMENTATION.md              # 文档覆盖清单
├── DELIVERY_REPORT.md            # 交付报告
├── PROJECT_STRUCTURE.md          # 本文件
│
├── src/
│   ├── main/                     # Electron 主进程
│   │   ├── index.ts              # 主入口，窗口管理
│   │   └── modules/
│   │       ├── database.ts       # SQLite 数据库
│   │       ├── browser-engine/
│   │       │   └── ipc-handler.ts    # 浏览器 IPC
│   │       ├── calendar-engine/
│   │       │   └── ipc-handler.ts    # 日程 IPC
│   │       ├── claude-bridge/
│   │       │   ├── agent-manager.ts  # Agent 管理
│   │       │   ├── worktree-pool.ts  # Git Worktree
│   │       │   └── ipc-handler.ts    # Agent IPC
│   │       ├── document-engine/
│   │       │   └── ipc-handler.ts    # 文档 IPC
│   │       └── rss-engine/
│   │           └── ipc-handler.ts    # RSS IPC
│   │
│   ├── preload/                  # IPC 预加载脚本
│   │   └── index.ts              # 暴露 API 给渲染进程
│   │
│   └── renderer/                 # React 渲染进程
│       ├── index.html            # HTML 模板
│       ├── main.tsx              # React 渲染入口
│       ├── App.tsx               # 应用根组件
│       │
│       ├── styles/
│       │   └── index.css         # 全局样式 + 设计系统
│       │
│       ├── stores/               # Zustand 状态管理
│       │   ├── useMode.ts        # 模式状态
│       │   ├── useAgent.ts       # Agent 状态
│       │   └── useWorkspace.ts   # 工作区状态
│       │
│       ├── components/
│       │   ├── layout/           # 布局组件
│       │   │   ├── TopBar.tsx
│       │   │   ├── ModeSlider.tsx
│       │   │   ├── IconRail.tsx
│       │   │   └── SidePanel.tsx
│       │   └── agent/
│       │       └── ChatPanel.tsx
│       │
│       └── pages/                # 页面组件
│           ├── WorkbenchMode.tsx # 工作台模式
│           ├── ReadyMode.tsx     # Ready 模式
│           ├── Settings.tsx      # 设置页面
│           └── modes/            # 6 种工作台模式
│               ├── BrowserMode.tsx
│               ├── DocumentMode.tsx
│               ├── ImageMode.tsx
│               ├── VideoMode.tsx
│               ├── RSSMode.tsx
│               └── CalendarMode.tsx
│
└── resources/                    # 静态资源（待添加）
    └── icon.png
```

## 文件统计

| 类别 | 数量 | 说明 |
|------|------|------|
| 配置文件 | 8 | package.json, tsconfig, eslint, prettier |
| 主进程代码 | 9 | 窗口、Agent、数据库、IPC 处理器 |
| 预加载脚本 | 1 | IPC API 暴露 |
| 渲染进程代码 | 20 | React 组件、页面、状态管理 |
| 样式文件 | 1 | CSS + Tailwind |
| 文档 | 5 | CLAUDE.md, LOCAL_HANDOFF.md 等 |
| **总计** | **44** | 约 5000+ 行代码 |

## 技术栈

- **框架**: Electron 34 + React 19 + TypeScript 5.7
- **构建**: Vite 6 + electron-vite
- **样式**: Tailwind CSS v4 + CSS Variables
- **状态**: Zustand
- **图标**: Lucide React
- **数据库**: better-sqlite3
