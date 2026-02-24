# Ready V5 - 本地处理事项清单

> 本文档记录必须在本地 macOS 环境中完成的开发任务
> 更新日期: 2026-02-24

---

## P0 - 必须本地完成（阻塞开发）

### 1. 依赖安装
**原因**: 云端环境不支持符号链接和完整 npm 安装

```bash
cd /path/to/ready
npm install
```

**验证**:
```bash
npm run typecheck  # 应无类型错误
npm run lint       # 应无 lint 错误
npm run build      # 应构建成功
```

### 2. Electron 二进制下载
**原因**: Electron 需要从 GitHub 下载平台特定的二进制文件

```bash
# 配置国内镜像 (可选)
npm config set electron_mirror https://npmmirror.com/mirrors/electron/

# 安装后自动执行
npx electron --version
```

### 3. 原生模块编译
**原因**: better-sqlite3 需要本地编译

```bash
npm rebuild
# 或
npx electron-rebuild
```

---

## P1 - 推荐本地完成（功能完整）

### 4. Claude Code CLI 安装
**原因**: Agent 系统依赖 Claude Code CLI

```bash
# 安装 Claude Code
npm install -g @anthropic-ai/claude-code

# 验证
claude --version
```

### 5. FFmpeg 安装
**原因**: 视频处理需要本地 FFmpeg

```bash
# 使用 Homebrew
brew install ffmpeg

# 验证
ffmpeg -version
```

### 6. Git 配置
**原因**: WorktreePool 需要 Git 支持

```bash
git init
git config user.email "ready@localhost"
git config user.name "Ready"
```

---

## P2 - 可选本地完成（增强功能）

### 7. 代码签名（macOS）
**原因**: 分发需要 Apple 开发者证书

```bash
# 配置 electron-builder
# 修改 package.json 中的 build.mac.identity
```

### 8. 真实 API 密钥配置
**原因**: 云端使用 mock 数据

创建 `.env` 文件:
```
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
```

---

## 本地开发工作流

```bash
# 1. 克隆/复制项目
cp -r /mnt/okcomputer/output/ready ~/ready

# 2. 安装依赖
cd ~/ready
npm install

# 3. 类型检查
npm run typecheck

# 4. 启动开发
npm run dev

# 5. 构建测试
npm run build
```

---

## Mock 模式

如需在本地使用 Mock 模式，设置环境变量:

```bash
ENABLE_MOCK_SERVICES=true npm run dev
```

---

## 已知问题

1. **npm install 失败**: 文件系统限制，需本地安装
2. **Electron 下载超时**: 网络限制，需配置镜像
3. **原生模块编译**: 需要本地 Node.js 环境

---

## 云端已完成工作

✅ 项目结构创建
✅ TypeScript 配置
✅ 主进程模块（IPC、Agent、数据库）
✅ 渲染进程组件（UI、状态管理）
✅ 6 种工作台模式页面
✅ Ready 模式四面板布局
✅ 设计系统（Tailwind + CSS Variables）
✅ 类型检查通过
✅ ESLint 配置

---

## 联系

如有问题，请参考:
- 开发计划: `DEVELOPMENT_PLAN.md`
- 任务分配: `TASK_ASSIGNMENT.md`
- 更新日志: `CHANGELOG.md`
