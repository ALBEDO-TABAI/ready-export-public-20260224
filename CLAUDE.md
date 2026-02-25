# Ready 项目规范 (AI Agent 开发指引)

> 更新日期: 2026-02-25 | 项目版本: V5

## 项目概述

Ready 是一个面向自媒体创作者的 AI 桌面工作台，基于 Electron + React 构建。
核心理念是将浏览器、文档编辑、图像处理、视频剪辑、RSS 订阅、日历管理整合到一个统一界面中。

## 技术栈

| 层 | 技术 | 版本 |
|---|---|---|
| 桌面框架 | Electron | 34 |
| 前端框架 | React | 19 |
| 语言 | TypeScript | 5.7 |
| 构建 | Vite + electron-vite | 6.x |
| 样式 | Tailwind CSS + CSS Variables | v4 |
| 状态管理 | Zustand | 5.x |
| 图标 | Lucide React | - |
| 数据库 | better-sqlite3 | - |

## 项目结构

```
src/
├── main/                        # Electron 主进程 (~2200行)
│   ├── index.ts                 # 入口：窗口管理 + local-file:// 协议注册
│   └── modules/
│       ├── database.ts          # SQLite 数据库管理
│       ├── browser-engine/      # 浏览器引擎 (BrowserView IPC)
│       ├── calendar-engine/     # 日历模块 IPC
│       ├── claude-bridge/       # Agent 系统 (manager + worktree + IPC)
│       ├── document-engine/     # 文档引擎 (读/写/docx/xlsx IPC)
│       └── rss-engine/          # RSS 引擎 IPC
│
├── preload/
│   └── index.ts                 # IPC API 暴露给 renderer
│
└── renderer/                    # React 渲染进程 (~6600行)
    ├── App.tsx                  # 路由：/workbench, /ready, /settings
    ├── main.tsx                 # React 入口
    ├── index.html               # HTML + CSP 策略
    │
    ├── stores/                  # Zustand 状态管理 (5个)
    │   ├── useMode.ts           # 应用模式 (workbench/ready) + 工作台子模式 + 分屏
    │   ├── useDocTabs.ts        # 文档标签栏 (多标签/分栏/拖拽排序)
    │   ├── useAgent.ts          # Agent 通信状态
    │   ├── useWorkspace.ts      # 工作区 (文件树/目录/pinned folders)
    │   └── useTheme.ts          # 主题切换
    │
    ├── components/
    │   ├── layout/
    │   │   ├── TopBar.tsx       # 顶栏：模式切换按钮 + 搜索 + 分屏
    │   │   ├── IconRail.tsx     # 左侧图标栏 (文件/搜索/Agent)
    │   │   ├── SidePanel.tsx    # 侧边栏：文件树 + 搜索 + 上下文菜单 (~710行)
    │   │   ├── StatusBar.tsx    # 底部状态栏
    │   │   ├── ModeSlider.tsx   # 模式滑动指示器
    │   │   └── ContextMenu.tsx  # 右键菜单组件
    │   ├── agent/
    │   │   └── ChatPanel.tsx    # AI 助手对话面板
    │   └── ErrorBoundary.tsx    # 错误边界
    │
    ├── pages/
    │   ├── WorkbenchMode.tsx    # 工作台模式容器 (含分屏逻辑)
    │   ├── ReadyMode.tsx        # Ready 模式四面板
    │   ├── Settings.tsx         # 设置页面
    │   └── modes/               # 6种工作台子模式
    │       ├── BrowserMode.tsx  # 浏览器 (Electron BrowserView)
    │       ├── DocumentMode.tsx # 文档编辑器 (~710行，多标签+分栏+图片/视频/xlsx/pdf)
    │       ├── ImageMode.tsx    # 图像编辑器 (~838行)
    │       ├── VideoMode.tsx    # 视频编辑器 (~575行)
    │       ├── RSSMode.tsx      # RSS 订阅
    │       └── CalendarMode.tsx # 日历管理
    │
    ├── hooks/
    │   └── useKeyboardShortcuts.ts  # 全局快捷键
    ├── types/
    │   └── electron.d.ts        # Electron API 类型定义
    └── styles/
        └── index.css            # 全局样式 + 设计系统 (~323行)
```

## 核心架构

### 双模式系统
- **工作台模式** (Workbench): 6种子模式可切换 — 浏览器/文档/图像/视频/RSS/日历
- **Ready 模式**: 四面板实时概览（浏览器+文档+RSS+日历）

### 分屏机制
- TopBar 支持 Shift+Click 选择第二个工作模式，左右分栏显示
- 分隔条可拖拽调整宽度 (20%-80%)
- 单击回到单模式

### 文档标签系统
- `useDocTabs` store 管理多个打开的文档标签
- 支持 Markdown 编辑/预览/分栏、图片预览(缩放)、视频播放、xlsx 表格、docx、PDF
- 标签可拖拽重排序，Shift+Click 分栏对比
- 文件通过 `local-file://` 自定义协议加载本地文件

### 浏览器引擎
- 使用 Electron BrowserView (非 webview 标签)
- 多标签管理，持久化 session（可登录 Google 等）
- 导航历史、前进后退、加载状态

### 文件工作区
- 多根目录 pinned folders 模式
- 文件树支持新建/重命名/删除/拖拽导入
- Finder 拖拽文件/文件夹直接导入

## 开发命令

```bash
npm run dev          # 开发模式 (HMR)
npm run build        # 生产构建
npm run typecheck    # TypeScript 类型检查 (node + web 两遍)
npm run lint         # ESLint 检查
```

## 关键路径和常见修改

| 修改目标 | 文件路径 |
|---------|---------|
| 添加新工作台模式 | `stores/useMode.ts` + `pages/modes/` + `TopBar.tsx` |
| 修改文档编辑器 | `pages/modes/DocumentMode.tsx` + `stores/useDocTabs.ts` |
| 修改浏览器功能 | `pages/modes/BrowserMode.tsx` + `main/modules/browser-engine/` |
| 修改文件管理 | `components/layout/SidePanel.tsx` + `stores/useWorkspace.ts` |
| 修改顶栏 | `components/layout/TopBar.tsx` |
| 添加新 IPC | `main/modules/xxx/ipc-handler.ts` + `preload/index.ts` + `types/electron.d.ts` |
| 修改样式/主题 | `styles/index.css` + `stores/useTheme.ts` |
| 分屏逻辑 | `stores/useMode.ts` + `pages/WorkbenchMode.tsx` + `TopBar.tsx` |

## 已知问题 (截至 2026-02-25)

1. **图片/视频在文档标签中预览**: `local-file://` 协议 URL 格式可能还有问题，需要在 Electron 窗口中测试
2. **PDF 嵌入**: 已实现 `<embed>` 方案但未验证
3. **Agent 系统**: 依赖 Claude Code CLI，当前使用 mock
4. **打包/签名**: 未完成 Apple Developer 签名流程
5. **MaxListenersExceededWarning**: BrowserWindow 上事件监听器超过限制

## 安全约束

- CSP 策略在 `index.html` 中定义
- `local-file://` 协议需要 `registerSchemesAsPrivileged` 在 `app.whenReady()` 前注册
- `contextIsolation: true` + `nodeIntegration: false`
- IPC 通过 preload 脚本暴露白名单 API

## 环境变量 (.env)

```
ENABLE_MOCK_SERVICES=true   # 启用 mock 模式 (RSS/Calendar/Agent)
```

文档引擎 (document-engine) 始终使用真实文件系统，不受 mock 控制。
