# Ready V5 - 开发计划

> 更新日期: 2026-02-25

## 当前进度概览

| 模块 | 状态 | 完成度 | 说明 |
|------|------|--------|------|
| 项目架构 | ✅ 完成 | 100% | Electron + React + Vite + TS |
| UI 布局 | ✅ 完成 | 100% | TopBar + IconRail + SidePanel + StatusBar |
| 文件管理 | ✅ 完成 | 95% | 树形目录 + 多根 + 拖拽 + CRUD |
| 浏览器模式 | ✅ 完成 | 90% | BrowserView + 多标签 + 持久 Session |
| 文档模式 | 🔧 进行中 | 80% | 多标签 + md 编辑 ✅ / 图片视频预览 ⚠️ |
| 分屏功能 | ✅ 完成 | 90% | Shift+Click + 拖拽分隔条 |
| 图像编辑 | ⬜ 骨架 | 30% | UI 已搭建，核心功能待实现 |
| 视频编辑 | ⬜ 骨架 | 25% | UI 已搭建，FFmpeg 集成待完成 |
| RSS 模块 | ⬜ 骨架 | 25% | UI + mock 数据，真实抓取待接入 |
| 日历模块 | ⬜ 骨架 | 25% | UI + mock 数据，同步待接入 |
| Agent 系统 | ⬜ mock | 20% | 架构完整，Claude CLI 集成待完成 |
| 数据库 | ✅ 完成 | 80% | better-sqlite3 已集成，迁移需完善 |

---

## 已完成的重要功能 (按时间线)

### Sprint A (2026-02-24): 初始交付
- [x] 完整项目架构 (Electron 34 + React 19 + Vite 6)
- [x] TypeScript 全覆盖 + 类型检查通过
- [x] 6 种工作台模式页面骨架
- [x] Ready 模式四面板布局
- [x] 设计系统 (CSS Variables + Tailwind v4)
- [x] SQLite 数据库集成
- [x] Agent 管理架构 (manager + worktree + IPC)

### Sprint B (2026-02-24 ~ 02-25): 核心功能
- [x] 文件管理器改为 IDE 风格树形展开
- [x] Finder 拖拽导入文件/文件夹
- [x] 多根目录工作区 (pinned folders)
- [x] 工作区管理 (新建/保存/加载/切换)
- [x] 浏览器改用 BrowserView (完整可用)
- [x] 浏览器多标签 + 持久化登录 + 键盘滚动
- [x] 工作台 Shift+Click 分屏模式
- [x] 分屏分隔条可拖拽调整宽度

### Sprint C (2026-02-25): 文档增强
- [x] 文档模式标签栏管理 (多标签/拖拽排序)
- [x] 标签 Shift+Click 分栏对比
- [x] Markdown 编辑/预览/分栏切换
- [x] xlsx/csv 表格预览 (JSON 数据渲染)
- [x] docx 解析预览
- [x] 图片/视频预览框架 (local-file:// 协议)
- [x] `local-file://` 自定义协议注册 (privileged scheme)

---

## 当前未解决问题

### P0 (阻塞用户使用)
1. **图片/视频预览不可用**: `local-file://` 协议 URL 在 Electron 窗口中仍可能有问题
   - 文件: `DocumentMode.tsx` fileUrl 变量, `main/index.ts` protocol.handle
   - 调试方向: 检查 Electron 中 `protocol.handle` 的实际行为

### P1 (功能缺失)
2. **非 markdown 文件的工具栏为空**: xlsx/docx/pdf 打开时顶部工具栏区域空白
3. **PDF 嵌入未验证**: `<embed>` 方案不确定是否能通过 local-file:// 加载
4. **Agent 系统**: 仍使用 mock，需要集成真实 Claude Code CLI

### P2 (体验优化)
5. **MaxListenersExceeded 警告**: BrowserWindow 事件监听器超限
6. **图像编辑器**: 仅有 UI 骨架，缺少 Canvas 操作和 AI 图像生成
7. **视频编辑器**: 仅有 UI 骨架，缺少 FFmpeg 集成和时间线操作
8. **RSS/日历**: 仅有 mock 数据，需要接入真实数据源

---

## 下一步开发计划

### 迭代 1: 文档模式完善 (P0)
- [ ] 修复 local-file:// 图片/视频加载
- [ ] 非 markdown 文件类型的工具栏显示
- [ ] PDF 预览验证
- [ ] 编辑器自动保存

### 迭代 2: Agent 系统集成 (P0)
- [ ] Claude Code CLI 安装与测试
- [ ] Agent ↔ 工作台双向通信
- [ ] Agent 人格配置
- [ ] Agent 状态持久化

### 迭代 3: 多媒体功能 (P1)
- [ ] 图像编辑器 Canvas 集成
- [ ] 视频编辑器 FFmpeg 集成
- [ ] AI 图像生成接口

### 迭代 4: 数据源接入 (P2)
- [ ] RSS 真实抓取
- [ ] 日历 API 同步
- [ ] 数据库迁移脚本

### 迭代 5: 发布准备 (P2)
- [ ] Apple Developer 签名
- [ ] 自动更新
- [ ] 性能优化

---

## 环境要求

- macOS 14+ (目前仅支持 macOS)
- Node.js 20+
- Xcode Command Line Tools (native 模块编译)
- 可选: FFmpeg, Claude Code CLI

## Mock 模式

```bash
# 默认 dev 模式不使用 mock
npm run dev

# 启用 mock (RSS/Calendar/Agent 使用假数据)
ENABLE_MOCK_SERVICES=true npm run dev
```

文档引擎始终使用真实文件系统 (`DOCUMENT_USE_MOCK = false`)。
