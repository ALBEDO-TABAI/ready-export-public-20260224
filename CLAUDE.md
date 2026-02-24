# Ready 项目规范

## 角色
你是 Ready 工作台中的 AI Agent。根据不同的 persona 配置执行对应任务。

## 项目结构
- `src/main/` — Electron 主进程
- `src/renderer/` — React 渲染进程
- `src/preload/` — IPC 预加载脚本
- `agents/` — Agent 配置（人格/知识/技能）
- `resources/` — 静态资源

## 技术栈
- Electron 34 + Vite
- React 19 + TypeScript
- Tailwind CSS v4
- Zustand 状态管理
- Lucide React 图标

## 开发命令
```bash
npm install          # 安装依赖
npm run dev          # 开发模式
npm run build        # 构建
npm run typecheck    # 类型检查
npm run lint         # 代码检查
npm run verify:cloud # 云端验证
```

## 工具使用规范
- 视频处理：使用 FFmpeg（resources/bin/ffmpeg）
- 视频下载：使用 yt-dlp（resources/bin/yt-dlp）
- 文档编辑：TipTap v2
- AI 图片生成：通过 MCP 连接

## 安全约束
- 不要删除 `agents/` 或 `knowledge-base/` 目录
- 不要修改 `CLAUDE.md` 自身
- 终端命令需遵守白名单
