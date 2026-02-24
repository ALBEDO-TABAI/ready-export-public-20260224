# TASK BRIEF TEMPLATE

## 1. Task ID

`TASK-YYYYMMDD-XX`

## 2. Goal

用 2-4 句描述本轮目标和业务价值。

## 3. Allowed Files

只允许修改以下文件或目录：

```text
src/main/modules/...
src/preload/index.ts
src/renderer/stores/...
```

## 4. Forbidden Changes

明确禁止项：

- 不修改 UI 视觉样式
- 不重命名核心目录
- 不引入重型依赖
- 不改动任务外文件

## 5. Acceptance Criteria

必须满足：

1. `npm run typecheck` 通过
2. `npm run lint` 无 error（warning 可说明）
3. `npm run build` 通过
4. 指定功能按步骤可复现

## 6. Test Steps

给出 3-6 条手工步骤，确保 Kimi 可执行验证。

## 7. Output Requirements

必须回传：

1. `PATCH.diff`
2. `CHANGE_REPORT.md`
3. `COMMAND_LOG.md`

## 8. Context Notes

补充背景、历史问题、风险点、已知限制。
